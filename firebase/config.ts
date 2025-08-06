import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Helper function เพื่อเข้าถึง environment variables อย่างปลอดภัย
const getEnvVar = (key: string, fallback: string = ''): string => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      return import.meta.env[key];
    }

    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }

    if (typeof window !== 'undefined' && (window as any).env && (window as any).env[key]) {
      return (window as any).env[key];
    }

    return fallback;
  } catch {
    return fallback;
  }
};

// ตรวจสอบว่าเป็น development mode หรือไม่
const checkDevelopmentMode = (): boolean => {
  try {
    const nodeEnv = getEnvVar('NODE_ENV', 'development');
    if (nodeEnv === 'development') return true;

    const viteDev = getEnvVar('DEV', '');
    if (viteDev === 'true' || viteDev === '1') return true;

    const apiKey = getEnvVar('VITE_FIREBASE_API_KEY', '');
    if (!apiKey || apiKey === 'YOUR_API_KEY_HERE' || apiKey === 'demo-api-key') return true;

    if (typeof window !== 'undefined') {
      const hostname = window.location?.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.warn('Error checking development mode:', error);
    return true; // Default to development mode เพื่อความปลอดภัย
  }
};

const isDevelopment = checkDevelopmentMode();

// Firebase configuration - ใช้ environment variables หรือค่า default
const firebaseConfig = {
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY', 'demo-api-key'),
  authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN', 'ai-calorie-coach-demo.firebaseapp.com'),
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID', 'ai-calorie-coach-demo'),
  storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET', 'ai-calorie-coach-demo.appspot.com'),
  messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID', '123456789'),
  appId: getEnvVar('VITE_FIREBASE_APP_ID', '1:123456789:web:abcdef123456789')
};

// Log สถานะการใช้งาน
console.log(`🔥 Firebase mode: ${isDevelopment ? 'MOCK/DEVELOPMENT' : 'PRODUCTION'}`);

// ตัวแปรสำหรับเก็บ Firebase instances
let app: any = null;
let auth: any = null;
let db: any = null;

// ใช้ Firebase จริงเมื่อไม่ใช่ development mode
if (!isDevelopment) {
  try {
    const requiredFields = ['apiKey', 'authDomain', 'projectId'];
    const missingFields = requiredFields.filter(field =>
      !firebaseConfig[field as keyof typeof firebaseConfig] ||
      firebaseConfig[field as keyof typeof firebaseConfig] === `demo-${field.toLowerCase()}`
    );

    if (missingFields.length > 0) {
      console.warn(`⚠️ Missing Firebase config fields: ${missingFields.join(', ')}`);
      console.warn('🔄 Falling back to mock mode');
    } else {
      app = initializeApp(firebaseConfig);
      auth = getAuth(app);
      db = getFirestore(app);
      console.log('✅ Firebase initialized successfully');
      console.log(`📱 Project ID: ${firebaseConfig.projectId}`);
    }
  } catch (error) {
    console.warn('⚠️ Firebase initialization failed, falling back to mock mode:', error);
    app = null;
    auth = null;
    db = null;
  }
}

// Export ตัวแปรสำหรับตรวจสอบโหมด
export { isDevelopment };

// Export Firebase instances (อาจเป็น null ในโหมด development)
export { auth, db };
export default app;

// Export configuration และ status functions
export const getFirebaseStatus = () => {
  const hasValidAuth = !isDevelopment && !!auth;
  const hasValidDb = !isDevelopment && !!db;

  return {
    isDevelopment,
    hasValidConfig: hasValidAuth && hasValidDb,
    hasAuth: hasValidAuth,
    hasFirestore: hasValidDb,
    config: isDevelopment ? 'Mock/Demo Mode' : 'Firebase Production',
    projectId: isDevelopment ? 'demo-project' : firebaseConfig.projectId
  };
};

// Export helper function สำหรับ debug
export const debugFirebaseConfig = () => {
  if (isDevelopment) {
    console.log('🔧 Firebase Debug Info:');
    console.log('- Mode: Development/Mock');
    console.log('- Auth:', auth ? 'Available' : 'Mock');
    console.log('- Firestore:', db ? 'Available' : 'Mock');
  } else {
    console.log('🔧 Firebase Debug Info:');
    console.log('- Mode: Production');
    console.log('- Project ID:', firebaseConfig.projectId);
    console.log('- Auth Domain:', firebaseConfig.authDomain);
    console.log('- Auth:', auth ? 'Initialized' : 'Failed');
    console.log('- Firestore:', db ? 'Initialized' : 'Failed');
  }
};

// เรียกใช้ debug function ในโหมด development
if (isDevelopment) {
  debugFirebaseConfig();
}
