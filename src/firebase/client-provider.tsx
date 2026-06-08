'use client';

import React, { useEffect, useState } from 'react';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { firebaseConfig } from './config';
import { FirebaseProvider } from './provider';

export const FirebaseClientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebase, setFirebase] = useState<{
    app: FirebaseApp;
    firestore: Firestore;
    auth: Auth;
  } | null>(null);

  useEffect(() => {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    const firestore = getFirestore(app);
    const auth = getAuth(app);
    setFirebase({ app, firestore, auth });
  }, []);

  if (!firebase) return null;

  return (
    <FirebaseProvider app={firebase.app} firestore={firebase.firestore} auth={firebase.auth}>
      {children}
    </FirebaseProvider>
  );
};
