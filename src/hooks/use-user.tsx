"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser, updateProfile } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot, Unsubscribe, updateDoc } from "firebase/firestore";
import { type User, checkAndResetTokens } from '@/lib/data';

interface UserContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  updateUser: (user: Partial<Omit<User, 'id' | 'email'>>) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Hardcoded IDs for admin users
const ADMIN_USER_IDS = ["DEthL2hZ7tg45xIbq72qZGkVF7B3", "z6vurwBbkchxhMrZtifnUvKYWoD3"];

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: Unsubscribe | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (fbUser) => {
      if (unsubscribe) unsubscribe();

      setFirebaseUser(fbUser);
      if (fbUser) {
        setLoading(true);
        const userDocRef = doc(db, 'users', fbUser.uid);
        
        unsubscribe = onSnapshot(userDocRef, async (docSnap) => {
          if (docSnap.exists()) {
            const userData = { id: docSnap.id, ...docSnap.data() } as User;

            // Grant admin privileges if applicable
            if (ADMIN_USER_IDS.includes(fbUser.uid) && !userData.isAdmin) {
              console.log("Granting admin privileges to user:", fbUser.uid);
              await updateDoc(userDocRef, { isAdmin: true });
              userData.isAdmin = true; // Optimistic update
            }
            
            checkAndResetTokens(userData); // Check and reset tokens on user load
            
            setUser(userData);

          } else {
            setUser(null);
          }
          setLoading(false);
        }, (error) => {
          console.error("Error listening to user document:", error);
          setUser(null);
          setLoading(false);
        });
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const updateUser = async (updatedFields: Partial<Omit<User, 'id' | 'email'>>) => {
    if (!user || !firebaseUser) {
        throw new Error("User not authenticated");
    }

    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const authProfileUpdatePayload: { displayName?: string; photoURL?: string } = {};
    if (updatedFields.displayName) {
        authProfileUpdatePayload.displayName = updatedFields.displayName;
    }
    if (updatedFields.photoUrl) {
        authProfileUpdatePayload.photoURL = updatedFields.photoUrl;
    }

    const promises: Promise<void>[] = [];
    promises.push(updateDoc(userDocRef, updatedFields));

    if (Object.keys(authProfileUpdatePayload).length > 0) {
        promises.push(updateProfile(firebaseUser, authProfileUpdatePayload));
    }
    
    await Promise.all(promises);
  };

  const value = { user, firebaseUser, updateUser, loading };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
