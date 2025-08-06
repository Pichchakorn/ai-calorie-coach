// services/mockFirebase.ts

// Mock user data
const mockUser = {
  uid: 'demo-user',
  email: 'demo@example.com',
  name: 'Demo User'
};

// ฟังก์ชัน mock พิเศษที่ไม่รวมไว้ใน default export
export const clearMockData = async () => {
  console.log('🧹 Mock data cleared');
};

export const initializeDemoData = async () => {
  console.log('📊 Initialized demo data');
};

export const triggerAuthStateChange = (user: any) => {
  console.log('🔄 Triggered mock auth state change:', user);
};

// Default export ของ mock services
const mockServices = {
  auth: {
    login: async () => mockUser,
    register: async () => mockUser,
    logout: async () => {},
    getCurrentUser: async () => mockUser,
    updateUser: async () => mockUser,
    onAuthStateChanged: (cb: (user: any) => void) => {
      cb(mockUser);
      return () => {};
    }
  },
  dailyPlans: {
    createDailyPlan: async () => {},
    getUserDailyPlans: async () => [],
    getDailyPlan: async () => null,
    updateDailyPlan: async () => {},
    deleteDailyPlan: async () => {},
    onUserDailyPlansChange: (cb: () => void) => {
      cb();
      return () => {};
    }
  },
  userPreferences: {
    saveUserPreferences: async () => {},
    getUserPreferences: async () => ({ theme: 'dark' })
  },
  healthStats: {
    recordDailyStats: async () => {},
    getHealthStats: async () => []
  }
};

export default mockServices;
