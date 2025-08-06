import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { Settings } from './components/Settings';
import { UserProfileForm } from './components/UserProfileForm';
import { CalorieResult } from './components/CalorieResult';
import { MealPlanDisplay } from './components/MealPlanDisplay';
import { Button } from './components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Skeleton } from './components/ui/skeleton';
import { Toaster } from './components/ui/sonner';
import { UserProfile, CalorieCalculation, MealPlan, DailyPlan } from './types';
import { calculateTargetCalories, calculateTDEE, generateMealPlan } from './utils/calculations';
import { ArrowLeft, BarChart3, Calendar, Utensils, Plus } from 'lucide-react';
import { toast } from 'sonner';


function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="space-y-4 text-center">
        <Skeleton className="h-12 w-12 rounded-full mx-auto" />
        <Skeleton className="h-4 w-32 mx-auto" />
        <Skeleton className="h-4 w-24 mx-auto" />
      </div>
    </div>
  );
}

function AuthenticatedApp() {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'settings'>('dashboard');
  const [currentView, setCurrentView] = useState<'dashboard' | 'form' | 'results'>('dashboard');
  const [dailyPlan, setDailyPlan] = useState<DailyPlan | null>(null);
  
  // Mock recent plans data - in real app this would come from API/database
  const [recentPlans] = useState<DailyPlan[]>([]);

  const handleProfileSubmit = (profile: UserProfile) => {
    try {
      // คำนวณแคลอรี่
      const tdee = calculateTDEE(0, profile.activityLevel);
      const calorieCalc = calculateTargetCalories(profile, tdee);
      
      // สร้างแผนอาหาร
      const mealPlan = generateMealPlan(calorieCalc.targetCalories, profile.goal);
      
      // สร้างแผนรายวัน
      const newDailyPlan: DailyPlan = {
        profile,
        calorieCalc,
        mealPlan,
        generatedAt: new Date().toISOString()
      };
      
      setDailyPlan(newDailyPlan);
      setCurrentView('results');
      
      toast.success('คำนวณแผนอาหารสำเร็จ!');
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการคำนวณ กรุณาลองใหม่');
      console.error('Error calculating plan:', error);
    }
  };

  const handleGenerateNewMeal = () => {
    if (!dailyPlan) return;
    
    try {
      const newMealPlan = generateMealPlan(dailyPlan.calorieCalc.targetCalories, dailyPlan.profile.goal);
      setDailyPlan(prev => prev ? { ...prev, mealPlan: newMealPlan } : null);
      toast.success('สุ่มเมนูใหม่สำเร็จ!');
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการสุ่มเมนู');
      console.error('Error generating new meal:', error);
    }
  };

  const handleCreatePlan = () => {
    setCurrentView('form');
    setDailyPlan(null);
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setCurrentPage('dashboard');
  };

  const handleQuickPlanFromProfile = () => {
    if (user?.profile) {
      handleProfileSubmit(user.profile);
    } else {
      handleCreatePlan();
    }
  };

  // แสดงหน้าตั้งค่า
  if (currentPage === 'settings') {
    return (
      <div className="min-h-screen bg-background">
        <Navigation onNavigate={setCurrentPage} currentPage={currentPage} />
        <Settings />
      </div>
    );
  }

  // แสดงหน้า Dashboard หลัก
  if (currentView === 'dashboard') {
    return (
      <div className="min-h-screen bg-background">
        <Navigation onNavigate={setCurrentPage} currentPage={currentPage} />
        <Dashboard 
          onCreatePlan={handleCreatePlan}
          onNavigateToSettings={() => setCurrentPage('settings')}
          recentPlans={recentPlans}
        />
      </div>
    );
  }

  // แสดงฟอร์มกรอกข้อมูล
  if (currentView === 'form') {
    return (
      <div className="min-h-screen bg-background">
        <Navigation onNavigate={setCurrentPage} currentPage={currentPage} />
        <div className="max-w-4xl mx-auto p-6">
          {/* Back to Dashboard Button */}
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={handleBackToDashboard}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              กลับไปแดชบอร์ด
            </Button>
          </div>

          {/* Quick action for existing users */}
          {user?.profile && (
            <div className="mb-8">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <h2 className="mb-2">สร้างแผนอาหารใหม่</h2>
                    <p className="text-muted-foreground">
                      ใช้โปรไฟล์ปัจจุบันหรือปรับแต่งข้อมูลใหม่
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Button 
                        onClick={handleQuickPlanFromProfile} 
                        className="flex-1 sm:flex-none"
                      >
                        ใช้โปรไฟล์ปัจจุบัน
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setCurrentPage('settings')}
                        className="flex-1 sm:flex-none"
                      >
                        แก้ไขโปรไฟล์ก่อน
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          <UserProfileForm onSubmit={handleProfileSubmit} />
        </div>
      </div>
    );
  }

  // Loading state
  if (!dailyPlan) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation onNavigate={setCurrentPage} currentPage={currentPage} />
        <LoadingScreen />
      </div>
    );
  }

  // แสดงผลลัพธ์แผนอาหาร
  return (
    <div className="min-h-screen bg-background">
      <Navigation onNavigate={setCurrentPage} currentPage={currentPage} />
      
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={handleBackToDashboard} 
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">แดชบอร์ด</span>
              </Button>
              <div>
                <h1 className="flex items-center gap-2">
                  แผนอาหารส่วนตัว
                </h1>
                <p className="text-sm text-muted-foreground">
                  {user?.name} • {dailyPlan.mealPlan.date}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                onClick={handleCreatePlan} 
                variant="outline" 
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">สร้างแผนใหม่</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">ภาพรวม</span>
            </TabsTrigger>
            <TabsTrigger value="calories" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">แคลอรี่</span>
            </TabsTrigger>
            <TabsTrigger value="meals" className="flex items-center gap-2">
              <Utensils className="h-4 w-4" />
              <span className="hidden sm:inline">เมนูอาหาร</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <CalorieResult 
                profile={dailyPlan.profile} 
                calculation={dailyPlan.calorieCalc} 
              />
              <Card>
                <CardHeader>
                  <CardTitle>สรุปแผนอาหารวันนี้</CardTitle>
                  <CardDescription>
                    เมนูที่ AI แนะนำเฉพาะสำหรับคุณ
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl">{dailyPlan.mealPlan.totalCalories}</div>
                      <div className="text-sm text-muted-foreground">แคลอรี่รวม</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl">
                        {dailyPlan.mealPlan.breakfast.length + 
                         dailyPlan.mealPlan.lunch.length + 
                         dailyPlan.mealPlan.dinner.length + 
                         dailyPlan.mealPlan.snacks.length}
                      </div>
                      <div className="text-sm text-muted-foreground">เมนูทั้งหมด</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>อาหารเช้า</span>
                      <span>{dailyPlan.mealPlan.breakfast.length} เมนู</span>
                    </div>
                    <div className="flex justify-between">
                      <span>อาหารกลางวัน</span>
                      <span>{dailyPlan.mealPlan.lunch.length} เมนู</span>
                    </div>
                    <div className="flex justify-between">
                      <span>อาหารเย็น</span>
                      <span>{dailyPlan.mealPlan.dinner.length} เมนู</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ของว่าง</span>
                      <span>{dailyPlan.mealPlan.snacks.length} เมนู</span>
                    </div>
                  </div>

                  <Button 
                    onClick={handleGenerateNewMeal} 
                    className="w-full"
                    variant="outline"
                  >
                    สุ่มเมนูใหม่
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="calories">
            <CalorieResult 
              profile={dailyPlan.profile} 
              calculation={dailyPlan.calorieCalc} 
            />
          </TabsContent>

          <TabsContent value="meals">
            <MealPlanDisplay
              mealPlan={dailyPlan.mealPlan}
              targetCalories={dailyPlan.calorieCalc.targetCalories}
              onGenerateNew={handleGenerateNewMeal}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function UnauthenticatedApp() {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  if (authMode === 'login') {
    return <LoginForm onSwitchToRegister={() => setAuthMode('register')} />;
  }

  return <RegisterForm onSwitchToLogin={() => setAuthMode('login')} />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster />
    </AuthProvider>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return isAuthenticated ? <AuthenticatedApp /> : <UnauthenticatedApp />;
}