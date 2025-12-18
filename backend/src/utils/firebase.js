import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin SDK
const initializeFirebase = () => {
  try {
    // Parse private key (handle escaped newlines)
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      : undefined;

    const serviceAccount = {
      type: 'service_account',
      project_id: process.env.FIREBASE_PROJECT_ID,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      private_key: privateKey,
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
    });

    console.log('[Firebase] Admin SDK initialized successfully');
    return admin;
  } catch (error) {
    console.error('[Firebase] Initialization error:', error.message);
    throw new Error('Failed to initialize Firebase Admin SDK');
  }
};

// Get Firestore instance
export const getFirestore = () => {
  return admin.firestore();
};

// Get Auth instance
export const getAuth = () => {
  return admin.auth();
};

export default initializeFirebase;


