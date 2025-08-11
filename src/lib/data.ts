import { collection, doc, getDoc, getDocs, query, where, updateDoc, arrayUnion, arrayRemove, writeBatch, WriteBatch, limit, startAt, orderBy, endAt, addDoc, serverTimestamp, Timestamp, deleteDoc, startAfter, QueryDocumentSnapshot, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import type { User as FirebaseUser } from 'firebase/auth';
import { generateGoalTips } from "@/ai/flows/generate-goal-tips";

export type User = {
  id: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  email: string;
  photoUrl: string;
  isPremium?: boolean;
  isAdmin?: boolean;
  displayName_lowercase?: string;
  ecoScores?: TraitScore[];
  familyScores?: TraitScore[];
  attractionScores?: TraitScore[]; // For premium attraction ratings
  revealTokens?: number;
  lastTokenReset?: Timestamp | Date;
  createdAt?: Timestamp;
  stripeId?: string;
};

export type TraitScore = {
  name: string;
  averageScore: number;
};

export type Circle = {
  id:string;
  ownerId: string;
  name: "Friends" | "Family" | "Work" | "General";
  members: User[];
  traits: TraitScore[];
  memberIds: string[];
  historicalRatings?: RatingCycle[]; // Optional, only populated for circle details
  myRatings?: Record<string, Timestamp | null>; // Optional, only for circle details page. Map from ratedUserId -> timestamp
};

export type Rating = {
  id: string;
  fromUserId: string;
  toUserId: string;
  circleId: string;
  circleName: Circle['name'];
  ratings: Record<string, number>;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
};

// New type for the premium attractiveness ratings
export type AttractionRating = {
    id: string;
    fromUserId: string;
    fromUser?: User; // Will be populated for display
    toUserId: string;
    ratings: Record<string, number>;
    isAnonymous: boolean; // Key for the new feature logic
    isOutOfCircles?: boolean; // New flag for out-of-circle ratings
    createdAt: Timestamp;
    updatedAt?: Timestamp;
    revealRequestStatus?: 'none' | 'pending' | 'accepted' | 'declined';
};

export type RevealRequest = {
  id: string;
  fromUserId: string; // The premium user asking for reveal
  fromUser?: User;
  toUserId: string;   // The user who rated anonymously
  ratingId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Timestamp;
};

export type FamilyGoal = {
    id: string;
    fromUserId: string;
    fromUser?: User;
    toUserId: string;
    toUser?: User;
    trait: string;
    status: 'pending' | 'active' | 'declined' | 'completed';
    startDate?: Timestamp;
    endDate?: Timestamp;
    createdAt: Timestamp;
    tip?: string;
};


export type RatingCycle = {
    date: Date;
    averageScore: number;
};

export type Invite = {
  id: string;
  fromUserId: string;
  fromUser?: User;
  toEmail?: string; 
  toUserId?: string;
  toUser?: User;
  circleId?: string; // This is the ID of the *inviter's* circle
  circleName?: Circle['name'];
  status: "pending" | "accepted" | "declined";
  createdAt: {
    seconds: number;
    nanoseconds: number;
  }
};

export type SuggestedUser = {
  user: User;
  viaUser: User;
  viaCircle: Circle['name'];
};

export type Feedback = {
  id: string;
  userId: string;
  user?: User; // Populated for display
  designRating: number;
  intuitivenessRating: number;
  featureSatisfaction: number;
  performanceRating: number;
  recommendLikelihood: number;
  comments: string;
  createdAt: Timestamp;
};


export const traitDefinitions: Record<string, string> = {
    // Family
    "Caring": "Shows kindness and concern for others' well-being and feelings.",
    "Respectful": "Treats others with consideration and values their opinions and boundaries.",
    "Dependable": "Can be relied upon to follow through on commitments and promises.",
    "Loving": "Expresses affection, warmth, and deep care for family members.",
    "Protective": "Instinctively looks out for the safety and best interests of the family.",
    // Work
    "Professional": "Maintains a high standard of conduct, ethics, and competence in a work environment.",
    "Reliable": "Consistently delivers quality work on time and can be counted on by colleagues.",
    "Organized": "Manages time, tasks, and resources efficiently to achieve goals.",
    "Collaborative": "Works effectively with others, sharing ideas and contributing to a team effort.",
    "Punctual": "Is consistently on time for meetings, deadlines, and work commitments.",
    // Friends
    "Loyal": "Stands by their friends through good times and bad; is steadfast and faithful.",
    "Honest": "Communicates truthfully and openly, even when it's difficult.",
    "Fun": "Brings energy, humor, and enjoyment to social interactions.",
    "Supportive": "Offers encouragement and help to friends when they are in need.",
    "Encouraging": "Inspires and gives confidence to others to pursue their goals.",
    // General
    "Polite": "Uses good manners and shows consideration in interactions with everyone.",
    "Friendly": "Is approachable, warm, and makes others feel comfortable.",
    "Trustworthy": "Can be confided in and relied upon to be honest and keep promises.",
    "Open-minded": "Is willing to consider new ideas and different perspectives without prejudice.",
    "Observant": "Pays close attention to details and notices things others might miss.",
};

// A separate, specific list for the new premium rating feature
export const attractionTraits: { name: string, definition: string }[] = [
    { name: "Charming", definition: "Has a captivating and delightful personality." },
    { name: "Witty", definition: "Shows quick and inventive verbal humor." },
    { name: "Passionate", definition: "Expresses strong feelings or beliefs with intensity." },
    { name: "Good-looking", definition: "Is physically attractive." },
    { name: "Authenticity", definition: "Is genuine and true to themselves." },
];

export const familyGoalTraits = ["Patience", "Better Listening", "Being Present", "Showing Appreciation"];

export const ecoTraitDefinitions: Record<string, string> = {
    "Energy": "Awareness and reduction of home energy use.",
    "Waste": "Efforts to reduce, reuse, and recycle.",
    "Transport": "Reliance on sustainable transport methods.",
    "Consumption": "Mindful purchasing habits for sustainable products.",
    "Water": "Conservation of water in daily life.",
};

/**
 * A centralized function to create a new user's document in Firestore
 * and set up their initial circles. This ensures consistency for all signup methods.
 * The corresponding Stripe customer is created by a Cloud Function.
 * @param fbUser The Firebase Auth user object.
 * @param additionalData Optional data like first and last name for email signups.
 */
export async function createNewUserData(fbUser: FirebaseUser, additionalData: { firstName?: string, lastName?: string } = {}) {
  const userDocRef = doc(db, 'users', fbUser.uid);

  const displayName = fbUser.displayName || `${additionalData.firstName} ${additionalData.lastName}`.trim();

  const newUser: Omit<User, 'id' | 'stripeId'> = {
    displayName: displayName,
    firstName: additionalData.firstName || fbUser.displayName?.split(' ')[0] || '',
    lastName: additionalData.lastName || fbUser.displayName?.split(' ').slice(1).join(' ') || '',
    displayName_lowercase: displayName.toLowerCase(),
    email: fbUser.email || '',
    photoUrl: fbUser.photoURL || `https://placehold.co/100x100.png?text=${displayName.charAt(0)}`,
    createdAt: serverTimestamp() as Timestamp,
    isPremium: false,
    revealTokens: 0,
  };

  // Use a batch for all writes for atomicity
  const batch = writeBatch(db);
  
  // 1. Set the user document
  batch.set(userDocRef, newUser, { merge: true }); // Use merge to avoid overwriting stripeId if function runs first

  // 2. Set up default circles
  const circlesCol = collection(db, 'circles');
  defaultCircles.forEach((circleData) => {
    const newCircleRef = doc(circlesCol);
    const dataWithOwner = {
      ...circleData,
      ownerId: fbUser.uid,
      memberIds: [fbUser.uid]
    };
    batch.set(newCircleRef, dataWithOwner);
  });

  // 3. Process any pending invites for this user's email
  if (fbUser.email) {
    await processInvitesForNewUser(batch, fbUser.uid, fbUser.email);
  }

  // 4. Commit all operations
  await batch.commit();
  console.log(`Successfully created initial Firestore data for user ${fbUser.uid}`);
}


export async function getCirclesForUser(userId: string): Promise<Circle[]> {
    const circlesCol = collection(db, 'circles');
    // Fetch all circles where the user is the owner.
    const q = query(circlesCol, where('ownerId', '==', userId));
    const querySnapshot = await getDocs(q);
    const circles: Circle[] = [];

    for (const docSnap of querySnapshot.docs) {
        const circleData = docSnap.data() as Omit<Circle, 'id' | 'members' | 'traits'> & { traits: {name: string}[] };
        
        const memberIds = circleData.memberIds || [];
        
        const memberDocs = await Promise.all(
          memberIds.map(id => getDoc(doc(db, 'users', id)))
        );
        const members = memberDocs
          .filter(doc => doc.exists())
          .map(doc => ({id: doc.id, ...doc.data()} as User));
        
        const isPrivacyProtectedCircle = ["Work", "Friends", "General"].includes(circleData.name);
        const hasEnoughMembers = memberIds.length >= 4;

        let receivedRatings: Record<string, number>[] = [];
        if (!isPrivacyProtectedCircle || hasEnoughMembers) {
            // Find all ratings given to me (the owner) for this specific circle *type*
            const ratingsQuery = query(
                collection(db, "ratings"),
                where("circleName", "==", circleData.name),
                where("toUserId", "==", userId)
            );
            const ratingsSnapshot = await getDocs(ratingsQuery);
            
            // This will be an array of rating objects, e.g. [{ "Caring": 8, "Respectful": 9 }, { "Caring": 7, "Respectful": 10 }]
            receivedRatings = ratingsSnapshot.docs.map(d => d.data().ratings as Record<string, number>);
        }

        // Calculate the average score for each trait defined in the circle
        const userTraitScores: TraitScore[] = circleData.traits.map(trait => {
            if (isPrivacyProtectedCircle && !hasEnoughMembers) {
                return {
                    name: trait.name,
                    averageScore: 0
                };
            }
            const scoresForTrait = receivedRatings
              .map(r => r[trait.name])
              .filter(score => typeof score === 'number');
            
            const averageScore = scoresForTrait.length > 0
                ? scoresForTrait.reduce((sum, score) => sum + score, 0) / scoresForTrait.length
                : 0;
            
            return {
                name: trait.name,
                averageScore: parseFloat(averageScore.toFixed(1))
            };
        });

        circles.push({
            id: docSnap.id,
            ownerId: circleData.ownerId,
            name: circleData.name,
            memberIds: memberIds,
            members: members,
            traits: userTraitScores, // Correctly pass the array here
        } as Circle);
    }
    return circles;
};

// Gets the circles *owned* by the user, for the purpose of inviting others.
export async function getOwnedCirclesForUser(userId: string): Promise<Omit<Circle, 'members' | 'traits'>[]> {
    const circlesCol = collection(db, 'circles');
    const q = query(circlesCol, where('ownerId', '==', userId));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(docSnap => {
      const circleData = docSnap.data();
      return {
        id: docSnap.id,
        name: circleData.name,
        ownerId: circleData.ownerId,
        memberIds: circleData.memberIds,
      } as Omit<Circle, 'members' | 'traits'>;
    });
}


export async function getCircleById(id: string, currentUserId: string): Promise<Circle | null> {
    const circleDocRef = doc(db, 'circles', id);
    const docSnap = await getDoc(circleDocRef);

    if (!docSnap.exists()) {
        return null;
    }

    const circleData = docSnap.data() as Omit<Circle, 'id' | 'members' | 'historicalRatings' | 'myRatings'>;
    
    // A user can only see the details of a circle they own.
    if (circleData.ownerId !== currentUserId) {
      return null;
    }

    const members = (await Promise.all(
        circleData.memberIds.map(id => getUserById(id))
    )).filter((m): m is User => m !== null);

    // Fetch historical ratings for the current user in this circle
    const ratingsQuery = query(
        collection(db, "ratings"),
        where("circleName", "==", circleData.name),
        where("toUserId", "==", currentUserId)
    );
    const ratingsSnapshot = await getDocs(ratingsQuery);
    const ratings = ratingsSnapshot.docs.map(d => d.data() as Rating);

    // Group ratings by month
    const ratingsByMonth: { [key: string]: number[] } = {};
    ratings.forEach(rating => {
        const month = rating.createdAt.toDate().toISOString().slice(0, 7); // YYYY-MM
        if (!ratingsByMonth[month]) {
            ratingsByMonth[month] = [];
        }
        const scores = Object.values(rating.ratings);
        const avgRating = scores.reduce((a, b) => a + b, 0) / scores.length;
        ratingsByMonth[month].push(avgRating);
    });

    const historicalRatings: RatingCycle[] = Object.keys(ratingsByMonth).map(month => {
        const scores = ratingsByMonth[month];
        const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        return {
            date: new Date(month + "-02"), // Use day 2 to avoid timezone issues
            averageScore: parseFloat(averageScore.toFixed(1)),
        };
    }).sort((a,b) => a.date.getTime() - b.date.getTime());

    // Fetch all ratings made BY the current user in this circle
    const myRatingsQuery = query(
        collection(db, "ratings"),
        where("circleName", "==", circleData.name),
        where("fromUserId", "==", currentUserId)
    );
    const myRatingsSnapshot = await getDocs(myRatingsQuery);
    const myRatings: Record<string, Timestamp | null> = {};
    myRatingsSnapshot.docs.forEach(doc => {
        const ratingData = doc.data() as Rating;
        const ratingTimestamp = ratingData.updatedAt || ratingData.createdAt;
        myRatings[ratingData.toUserId] = ratingTimestamp;
    });

    return {
        id: docSnap.id,
        ...circleData,
        members,
        historicalRatings,
        myRatings
    } as Circle;
}

export async function getUserById(id: string): Promise<User | null> {
    if (!id) return null;
    const userDocRef = doc(db, 'users', id);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
        const user = { id: docSnap.id, ...docSnap.data() } as User;
        // This is a backfill mechanism to make older users searchable.
        if (user.displayName && !user.displayName_lowercase) {
             await updateDoc(userDocRef, { displayName_lowercase: user.displayName.toLowerCase() });
             user.displayName_lowercase = user.displayName.toLowerCase();
        }
        return user;
    } else {
        return null;
    }
}

// Optimized function to fetch multiple users by their IDs efficiently.
export async function getUsersByIds(ids: string[]): Promise<Map<string, User>> {
    const usersMap = new Map<string, User>();
    const uniqueIds = [...new Set(ids.filter(id => !!id))]; // Filter out falsy IDs and get unique ones

    if (uniqueIds.length === 0) {
        return usersMap;
    }
    
    // Firestore 'in' query is limited to 30 items. We need to batch requests if there are more.
    const batches: Promise<void>[] = [];
    for (let i = 0; i < uniqueIds.length; i += 30) {
        const batchIds = uniqueIds.slice(i, i + 30);
        const q = query(collection(db, 'users'), where('__name__', 'in', batchIds));
        batches.push(
            getDocs(q).then(snapshot => {
                snapshot.forEach(doc => {
                    usersMap.set(doc.id, { id: doc.id, ...doc.data() } as User);
                });
            })
        );
    }
    
    await Promise.all(batches);
    return usersMap;
}


export async function getUserByEmail(email: string): Promise<User | null> {
    if (!email) return null;
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email), limit(1));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        return null;
    }
    const userDoc = querySnapshot.docs[0];
    return { id: userDoc.id, ...userDoc.data() } as User;
}

export async function checkIfUserExistsByEmail(email: string): Promise<boolean> {
  const user = await getUserByEmail(email);
  return !!user;
}

export async function searchUsers(searchText: string, currentUserId: string): Promise<User[]> {
  const lowercasedSearchText = searchText.trim().toLowerCase();
  if (lowercasedSearchText.length < 1) return [];

  const usersRef = collection(db, "users");
  const q = query(
    usersRef,
    orderBy('displayName_lowercase'),
    startAt(lowercasedSearchText),
    endAt(lowercasedSearchText + '\uf8ff'),
    limit(10)
  );
  
  const querySnapshot = await getDocs(q);
  const users = querySnapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() } as User))
    .filter(user => user.id !== currentUserId);

  return users;
}

export async function getSuggestedUsers(userId: string): Promise<SuggestedUser[]> {
    const suggestionsMap = new Map<string, SuggestedUser>();

    // Step 1: Get all circles owned by the current user.
    const myOwnedCircles = await getOwnedCirclesForUser(userId);
    const myConnections = new Set<string>([userId]);
    const connectionContext = new Map<string, Set<Circle['name']>>();

    // Populate 1st-degree connections and their contexts (the circles we share).
    for (const circle of myOwnedCircles) {
        const fullCircle = await getCircleById(circle.id, userId);
        if (!fullCircle) continue;

        for (const memberId of fullCircle.memberIds) {
            if (memberId !== userId) {
                myConnections.add(memberId);
                if (!connectionContext.has(memberId)) {
                    connectionContext.set(memberId, new Set());
                }
                connectionContext.get(memberId)!.add(fullCircle.name);
            }
        }
    }

    // Step 2: Iterate through 1st-degree connections to find 2nd-degree connections.
    for (const [connectionId, sharedCircleNames] of connectionContext.entries()) {
        const viaUser = await getUserById(connectionId);
        if (!viaUser) continue;

        // Get the circles owned by this connection.
        const theirOwnedCircles = await getOwnedCirclesForUser(connectionId);

        for (const theirCircle of theirOwnedCircles) {
            // Check if we share a circle of this type with the connection.
            if (sharedCircleNames.has(theirCircle.name)) {
                const theirFullCircle = await getCircleById(theirCircle.id, connectionId);
                if (!theirFullCircle) continue;

                for (const potentialSuggestionId of theirFullCircle.memberIds) {
                    // Check if this person is not the user and not already a 1st-degree connection.
                    if (!myConnections.has(potentialSuggestionId) && !suggestionsMap.has(potentialSuggestionId)) {
                        const suggestedUser = await getUserById(potentialSuggestionId);
                        if (suggestedUser) {
                            suggestionsMap.set(potentialSuggestionId, {
                                user: suggestedUser,
                                viaUser: viaUser,
                                viaCircle: theirCircle.name, // The circle name that connects them.
                            });
                        }
                    }
                }
            }
        }
    }

    return Array.from(suggestionsMap.values()).slice(0, 10);
}


type SendInvitePayload = {
  fromUserId: string;
  toUserId?: string;
  toEmail?: string;
  circleId?: string; // The ID of the inviter's circle
  circleName?: Circle['name'];
};

export async function sendInvite(payload: SendInvitePayload): Promise<void> {
  // If we have an email, check if a user already exists with it.
  if (payload.toEmail) {
    const existingUser = await getUserByEmail(payload.toEmail);
    if (existingUser) {
      // If user exists, attach their ID to the invite.
      payload.toUserId = existingUser.id;
    }
  }
  
  const toUserId = payload.toUserId;
  const circleId = payload.circleId;

  // Ensure we have a user and circle to check against
  if (!toUserId || !circleId) {
    throw new Error("Missing user or circle information for the invite.");
  }

  // Check if the user is already a member of the circle
  const circleDocRef = doc(db, 'circles', circleId);
  const circleSnap = await getDoc(circleDocRef);
  if (circleSnap.exists()) {
    const circleData = circleSnap.data();
    if (circleData.memberIds && circleData.memberIds.includes(toUserId)) {
      const invitedUser = await getUserById(toUserId);
      const invitedUserName = invitedUser ? invitedUser.displayName : "This user";
      throw new Error(`${invitedUserName} is already a member of this circle.`);
    }
  }

  // Check for an existing pending invite to the same user and circle
  const invitesRef = collection(db, 'invites');
  const q = query(invitesRef, 
    where('fromUserId', '==', payload.fromUserId), 
    where('toUserId', '==', toUserId),
    where('circleId', '==', circleId),
    where('status', '==', 'pending')
  );
  const existingInvites = await getDocs(q);
  if (!existingInvites.empty) {
    // You could throw an error or just return silently
    throw new Error("An invitation to this user for this circle already exists.");
  }


  await addDoc(collection(db, "invites"), {
    ...payload,
    status: "pending",
    createdAt: serverTimestamp(),
  });
}


export async function getSentInvitesForUser(userId: string): Promise<Invite[]> {
    const invitesCol = collection(db, 'invites');
    const q = query(
        invitesCol, 
        where('fromUserId', '==', userId),
        where('status', '==', 'pending')
    );
    const querySnapshot = await getDocs(q);
    const invitesData = querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Invite));

    const userIdsToFetch = invitesData.map(invite => invite.toUserId).filter(id => !!id) as string[];
    const usersMap = await getUsersByIds(userIdsToFetch);

    const invites: Invite[] = invitesData.map(inviteData => ({
        ...inviteData,
        toUser: inviteData.toUserId ? usersMap.get(inviteData.toUserId) : undefined,
    }));
    
    invites.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
    return invites;
}

export async function getReceivedInvitesForUser(userId: string): Promise<Invite[]> {
    const currentUser = await getUserById(userId);
    if (!currentUser) return [];

    const invitesCol = collection(db, 'invites');
    const allInvites: Invite[] = [];
    const processedInviteIds = new Set<string>();

    // Query for invites sent directly to the user's ID
    const directInvitesQuery = query(
        invitesCol,
        where('toUserId', '==', userId),
        where('status', '==', 'pending')
    );

    // Query for invites sent to the user's email
    const emailInvitesQuery = query(
        invitesCol,
        where('toEmail', '==', currentUser.email),
        where('status', '==', 'pending')
    );

    const [directInvitesSnapshot, emailInvitesSnapshot] = await Promise.all([
        getDocs(directInvitesQuery),
        getDocs(emailInvitesSnapshot)
    ]);
    
    const combinedDocs = [...directInvitesSnapshot.docs, ...emailInvitesSnapshot.docs];
    const uniqueDocs = combinedDocs.filter(doc => {
      if (processedInviteIds.has(doc.id)) return false;
      processedInviteIds.add(doc.id);
      return true;
    });

    const invitesData = uniqueDocs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Invite));
    const fromUserIds = invitesData.map(invite => invite.fromUserId);
    const usersMap = await getUsersByIds(fromUserIds);
    
    invitesData.forEach(inviteData => {
        allInvites.push({
            ...inviteData,
            fromUser: usersMap.get(inviteData.fromUserId),
        });
    });

    allInvites.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
    return allInvites;
}



export async function updateInviteStatus(inviteId: string, status: "accepted" | "declined"): Promise<void> {
    const inviteDocRef = doc(db, 'invites', inviteId);
    await updateDoc(inviteDocRef, { status });
}

export async function findOrCreateCircleForUser(ownerId: string, circleName: Circle['name']): Promise<string | null> {
    const circlesCol = collection(db, 'circles');
    const q = query(circlesCol, where('ownerId', '==', ownerId), where('name', '==', circleName), limit(1));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        return querySnapshot.docs[0].id;
    }

    // If no circle exists, create one.
    const defaultCircleData = defaultCircles.find(c => c.name === circleName);
    if (!defaultCircleData) {
        console.error(`Default data for circle "${circleName}" not found.`);
        return null; // Or throw an error
    }

    try {
        const newCircleRef = await addDoc(circlesCol, {
            ...defaultCircleData,
            ownerId: ownerId,
            memberIds: [ownerId]
        });
        return newCircleRef.id;
    } catch (error) {
        console.error("Error creating new circle:", error);
        return null;
    }
}


export async function addUserToCircle(circleId: string, userId: string): Promise<void> {
    const circleDocRef = doc(db, 'circles', circleId);
    await updateDoc(circleDocRef, {
        memberIds: arrayUnion(userId)
    });
}

export async function removeUserFromCircle(currentUserId: string, userIdToRemove: string, myCircleId: string): Promise<void> {
    const batch = writeBatch(db);

    // 1. Get my circle to find its name
    const myCircleRef = doc(db, 'circles', myCircleId);
    const myCircleSnap = await getDoc(myCircleRef);
    if (!myCircleSnap.exists()) throw new Error("Current user's circle not found.");
    const myCircleData = myCircleSnap.data();
    const myCircleName = myCircleData.name as Circle['name'];

    // 2. Remove the user from my circle's member list
    batch.update(myCircleRef, { memberIds: arrayRemove(userIdToRemove) });

    // 3. Find the other user's corresponding circle
    const theirCircleId = await findOrCreateCircleForUser(userIdToRemove, myCircleName);

    // 4. Remove me from their circle's member list, if their circle exists
    if (theirCircleId) {
        const theirCircleRef = doc(db, 'circles', theirCircleId);
        batch.update(theirCircleRef, { memberIds: arrayRemove(currentUserId) });
    }

    // 5. Query for and delete ratings between these two users for this circle type
    const ratingsQuery1 = query(
        collection(db, 'ratings'),
        where('fromUserId', '==', currentUserId),
        where('toUserId', '==', userIdToRemove),
        where('circleName', '==', myCircleName)
    );
    const ratingsSnapshot1 = await getDocs(ratingsQuery1);
    ratingsSnapshot1.forEach(doc => batch.delete(doc.ref));

    const ratingsQuery2 = query(
        collection(db, 'ratings'),
        where('fromUserId', '==', userIdToRemove),
        where('toUserId', '==', currentUserId),
        where('circleName', '==', myCircleName)
    );
    const ratingsSnapshot2 = await getDocs(ratingsQuery2);
    ratingsSnapshot2.forEach(doc => batch.delete(doc.ref));

    // Commit all batched writes to Firestore
    await batch.commit();
}


export async function processInvitesForNewUser(batch: WriteBatch, newUserId: string, newUserEmail: string) {
  const invitesQuery = query(
    collection(db, 'invites'),
    where('toEmail', '==', newUserEmail),
    where('status', '==', 'pending')
  );

  const invitesSnapshot = await getDocs(invitesQuery);

  if (invitesSnapshot.empty) {
    return;
  }
  
  for (const inviteDoc of invitesSnapshot.docs) {
    batch.update(inviteDoc.ref, {
      toUserId: newUserId,
    });
  };
}

export const defaultCircles: Omit<Circle, 'id' | 'members' | 'traits' | 'ownerId' | 'memberIds' | 'historicalRatings' | 'myRatings'> & { traits: { name: string }[] }[] = [
  {
    name: "Family",
    traits: [
      { name: "Caring" },
      { name: "Respectful" },
      { name: "Dependable" },
      { name: "Loving" },
      { name: "Protective" },
    ],
  },
  {
    name: "Work",
    traits: [
      { name: "Professional" },
      { name: "Reliable" },
      { name: "Organized" },
      { name: "Collaborative" },
      { name: "Punctual" },
    ],
  },
  {
    name: "Friends",
    traits: [
        { name: "Loyal" },
        { name: "Honest" },
        { name: "Fun" },
        { name: "Supportive" },
        { name: "Encouraging" },
    ],
  },
  {
    name: "General",
    traits: [
        { name: "Polite" },
        { name: "Friendly" },
        { name: "Trustworthy" },
        { name: "Open-minded" },
        { name: "Observant" },
    ],
  },
];

export async function getAttractionScoresForUser(userId: string): Promise<{scores: TraitScore[], ratings: AttractionRating[]}> {
    const ratingsQuery = query(
        collection(db, "attractionRatings"),
        where("toUserId", "==", userId)
    );
    const ratingsSnapshot = await getDocs(ratingsQuery);
    
    const receivedRatings = ratingsSnapshot.docs.map(d => d.data() as Omit<AttractionRating, 'id'> & {id: string});

    const scores: TraitScore[] = attractionTraits.map(trait => {
        const scoresForTrait = receivedRatings
            .map(r => r.ratings[trait.name])
            .filter(score => typeof score === 'number');
        
        const averageScore = scoresForTrait.length > 0
            ? scoresForTrait.reduce((sum, score) => sum + score, 0) / scoresForTrait.length
            : 0;
        
        return {
            name: trait.name,
            averageScore: parseFloat(averageScore.toFixed(1))
        };
    });
    
    const ratingsData = ratingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttractionRating));
    const fromUserIds = ratingsData.map(r => r.fromUserId);
    const usersMap = await getUsersByIds(fromUserIds);

    const ratingsWithUserInfo: AttractionRating[] = ratingsData.map(rating => ({
        ...rating,
        fromUser: usersMap.get(rating.fromUserId)
    }));

    return { scores, ratings: ratingsWithUserInfo };
}


export async function getRatableConnections(userId: string): Promise<User[]> {
  const allCirclesQuery = query(
    collection(db, "circles"),
    where("memberIds", "array-contains", userId)
  );

  const querySnapshot = await getDocs(allCirclesQuery);
  const connectionIds = new Set<string>();

  for (const circleDoc of querySnapshot.docs) {
    const circle = circleDoc.data() as Circle;
    if (circle.name !== "Family") {
      circle.memberIds.forEach(memberId => {
        if (memberId !== userId) {
          connectionIds.add(memberId);
        }
      });
    }
  }

  const users = await Promise.all(
    Array.from(connectionIds).map(id => getUserById(id))
  );

  return users.filter((u): u is User => u !== null);
}

// Check if a user (targetId) is in any of the current user's (currentUserId) circles.
export async function isUserInCircles(currentUserId: string, targetId: string): Promise<boolean> {
    const circlesRef = collection(db, 'circles');
    const q = query(circlesRef, where('ownerId', '==', currentUserId), where('memberIds', 'array-contains', targetId));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
}

export async function sendRevealRequest(fromUserId: string, toUserId: string, ratingId: string): Promise<void> {
  const batch = writeBatch(db);

  // 1. Decrement the user's reveal token
  const userRef = doc(db, 'users', fromUserId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) throw new Error("User not found");
  const userData = userSnap.data() as User;
  if ((userData.revealTokens || 0) < 1) {
    throw new Error("You do not have enough tokens to send a reveal request.");
  }
  batch.update(userRef, { revealTokens: (userData.revealTokens || 0) - 1 });

  // 2. Create the reveal request document
  const requestRef = doc(collection(db, 'revealRequests'));
  batch.set(requestRef, {
    fromUserId,
    toUserId,
    ratingId,
    status: 'pending',
    createdAt: serverTimestamp(),
  });

  // 3. Update the original rating to show a request is pending
  const ratingRef = doc(db, 'attractionRatings', ratingId);
  batch.update(ratingRef, { revealRequestStatus: 'pending' });

  await batch.commit();
}


export async function getRevealRequestsForUser(userId: string): Promise<RevealRequest[]> {
    const reqCol = collection(db, 'revealRequests');
    const q = query(reqCol, where('toUserId', '==', userId), where('status', '==', 'pending'));
    const querySnapshot = await getDocs(q);
    
    const requestsData = querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as RevealRequest));
    const fromUserIds = requestsData.map(req => req.fromUserId);
    const usersMap = await getUsersByIds(fromUserIds);

    const requests: RevealRequest[] = requestsData.map(reqData => ({
        ...reqData,
        fromUser: usersMap.get(reqData.fromUserId),
    }));
    
    requests.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
    return requests;
}


export async function updateRevealRequestStatus(
  requestId: string,
  ratingId: string,
  newStatus: 'accepted' | 'declined'
): Promise<void> {
  const batch = writeBatch(db);

  // 1. Update the request document itself
  const requestRef = doc(db, 'revealRequests', requestId);
  batch.update(requestRef, { status: newStatus });

  // 2. Update the original rating document
  const ratingRef = doc(db, 'attractionRatings', ratingId);
  batch.update(ratingRef, { revealRequestStatus: newStatus });

  // 3. If accepted, make the rating no longer anonymous
  if (newStatus === 'accepted') {
    batch.update(ratingRef, { isAnonymous: false });
  }

  await batch.commit();
}

// Function to reset tokens monthly (could be triggered by a Cloud Function or first user login of the month)
export async function checkAndResetTokens(user: User): Promise<void> {
  const now = new Date();
  const lastResetRaw = user.lastTokenReset;
  
  // Convert Firestore Timestamp to Date if necessary
  const lastReset = lastResetRaw instanceof Timestamp ? lastResetRaw.toDate() : lastResetRaw;
  
  // If no reset date or if the last reset was in a previous month
  if (user.isPremium && (!lastReset || lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear())) {
    const userRef = doc(db, 'users', user.id);
    await updateDoc(userRef, {
      revealTokens: 3, // Reset to 3 tokens
      lastTokenReset: serverTimestamp(),
    });
  }
}

export async function sendFamilyGoal(fromUserId: string, toUserId: string, trait: string): Promise<void> {
    const goalsRef = collection(db, `familyGoals`);

    // Check for an existing pending goal between these two users for this trait
    const q1 = query(goalsRef, where('fromUserId', '==', fromUserId), where('toUserId', '==', toUserId), where('trait', '==', trait), where('status', '==', 'pending'));
    const q2 = query(goalsRef, where('fromUserId', '==', toUserId), where('toUserId', '==', fromUserId), where('trait', '==', trait), where('status', '==', 'pending'));
    
    const [existing1, existing2] = await Promise.all([getDocs(q1), getDocs(q2)]);

    if (!existing1.empty || !existing2.empty) {
        throw new Error("You have already suggested this goal to this family member.");
    }

    await addDoc(goalsRef, {
        fromUserId,
        toUserId,
        trait,
        status: 'pending',
        createdAt: serverTimestamp(),
    });
}

export async function getFamilyGoalsForUser(userId: string): Promise<FamilyGoal[]> {
    const goalsCol = collection(db, `familyGoals`);
    const q = query(goalsCol, where('toUserId', '==', userId), where('status', '==', 'pending'));
    const querySnapshot = await getDocs(q);

    const goalsData = querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as FamilyGoal));
    const fromUserIds = goalsData.map(goal => goal.fromUserId);
    const usersMap = await getUsersByIds(fromUserIds);

    const goals: FamilyGoal[] = goalsData.map(goalData => ({
        ...goalData,
        fromUser: usersMap.get(goalData.fromUserId),
    }));
    
    goals.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
    return goals;
}

export async function getSentFamilyGoalsForUser(userId: string): Promise<FamilyGoal[]> {
  const goalsCol = collection(db, `familyGoals`);
  const q = query(goalsCol, where('fromUserId', '==', userId), where('status', '==', 'pending'));
  const querySnapshot = await getDocs(q);

  const goalsData = querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as FamilyGoal));
  const toUserIds = goalsData.map(goal => goal.toUserId);
  const usersMap = await getUsersByIds(toUserIds);
  
  const goals: FamilyGoal[] = goalsData.map(goalData => ({
      ...goalData,
      toUser: usersMap.get(goalData.toUserId)
  }));
  
  goals.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
  return goals;
}

export async function updateFamilyGoalStatus(goalId: string, status: 'active' | 'declined', trait: string): Promise<void> {
    const goalRef = doc(db, 'familyGoals', goalId);
    
    if (status === 'active') {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + 30);
        
        // Generate a tip using the AI flow
        const tipsResponse = await generateGoalTips({ trait });
        const tip = tipsResponse.tip;

        await updateDoc(goalRef, { 
            status,
            startDate: Timestamp.fromDate(startDate),
            endDate: Timestamp.fromDate(endDate),
            tip: tip,
        });
    } else {
        await updateDoc(goalRef, { status });
    }
}

export async function getActiveAndCompletedGoals(userId: string): Promise<FamilyGoal[]> {
    const goalsCol = collection(db, 'familyGoals');
    const q1 = query(goalsCol, where('fromUserId', '==', userId), where('status', 'in', ['active', 'completed']));
    const q2 = query(goalsCol, where('toUserId', '==', userId), where('status', 'in', ['active', 'completed']));
    const [snapshot1, snapshot2] = await Promise.all([getDocs(q1), getDocs(q2)]);
    
    const goalsMap = new Map<string, FamilyGoal>();

    const processSnapshot = async (snapshot: typeof snapshot1) => {
        for (const docSnap of snapshot.docs) {
            if (goalsMap.has(docSnap.id)) continue;
            let goalData = { id: docSnap.id, ...docSnap.data() } as FamilyGoal;

            // Check if an active goal is missing a tip and generate one
            if (goalData.status === 'active' && !goalData.tip) {
                try {
                    const tipResponse = await generateGoalTips({ trait: goalData.trait });
                    goalData.tip = tipResponse.tip;
                    // Non-blocking update to the database
                    updateDoc(doc(db, 'familyGoals', goalData.id), { tip: goalData.tip }).catch(err => {
                        console.error("Failed to backfill tip for goal:", goalData.id, err);
                    });
                } catch (err) {
                    console.error("Error generating tip for existing goal:", err);
                    // Continue without a tip if generation fails
                }
            }
            goalsMap.set(docSnap.id, goalData);
        }
    };
    
    await processSnapshot(snapshot1);
    await processSnapshot(snapshot2);
    
    const goalsData = Array.from(goalsMap.values());
    const userIds = new Set<string>();
    goalsData.forEach(goal => {
        userIds.add(goal.fromUserId);
        userIds.add(goal.toUserId);
    });

    const usersMap = await getUsersByIds(Array.from(userIds));

    const goals = goalsData.map(goal => ({
        ...goal,
        fromUser: usersMap.get(goal.fromUserId),
        toUser: usersMap.get(goal.toUserId),
    }));

    goals.sort((a, b) => (b.startDate?.seconds ?? 0) - (a.startDate?.seconds ?? 0));
    return goals;
}

export async function submitFeedback(feedback: Omit<Feedback, 'id' | 'createdAt'>): Promise<void> {
    await addDoc(collection(db, "feedback"), {
        ...feedback,
        createdAt: serverTimestamp(),
    });
}

export async function getFeedbackSubmissions(): Promise<Feedback[]> {
    const feedbackCol = collection(db, 'feedback');
    const q = query(feedbackCol, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    const feedbackData = querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Feedback));
    
    const userIds = feedbackData.map(fb => fb.userId);
    const usersMap = await getUsersByIds(userIds);

    const feedbackList: Feedback[] = feedbackData.map(fb => ({
        ...fb,
        user: usersMap.get(fb.userId)
    }));
    
    return feedbackList;
}

export async function getAllUsers(options: { pageSize?: number; startAfterDoc?: QueryDocumentSnapshot } = {}): Promise<{ users: User[], lastDoc: QueryDocumentSnapshot | null }> {
    const { pageSize = 10, startAfterDoc } = options;
    const usersCol = collection(db, 'users');
    
    let q = query(
        usersCol, 
        orderBy('displayName_lowercase', 'asc'),
        limit(pageSize)
    );

    if (startAfterDoc) {
        q = query(q, startAfter(startAfterDoc));
    }

    const querySnapshot = await getDocs(q);
    
    const users: User[] = querySnapshot.docs.map((docSnap) => {
        return { id: docSnap.id, ...docSnap.data() } as User;
    });

    const lastDoc = querySnapshot.docs.length > 0 ? querySnapshot.docs[querySnapshot.docs.length - 1] : null;
    
    return { users, lastDoc };
}

// Check which circles a user is already a member of from a given list of circle IDs
export async function getCircleMembershipsForUser(userId: string, circleIds: string[]): Promise<string[]> {
    if (!userId || circleIds.length === 0) {
        return [];
    }
    const circlesRef = collection(db, 'circles');
    const q = query(circlesRef, where('__name__', 'in', circleIds), where('memberIds', 'array-contains', userId));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => doc.id);
}
