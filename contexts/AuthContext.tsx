import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getServicesStatus, checkServicesHealth } from '../services';
import { User, LoginData, RegisterData, DailyPlan } from '../types';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  servicesLoaded: boolean;
  recentPlans: DailyPlan[];
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<Pick<User, 'name' | 'profile'>>) => Promise<void>;
  refreshRecentPlans: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [servicesLoaded, setServicesLoaded] = useState(false);
  const [recentPlans, setRecentPlans] = useState<DailyPlan[]>([]);
  const [authService, setAuthService] = useState<any>(null);
  const [dailyPlansService, setDailyPlansService] = useState<any>(null);

  // โหลด services พร้อม error handling
  useEffect(() => {
    const loadServices = async () => {
      try {
        console.log('🔄 Loading services...');
        
        // ตรวจสอบสถานะ services
        const healthCheck = await checkServicesHealth();
        console.log('🏥 Services health check:', healthCheck);
        
        if (!healthCheck.allServicesReady) {
          console.warn('⚠️ Not all services are ready, retrying...');
        }
        
        // Dynamic import services
        const servicesModule = await import('../services');
        
        setAuthService(servicesModule.authService);
        setDailyPlansService(servicesModule.dailyPlansService);
        
        // Initialize demo data ถ้าอยู่ในโหมด development
        const status = getServicesStatus();
        if (status.isDevelopment && servicesModule.initializeDemoData) {
          await servicesModule.initializeDemoData();
        }
        
        setServicesLoaded(true);
        console.log('✅ Services loaded successfully');
        
      } catch (error) {
        console.error('❌ Failed to load services:', error);
        
        // Fallback: ใช้ basic mock services
        const fallbackAuthService = {
          login: async () => { throw new Error('Services not available'); },
          register: async () => { throw new Error('Services not available'); },
          logout: async () => { throw new Error('Services not available'); },
          getCurrentUser: async () => null,
          updateUser: async () => { throw new Error('Services not available'); },
          onAuthStateChanged: () => () => {}
        };
        
        const fallbackDailyPlansService = {
          getUserDailyPlans: async () => [],
          createDailyPlan: async () => { throw new Error('Services not available'); },
          getDailyPlan: async () => null,
          updateDailyPlan: async () => { throw new Error('Services not available'); },
          deleteDailyPlan: async () => { throw new Error('Services not available'); }
        };
        
        setAuthService(fallbackAuthService);
        setDailyPlansService(fallbackDailyPlansService);
        setServicesLoaded(true);
        
        toast.error('เกิดข้อผิดพลาดในการโหลดระบบ กรุณารีโหลดหน้าเว็บ');
      }
    };

    loadServices();
  }, []);

  // ฟังการเปลี่ยนแปลงสถานะ Authentication
  useEffect(() => {
    if (!servicesLoaded || !authService) {
      return;
    }

    setIsLoading(true);

    const setupAuthListener = async () => {
      try {
        const status = getServicesStatus();
        
        // สำหรับ Firebase จริง
        if (!status.isDevelopment && authService.onAuthStateChanged) {
          const unsubscribe = authService.onAuthStateChanged(async (firebaseUser: any) => {
            try {
              if (firebaseUser) {
                const userData = await authService.getCurrentUser();
                setUser(userData);
                
                if (userData && dailyPlansService) {
                  await loadRecentPlans(userData.id);
                }
              } else {
                setUser(null);
                setRecentPlans([]);
              }
            } catch (error) {
              console.error('Error loading user data:', error);
              toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้');
            } finally {
              setIsLoading(false);
            }
          });

          return () => unsubscribe();
        } 
        
        // สำหรับ Mock mode
        else {
          const loadCurrentUser = async () => {
            try {
              const userData = await authService.getCurrentUser();
              setUser(userData);
              
              if (userData && dailyPlansService) {
                await loadRecentPlans(userData.id);
              }
            } catch (error) {
              console.error('Error loading current user:', error);
            } finally {
              setIsLoading(false);
            }
          };

          await loadCurrentUser();

          // Listen สำหรับ mock auth state changes
          const handleAuthChange = (event: CustomEvent) => {
            const userData = event.detail;
            setUser(userData);
            if (userData && dailyPlansService) {
              loadRecentPlans(userData.id);
            } else {
              setRecentPlans([]);
            }
          };

          window.addEventListener('mockAuthStateChanged', handleAuthChange as EventListener);
          
          return () => {
            window.removeEventListener('mockAuthStateChanged', handleAuthChange as EventListener);
          };
        }
      } catch (error) {
        console.error('Error setting up auth listener:', error);
        setIsLoading(false);
      }
    };

    setupAuthListener();
  }, [servicesLoaded, authService, dailyPlansService]);

  // ดึงแผนล่าสุดของผู้ใช้
  const loadRecentPlans = async (userId: string) => {
    if (!dailyPlansService) return;
    
    try {
      const plans = await dailyPlansService.getUserDailyPlans(userId, 5);
      setRecentPlans(plans);
    } catch (error) {
      console.error('Error loading recent plans:', error);
    }
  };

  // เข้าสู่ระบบ
  const login = async (data: LoginData) => {
    if (!authService) {
      throw new Error('Authentication service not available');
    }

    setIsLoading(true);
    try {
      const userData = await authService.login(data);
      setUser(userData);
      
      // ดึงแผนล่าสุด
      if (dailyPlansService) {
        await loadRecentPlans(userData.id);
      }
      
      // แสดงข้อความแตกต่างกันตามโหมด
      const status = getServicesStatus();
      const welcomeMessage = status.isDevelopment && data.email === 'demo@example.com'
        ? `ยินดีต้อนรับสู่โหมดทดลอง! 🎯`
        : `ยินดีต้อนรับ ${userData.name}! 👋`;
      
      toast.success(welcomeMessage);
    } catch (error: any) {
      console.error('Login error:', error);
      
      // แสดงข้อความผิดพลาดที่เหมาะสม
      let errorMessage = 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ';
      
      const status = getServicesStatus();
      if (status.isDevelopment) {
        if (error.message.includes('ไม่พบบัญชี')) {
          errorMessage = 'ไม่พบบัญชีผู้ใช้นี้ ลองใช้ demo@example.com';
        }
      } else {
        // Firebase error codes
        if (error.code === 'auth/user-not-found') {
          errorMessage = 'ไม่พบบัญชีผู้ใช้นี้';
        } else if (error.code === 'auth/wrong-password') {
          errorMessage = 'รหัสผ่านไม่ถูกต้อง';
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = 'รูปแบบอีเมลไม่ถูกต้อง';
        } else if (error.code === 'auth/too-many-requests') {
          errorMessage = 'พยายามเข้าสู่ระบบบ่อยเกินไป กรุณารอสักครู่';
        } else if (error.code === 'auth/network-request-failed') {
          errorMessage = 'ไม่สามารถเชื่อมต่อเครือข่ายได้';
        }
      }
      
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // ลงทะเบียน
  const register = async (data: RegisterData) => {
    if (!authService) {
      throw new Error('Authentication service not available');
    }

    setIsLoading(true);
    try {
      const userData = await authService.register(data);
      setUser(userData);
      
      const status = getServicesStatus();
      const successMessage = status.isDevelopment 
        ? `สร้างบัญชีสำเร็จ! ข้อมูลจะถูกเก็บใน browser ของคุณ 💾`
        : `สร้างบัญชีสำเร็จ! ยินดีต้อนรับ ${userData.name} 🎉`;
      
      toast.success(successMessage);
    } catch (error: any) {
      console.error('Register error:', error);
      
      let errorMessage = 'เกิดข้อผิดพลาดในการสร้างบัญชี';
      
      const status = getServicesStatus();
      if (status.isDevelopment) {
        if (error.message.includes('อีเมลนี้ถูกใช้งานแล้ว')) {
          errorMessage = 'อีเมลนี้ถูกใช้งานแล้ว';
        }
      } else {
        // Firebase error codes
        if (error.code === 'auth/email-already-in-use') {
          errorMessage = 'อีเมลนี้ถูกใช้งานแล้ว';
        } else if (error.code === 'auth/weak-password') {
          errorMessage = 'รหัสผ่านไม่ปลอดภัย กรุณาใช้รหัสผ่านที่แข็งแกร่งกว่านี้';
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = 'รูปแบบอีเมลไม่ถูกต้อง';
        } else if (error.code === 'auth/network-request-failed') {
          errorMessage = 'ไม่สามารถเชื่อมต่อเครือข่ายได้';
        }
      }
      
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // ออกจากระบบ
  const logout = async () => {
    if (!authService) return;

    try {
      await authService.logout();
      setUser(null);
      setRecentPlans([]);
      
      const status = getServicesStatus();
      const logoutMessage = status.isDevelopment 
        ? 'ออกจากระบบสำเร็จ ข้อมูลยังคงอยู่ใน browser 👋'
        : 'ออกจากระบบสำเร็จ';
        
      toast.success(logoutMessage);
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('เกิดข้อผิดพลาดในการออกจากระบบ');
    }
  };

  // อัปเดตข้อมูลผู้ใช้
  const updateUser = async (updates: Partial<Pick<User, 'name' | 'profile'>>) => {
    if (!user || !authService) return;

    try {
      await authService.updateUser(user.id, updates);
      
      // อัปเดต user state
      setUser(prev => prev ? { ...prev, ...updates } : null);
      
      toast.success('บันทึกข้อมูลสำเร็จ ✅');
    } catch (error) {
      console.error('Update user error:', error);
      toast.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      throw error;
    }
  };

  // รีเฟรชแผนล่าสุด
  const refreshRecentPlans = async () => {
    if (!user || !dailyPlansService) return;
    await loadRecentPlans(user.id);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    servicesLoaded,
    recentPlans,
    login,
    register,
    logout,
    updateUser,
    refreshRecentPlans
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}