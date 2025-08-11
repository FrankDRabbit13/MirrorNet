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
          .map(doc => ({id: doc.
