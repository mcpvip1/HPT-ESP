import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase web config. These keys are public by design — access control is
// enforced by Firestore security rules, not by hiding these values.
const firebaseConfig = {
  apiKey: 'AIzaSyDdT5hqzx23BZpUyjKvX_gQarpSA9yg2pE',
  authDomain: 'hpt-esp.firebaseapp.com',
  projectId: 'hpt-esp',
  storageBucket: 'hpt-esp.firebasestorage.app',
  messagingSenderId: '628563294346',
  appId: '1:628563294346:web:fe36d346a2fa76327ed573',
  measurementId: 'G-X7WFZBFX51',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle(): Promise<User> {
  const cred = await signInWithPopup(auth, googleProvider);
  return cred.user;
}

export async function signOutGoogle(): Promise<void> {
  await signOut(auth);
}

export type { User };
