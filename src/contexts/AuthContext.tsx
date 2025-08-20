// src/contexts/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { toast } from "sonner";
import type { User, LoginData, RegisterData, DailyPlan } from "../types";

/* ---------------------------------- Types --------------------------------- */

interface AuthService {
  login: (data: LoginData) => Promise<User>;
  register: (data: RegisterData) => Promise<User>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<User | null>;
  updateUser: (
    updates: Partial<Pick<User, "name" | "profile" | "email">>
  ) => Promise<void>;
  // สำหรับ Firebase (optional)
  onAuthStateChanged?: (cb: (u: unknown) => void) => () => void;
}

interface DailyPlansService {
  getUserDailyPlans: (userId: string, limit?: number) => Promise<DailyPlan[]>;
  createDailyPlan?: (...args: any[]) => Promise<any>;
  getDailyPlan?: (...args: any[]) => Promise<any>;
  updateDailyPlan?: (...args: any[]) => Promise<any>;
  deleteDailyPlan?: (...args: any[]) => Promise<any>;
}

interface ServicesModuleShape {
  authService?: AuthService;
  dailyPlansService?: DailyPlansService;
  initializeDemoData?: () => Promise<void>;
  getServicesStatus?: () => { isDevelopment: boolean };
  checkServicesHealth?: () => Promise<{
    allServicesReady: boolean;
    details?: Record<string, boolean>;
  }>;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  servicesLoaded: boolean;
  recentPlans: DailyPlan[];
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (
    updates: Partial<Pick<User, "name" | "profile" | "email">>
  ) => Promise<void>;
  refreshRecentPlans: () => Promise<void>;
}

/* ------------------------------ Helper (safe) ------------------------------ */

const safeGetServicesStatus = (mod?: ServicesModuleShape) =>
  mod?.getServicesStatus?.() ?? { isDevelopment: import.meta.env.MODE !== "production" };

const safeCheckHealth = async (mod?: ServicesModuleShape) => {
  try {
    return (await mod?.checkServicesHealth?.()) ?? { allServicesReady: true };
  } catch {
    return { allServicesReady: true };
  }
};

/* --------------------------------- Context -------------------------------- */

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [servicesLoaded, setServicesLoaded] = useState(false);
  const [recentPlans, setRecentPlans] = useState<DailyPlan[]>([]);

  const [authService, setAuthService] = useState<AuthService | null>(null);
  const [dailyPlansService, setDailyPlansService] =
    useState<DailyPlansService | null>(null);

  /* ----------------------- Load services (dynamic import) ---------------------- */
  useEffect(() => {
    (async () => {
      try {
        const mod = (await import("../services").catch(() => ({}))) as
          | ServicesModuleShape
          | Record<string, never>;

        // health check (ถ้ามี)
        const health = await safeCheckHealth(mod as ServicesModuleShape);
        if (!health.allServicesReady) {
          console.warn("⚠️ Services not fully ready:", health.details ?? {});
        }

        // set services หรือ fallback เป็น mock
        if ((mod as ServicesModuleShape).authService) {
          setAuthService((mod as ServicesModuleShape).authService!);
        } else {
          setAuthService({
            login: async () => {
              throw new Error("Services not available");
            },
            register: async () => {
              throw new Error("Services not available");
            },
            logout: async () => {},
            getCurrentUser: async () => null,
            updateUser: async () => {
              throw new Error("Services not available");
            },
          });
        }

        if ((mod as ServicesModuleShape).dailyPlansService) {
          setDailyPlansService((mod as ServicesModuleShape).dailyPlansService!);
        } else {
          setDailyPlansService({
            getUserDailyPlans: async () => [],
          });
        }

        // initialize demo data ถ้า dev และมีฟังก์ชัน
        const status = safeGetServicesStatus(mod as ServicesModuleShape);
        if (status.isDevelopment && (mod as ServicesModuleShape).initializeDemoData) {
          await (mod as ServicesModuleShape).initializeDemoData!();
        }

        setServicesLoaded(true);
      } catch (err) {
        console.error("❌ load services failed:", err);
        // hard fallback
        setAuthService({
          login: async () => {
            throw new Error("Services not available");
          },
          register: async () => {
            throw new Error("Services not available");
          },
          logout: async () => {},
          getCurrentUser: async () => null,
          updateUser: async () => {
            throw new Error("Services not available");
          },
        });
        setDailyPlansService({ getUserDailyPlans: async () => [] });
        setServicesLoaded(true);
        toast.error("เกิดข้อผิดพลาดในการโหลดระบบ กรุณารีโหลดหน้าเว็บ");
      }
    })();
  }, []);

  /* ------------------- Listen auth state (firebase / mock) ------------------- */
  useEffect(() => {
    if (!servicesLoaded || !authService) return;

    setIsLoading(true);

    let cleanup: (() => void) | undefined;

    const run = async () => {
      try {
        const status = safeGetServicesStatus();
        if (!status.isDevelopment && authService.onAuthStateChanged) {
          // Firebase path
          cleanup = authService.onAuthStateChanged(async () => {
            try {
              const u = await authService.getCurrentUser();
              setUser(u);
              if (u && dailyPlansService) {
                const plans = await dailyPlansService.getUserDailyPlans(u.id, 5);
                setRecentPlans(plans);
              } else {
                setRecentPlans([]);
              }
            } finally {
              setIsLoading(false);
            }
          });
        } else {
          // Mock path: get once + listen custom event
          const u = await authService.getCurrentUser();
          setUser(u);
          if (u && dailyPlansService) {
            const plans = await dailyPlansService.getUserDailyPlans(u.id, 5);
            setRecentPlans(plans);
          }
          const handler = ((e: CustomEvent<User | null>) => {
            const next = e.detail;
            setUser(next);
            if (next && dailyPlansService) {
              dailyPlansService.getUserDailyPlans(next.id, 5).then(setRecentPlans);
            } else {
              setRecentPlans([]);
            }
          }) as EventListener;
          window.addEventListener("mockAuthStateChanged", handler);
          cleanup = () => window.removeEventListener("mockAuthStateChanged", handler);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("auth listener error:", err);
        setIsLoading(false);
      }
    };

    run();

    return () => {
      try {
        cleanup?.();
      } catch {}
    };
  }, [servicesLoaded, authService, dailyPlansService]);

  /* --------------------------- Helpers / Actions --------------------------- */

  const loadRecentPlans = async (userId: string) => {
    if (!dailyPlansService) return;
    try {
      const plans = await dailyPlansService.getUserDailyPlans(userId, 5);
      setRecentPlans(plans);
    } catch (e) {
      console.error("Error loading recent plans:", e);
    }
  };

  const login = async (data: LoginData) => {
    if (!authService) throw new Error("Authentication service not available");
    setIsLoading(true);
    try {
      const u = await authService.login(data);
      setUser(u);
      if (dailyPlansService) await loadRecentPlans(u.id);

      const status = safeGetServicesStatus();
      const msg =
        status.isDevelopment && data.email === "demo@example.com"
          ? "ยินดีต้อนรับสู่โหมดทดลอง! 🎯"
          : `ยินดีต้อนรับ ${u.name}! 👋`;
      toast.success(msg);
    } catch (error: any) {
      console.error("Login error:", error);
      const status = safeGetServicesStatus();
      let msg = "เกิดข้อผิดพลาดในการเข้าสู่ระบบ";
      if (!status.isDevelopment) {
        if (error?.code === "auth/user-not-found") msg = "ไม่พบบัญชีผู้ใช้นี้";
        else if (error?.code === "auth/wrong-password") msg = "รหัสผ่านไม่ถูกต้อง";
        else if (error?.code === "auth/invalid-email") msg = "รูปแบบอีเมลไม่ถูกต้อง";
        else if (error?.code === "auth/too-many-requests")
          msg = "พยายามเข้าสู่ระบบบ่อยเกินไป กรุณารอสักครู่";
        else if (error?.code === "auth/network-request-failed")
          msg = "ไม่สามารถเชื่อมต่อเครือข่ายได้";
      }
      toast.error(msg);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    if (!authService) throw new Error("Authentication service not available");
    setIsLoading(true);
    try {
      const u = await authService.register(data);
      setUser(u);

      const status = safeGetServicesStatus();
      toast.success(
        status.isDevelopment
          ? "สร้างบัญชีสำเร็จ! ข้อมูลจะถูกเก็บใน browser ของคุณ 💾"
          : `สร้างบัญชีสำเร็จ! ยินดีต้อนรับ ${u.name} 🎉`
      );
    } catch (error: any) {
      console.error("Register error:", error);
      const status = safeGetServicesStatus();
      let msg = "เกิดข้อผิดพลาดในการสร้างบัญชี";
      if (!status.isDevelopment) {
        if (error?.code === "auth/email-already-in-use") msg = "อีเมลนี้ถูกใช้งานแล้ว";
        else if (error?.code === "auth/weak-password")
          msg = "รหัสผ่านไม่ปลอดภัย กรุณาใช้รหัสผ่านที่แข็งแกร่งกว่านี้";
        else if (error?.code === "auth/invalid-email") msg = "รูปแบบอีเมลไม่ถูกต้อง";
        else if (error?.code === "auth/network-request-failed")
          msg = "ไม่สามารถเชื่อมต่อเครือข่ายได้";
      }
      toast.error(msg);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    if (!authService) return;
    try {
      await authService.logout();
      setUser(null);
      setRecentPlans([]);
      const status = safeGetServicesStatus();
      toast.success(
        status.isDevelopment
          ? "ออกจากระบบสำเร็จ (โหมดทดสอบ) 👋"
          : "ออกจากระบบสำเร็จ"
      );
    } catch (e) {
      console.error("Logout error:", e);
      toast.error("เกิดข้อผิดพลาดในการออกจากระบบ");
    }
  };

  const updateUser = async (
    updates: Partial<Pick<User, "name" | "profile" | "email">>
  ) => {
    if (!user || !authService) return;
    try {
      await authService.updateUser(updates);
      setUser((prev) => (prev ? { ...prev, ...updates } : prev));
      toast.success("บันทึกข้อมูลสำเร็จ ✅");
    } catch (e) {
      console.error("Update user error:", e);
      toast.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      throw e;
    }
  };

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
    refreshRecentPlans,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
