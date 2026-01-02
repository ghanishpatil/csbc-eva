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

/**
 * Get Firebase Auth instance
 * @throws Error if Firebase is not initialized
 */
const getAuthInstance = (): Auth => {
  if (!firebaseAuth) {
    throw new Error(
      'Firebase Auth is not initialized. Please check your environment variables:\n' +
      '- VITE_FIREBASE_API_KEY\n' +
      '- VITE_FIREBASE_AUTH_DOMAIN\n' +
      '- VITE_FIREBASE_PROJECT_ID\n' +
      '- VITE_FIREBASE_STORAGE_BUCKET\n' +
      '- VITE_FIREBASE_MESSAGING_SENDER_ID\n' +
      '- VITE_FIREBASE_APP_ID'
    );
  }
  return firebaseAuth;
};

/**
 * Get Firestore instance
 * @throws Error if Firebase is not initialized
 */
const getDbInstance = (): Firestore => {
  if (!firebaseDb) {
    throw new Error(
      'Firebase Firestore is not initialized. Please check your environment variables.'
    );
  }
  return firebaseDb;
};

/**
 * Get Functions instance
 * @throws Error if Firebase is not initialized
 */
const getFunctionsInstance = (): Functions => {
  if (!firebaseFunctions) {
    throw new Error(
      'Firebase Functions is not initialized. Please check your environment variables.'
    );
  }
  return firebaseFunctions;
};

/**
 * Get Storage instance
 * @throws Error if Firebase is not initialized
 */
const getStorageInstance = (): FirebaseStorage => {
  if (!firebaseStorage) {
    throw new Error(
      'Firebase Storage is not initialized. Please check your environment variables.'
    );
  }
  return firebaseStorage;
};

/**
 * Get Firebase App instance
 * @throws Error if Firebase is not initialized
 */
const getAppInstance = (): FirebaseApp => {
  if (!firebaseApp) {
    throw new Error(
      'Firebase App is not initialized. Please check your environment variables.'
    );
  }
  return firebaseApp;
};

// Export getters that validate initialization
// These will throw clear errors if Firebase isn't initialized,
// which ErrorBoundary will catch and display
export const auth = getAuthInstance();
export const db = getDbInstance();
export const functions = getFunctionsInstance();
export const storage = getStorageInstance();
export default getAppInstance();

