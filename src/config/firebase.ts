import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getFunctions, Functions } from 'firebase/functions';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

/**
 * Validates Firebase configuration before initialization
 * Prevents Firebase from throwing errors with invalid config
 */
const isFirebaseConfigValid = (): boolean => {
  const requiredFields = [
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId',
  ];

  return requiredFields.every((field) => {
    const value = firebaseConfig[field as keyof typeof firebaseConfig];
    return value && typeof value === 'string' && value.trim() !== '';
  });
};

// Initialize Firebase only if config is valid
// If config is invalid, ConfigValidator will catch it and show error
let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;
let firebaseDb: Firestore | null = null;
let firebaseFunctions: Functions | null = null;
let firebaseStorage: FirebaseStorage | null = null;

if (isFirebaseConfigValid()) {
  try {
    firebaseApp = initializeApp(firebaseConfig);
    firebaseAuth = getAuth(firebaseApp);
    firebaseDb = getFirestore(firebaseApp);
    firebaseFunctions = getFunctions(firebaseApp);
    firebaseStorage = getStorage(firebaseApp);
  } catch (error) {
    // If initialization fails, log error but don't crash
    // ConfigValidator will catch missing env vars and show proper error
    console.error('[Firebase] Initialization failed:', error);
    // Leave services as null
    // ConfigValidator will prevent app from loading if config is invalid
  }
} else {
  // Config is invalid - don't initialize
  // ConfigValidator will detect missing env vars and show error page
  console.warn('[Firebase] Configuration is invalid. Missing required environment variables.');
}

// Export services
// If Firebase is not initialized (config invalid), these will be null
// ConfigValidator will prevent app from loading if config is invalid,
// so these will only be accessed when Firebase is properly initialized
// Using type assertions to satisfy TypeScript - runtime checks ensure safety
export const auth = firebaseAuth as Auth;
export const db = firebaseDb as Firestore;
export const functions = firebaseFunctions as Functions;
export const storage = firebaseStorage as FirebaseStorage;
export default firebaseApp as FirebaseApp;

