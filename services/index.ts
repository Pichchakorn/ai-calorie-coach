import { isDevelopment, getFirebaseStatus } from '../firebase/config';

// Dynamic imports with error handling
let firebaseServices: any = null;
let mockServices: any = null;

// Import Mock services (always available)
try {
  mockServices = (await import('./mockFirebase.ts')).default;
} catch (error) {
  console.error('Failed to import mock services:', error);
  // Create minimal fallback mock services
  mockServices = {
    auth: {
      login: async () => { throw new Error('Services not available'); },
      register: async () => { throw new Error('Services not available'); },
      logout: async () => { throw new Error('Services not available'); },
      getCurrentUser: async () => null,
      updateUser: async () => { throw new Error('Services not available'); },
      onAuthStateChanged: () => () => {}
    },
    dailyPlans: {
      createDailyPlan: async () => { throw new Error('Services not available'); },
      getUserDailyPlans: async () => [],
      getDailyPlan: async () => null,
      updateDailyPlan: async () => { throw new Error('Services not available'); },
      deleteDailyPlan: async () => { throw new Error('Services not available'); },
      onUserDailyPlansChange: () => () => {}
    },
    userPreferences: {
      saveUserPreferences: async () => { throw new Error('Services not available'); },
      getUserPreferences: async () => ({})
    },
    healthStats: {
      recordDailyStats: async () => { throw new Error('Services not available'); },
      getHealthStats: async () => []
    }
  };
}

// Import Firebase services (only if not in development)
if (!isDevelopment) {
  try {
    firebaseServices = (await import('./firebase.ts')).default;
  } catch (error) {
    console.warn('Failed to import Firebase services, using mock services:', error);
    firebaseServices = null;
  }
}

// Get Firebase status
const firebaseStatus = getFirebaseStatus();

// Log สถานะการใช้งาน
console.log(`📱 Services mode: ${isDevelopment ? 'MOCK' : 'FIREBASE'}`);
console.log('🔧 Firebase Status:', firebaseStatus);

// เลือกใช้ service ตามโหมดและความพร้อมใช้งาน
const getActiveServices = () => {
  // ถ้าเป็น development mode หรือ Firebase ไม่พร้อม ใช้ mock services
  if (isDevelopment || !firebaseServices || !firebaseStatus.hasValidConfig) {
    return mockServices;
  }
  
  // ใช้ Firebase services ในโหมด production
  return firebaseServices;
};

const services = getActiveServices();

// Export services ที่เลือกแล้วพร้อม error handling
export const authService = services?.auth || mockServices.auth;
export const dailyPlansService = services?.dailyPlans || mockServices.dailyPlans;
export const userPreferencesService = services?.userPreferences || mockServices.userPreferences;
export const healthStatsService = services?.healthStats || mockServices.healthStats;

// Export default
export default services || mockServices;

// Export utility functions สำหรับ mock mode (with error handling)
export const clearMockData = async () => {
  try {
    if (mockServices && typeof mockServices.clearMockData === 'function') {
      return await mockServices.clearMockData();
    }
    const { clearMockData: clearFn } = await import('./mockFirebase.ts');
    return await clearFn();
  } catch (error) {
    console.warn('Failed to clear mock data:', error);
  }
};

export const initializeDemoData = async () => {
  try {
    if (mockServices && typeof mockServices.initializeDemoData === 'function') {
      return await mockServices.initializeDemoData();
    }
    const { initializeDemoData: initFn } = await import('./mockFirebase.ts');
    return await initFn();
  } catch (error) {
    console.warn('Failed to initialize demo data:', error);
  }
};

export const triggerAuthStateChange = (user: any) => {
  try {
    if (mockServices && typeof mockServices.triggerAuthStateChange === 'function') {
      return mockServices.triggerAuthStateChange(user);
    }
    import('./mockFirebase.ts').then(({ triggerAuthStateChange: triggerFn }) => {
      triggerFn(user);
    });
  } catch (error) {
    console.warn('Failed to trigger auth state change:', error);
  }
};

// Export enhanced status function
export const getServicesStatus = () => {
  const status = getFirebaseStatus();
  
  return {
    mode: isDevelopment || !status.hasValidConfig ? 'mock' : 'firebase',
    isDevelopment,
    hasValidConfig: status.hasValidConfig,
    hasAuth: status.hasAuth,
    hasFirestore: status.hasFirestore,
    projectId: status.projectId,
    description: isDevelopment || !status.hasValidConfig
      ? 'ใช้ข้อมูลจำลองใน localStorage (ไม่ต้องตั้งค่า Firebase)'
      : `เชื่อมต่อกับ Firebase จริง (Project: ${status.projectId})`,
    storageAvailable: typeof localStorage !== 'undefined',
    servicesReady: !!(services && authService && dailyPlansService)
  };
};

// Export function สำหรับตรวจสอบความพร้อมของ services
export const checkServicesHealth = async () => {
  const status = getServicesStatus();
  
  try {
    // ทดสอบ authService
    const authReady = !!(authService && typeof authService.getCurrentUser === 'function');
    
    // ทดสอบ dailyPlansService
    const plansReady = !!(dailyPlansService && typeof dailyPlansService.getUserDailyPlans === 'function');
    
    return {
      ...status,
      authServiceReady: authReady,
      dailyPlansServiceReady: plansReady,
      allServicesReady: authReady && plansReady,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Services health check failed:', error);
    return {
      ...status,
      authServiceReady: false,
      dailyPlansServiceReady: false,
      allServicesReady: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };
  }
};

// Log final status
console.log('🚀 Services initialized:', getServicesStatus());