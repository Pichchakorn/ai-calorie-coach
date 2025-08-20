// src/firebase/config.ts
import { initializeApp, getApps } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// ใช้ emulator ได้ถ้าตั้งค่าไว้ (optional)
const useEmu = String(import.meta.env.VITE_USE_FIREBASE_EMULATORS) === 'true';
if (useEmu) {
  try {
    connectAuthEmulator(
      auth,
      `http://${import.meta.env.VITE_AUTH_EMULATOR_HOST || 'localhost'}:${import.meta.env.VITE_AUTH_EMULATOR_PORT || '9099'}`,
      { disableWarnings: true }
    );
    connectFirestoreEmulator(
      db,
      import.meta.env.VITE_FIRESTORE_EMULATOR_HOST || 'localhost',
      Number(import.meta.env.VITE_FIRESTORE_EMULATOR_PORT || 8080)
    );
    // eslint-disable-next-line no-console
    console.info('✅ Firebase emulators connected');
  } catch (e) {
    console.warn('Failed to connect emulators', e);
  }
}

export default app;
