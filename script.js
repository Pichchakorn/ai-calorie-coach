// Main Application Script
class AICalorieCoachApp {
  constructor() {
    this.currentUser = null;
    this.currentPage = 'dashboard';
    this.currentView = 'dashboard';
    this.currentPlan = null;
    this.isLoading = true;

    this.init();
  }

  async init() {
    try {
      // แสดง loading screen
      this.showLoading();

      // ตั้งค่า event listeners
      this.setupEventListeners();

      // ตรวจสอบ authentication
      await this.checkAuthentication();

      // ซ่อน loading screen
      this.hideLoading();

      console.log('🚀 AI Calorie Coach initialized');
    } catch (error) {
      console.error('Initialization error:', error);
      this.showToast('เกิดข้อผิดพลาดในการเริ่มต้นระบบ', 'error');
    }
  }

  // ตั้งค่า Event Listeners
  setupEventListeners() {
    // Authentication forms
    this.setupAuthForms();
    
    // Navigation
    this.setupNavigation();
    
    // Dashboard actions
    this.setupDashboardActions();
    
    // Profile form
    this.setupProfileForm();
    
    // Results page
    this.setupResultsPage();
    
    // Settings
    this.setupSettings();

    // Keyboard shortcuts
    this.setupKeyboardShortcuts();
  }

  // Authentication Forms
  setupAuthForms() {
    // Login form
    const loginForm = document.getElementById('login-form-element');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleLogin(e);
      });
    }

    // Register form
    const registerForm = document.getElementById('register-form-element');
    if (registerForm) {
      registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleRegister(e);
      });
    }

    // Switch between login/register
    const switchToRegister = document.getElementById('switch-to-register');
    const switchToLogin = document.getElementById('switch-to-login');
    
    if (switchToRegister) {
      switchToRegister.addEventListener('click', (e) => {
        e.preventDefault();
        this.showRegisterForm();
      });
    }
    
    if (switchToLogin) {
      switchToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        this.showLoginForm();
      });
    }
  }

  // Navigation
  setupNavigation() {
    const navDashboard = document.getElementById('nav-dashboard');
    const navSettings = document.getElementById('nav-settings');
    const logoutBtn = document.getElementById('logout-btn');

    if (navDashboard) {
      navDashboard.addEventListener('click', () => this.navigateTo('dashboard'));
    }

    if (navSettings) {
      navSettings.addEventListener('click', () => this.navigateTo('settings'));
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.handleLogout());
    }
  }

  // Dashboard Actions
  setupDashboardActions() {
    const createPlanBtn = document.getElementById('create-plan-btn');
    const quickPlanBtn = document.getElementById('quick-plan-btn');
    const createFirstPlan = document.getElementById('create-first-plan');

    if (createPlanBtn) {
      createPlanBtn.addEventListener('click', () => this.showProfileForm());
    }

    if (quickPlanBtn) {
      quickPlanBtn.addEventListener('click', () => this.handleQuickPlan());
    }

    if (createFirstPlan) {
      createFirstPlan.addEventListener('click', () => this.showProfileForm());
    }

    // Back buttons
    const backToDashboard = document.getElementById('back-to-dashboard');
    const backFromResults = document.getElementById('back-to-dashboard-from-results');

    if (backToDashboard) {
      backToDashboard.addEventListener('click', () => this.showDashboard());
    }

    if (backFromResults) {
      backFromResults.addEventListener('click', () => this.showDashboard());
    }
  }

  // Profile Form
  setupProfileForm() {
    const profileForm = document.getElementById('meal-plan-form');
    const useCurrentProfile = document.getElementById('use-current-profile');

    if (profileForm) {
      profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleProfileSubmit(e);
      });
    }

    if (useCurrentProfile) {
      useCurrentProfile.addEventListener('click', () => this.useCurrentProfile());
    }
  }

  // Results Page
  setupResultsPage() {
    // Tab switching
    const tabTriggers = document.querySelectorAll('.tab-trigger');
    tabTriggers.forEach(trigger => {
      trigger.addEventListener('click', (e) => {
        const tabName = e.currentTarget.dataset.tab;
        this.switchTab(tabName);
      });
    });

    // Action buttons
    const createNewPlanBtn = document.getElementById('create-new-plan-btn');
    const savePlanBtn = document.getElementById('save-plan-btn');
    const randomizeMealsBtn = document.getElementById('randomize-meals-btn');
    const regenerateAllMeals = document.getElementById('regenerate-all-meals');

    if (createNewPlanBtn) {
      createNewPlanBtn.addEventListener('click', () => this.showProfileForm());
    }

    if (savePlanBtn) {
      savePlanBtn.addEventListener('click', () => this.savePlan());
    }

    if (randomizeMealsBtn) {
      randomizeMealsBtn.addEventListener('click', () => this.regenerateMeals());
    }

    if (regenerateAllMeals) {
      regenerateAllMeals.addEventListener('click', () => this.regenerateMeals());
    }
  }

  // Settings
  setupSettings() {
    const profileForm = document.getElementById('profile-form');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const notificationsToggle = document.getElementById('notifications-toggle');

    if (profileForm) {
      profileForm.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        await this.handleUpdateProfile(e);
      });
    }

    if (darkModeToggle) {
      darkModeToggle.addEventListener('change', (e) => {
        this.toggleDarkMode(e.target.checked);
      });
    }

    if (notificationsToggle) {
      notificationsToggle.addEventListener('change', (e) => {
        this.toggleNotifications(e.target.checked);
      });
    }
  }

  // Keyboard Shortcuts
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // ESC to go back
      if (e.key === 'Escape') {
        if (this.currentView === 'results' || this.currentView === 'form') {
          this.showDashboard();
        }
      }
      
      // Ctrl/Cmd + N for new plan
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        if (this.currentUser) {
          this.showProfileForm();
        }
      }

      // Ctrl/Cmd + S to save plan
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (this.currentPlan) {
          this.savePlan();
        }
      }
    });
  }

  // Authentication Methods
  async handleLogin(e) {
    const formData = new FormData(e.target);
    const email = formData.get('email') || document.getElementById('login-email').value;
    const password = formData.get('password') || document.getElementById('login-password').value;

    try {
      this.showToast('กำลังเข้าสู่ระบบ...', 'info');
      
      const user = await window.authService.login(email, password);
      this.currentUser = user;
      
      this.showMainApp();
      this.updateUserDisplay();
      this.loadDashboardData();
      
      this.showToast(window.MESSAGES.success.login, 'success');
    } catch (error) {
      console.error('Login error:', error);
      this.showToast(error.message || window.MESSAGES.error.loginFailed, 'error');
    }
  }

  async handleRegister(e) {
    const formData = new FormData(e.target);
    const name = formData.get('name') || document.getElementById('register-name').value;
    const email = formData.get('email') || document.getElementById('register-email').value; 
    const password = formData.get('password') || document.getElementById('register-password').value;

    try {
      this.showToast('กำลังสร้างบัญชี...', 'info');
      
      const user = await window.authService.register({ name, email, password });
      this.currentUser = user;
      
      this.showMainApp();
      this.updateUserDisplay();
      this.loadDashboardData();
      
      this.showToast(window.MESSAGES.success.register, 'success');
    } catch (error) {
      console.error('Register error:', error);
      this.showToast(error.message || window.MESSAGES.error.formInvalid, 'error');
    }
  }

  async handleLogout() {
    try {
      await window.authService.logout();
      this.currentUser = null;
      this.currentPlan = null;
      
      this.showAuthSection();
      this.showToast(window.MESSAGES.success.logout, 'success');
    } catch (error) {
      console.error('Logout error:', error);
      this.showToast('เกิดข้อผิดพลาดในการออกจากระบบ', 'error');
    }
  }

  // Profile and Plan Methods
  async handleProfileSubmit(e) {
    const formData = new FormData(e.target);
    
    const profile = {
      age: parseInt(formData.get('age')) || parseInt(document.getElementById('plan-age').value),
      gender: formData.get('gender') || document.getElementById('plan-gender').value,
      height: parseInt(formData.get('height')) || parseInt(document.getElementById('plan-height').value),
      weight: parseFloat(formData.get('weight')) || parseFloat(document.getElementById('plan-weight').value),
      targetWeight: parseFloat(formData.get('targetWeight')) || parseFloat(document.getElementById('plan-target-weight').value) || null,
      activityLevel: formData.get('activityLevel') || document.getElementById('plan-activity').value,
      goal: formData.get('goal') || document.getElementById('plan-goal').value,
      timeframe: parseInt(formData.get('timeframe')) || parseInt(document.getElementById('plan-timeframe').value) || null
    };

    try {
      // ตรวจสอบข้อมูล
      const validation = window.calculatorService.validateProfile(profile);
      if (!validation.isValid) {
        this.showToast(validation.errors[0], 'error');
        return;
      }

      this.showToast(window.MESSAGES.info.calculating, 'info');
      
      // คำนวณแคลอรี่
      const calculation = window.calculatorService.calculateTargetCalories(profile);
      
      this.showToast(window.MESSAGES.info.generating, 'info');
      
      // สร้างแผนอาหาร
      const mealPlan = window.mealPlanner.generateMealPlan(calculation.targetCalories, profile.goal);
      
      // สร้างแผนรายวัน
      this.currentPlan = {
        profile,
        calculation,
        mealPlan,
        generatedAt: new Date().toISOString()
      };
      
      this.showResults();
      this.showToast(window.MESSAGES.success.planCreated, 'success');
      
    } catch (error) {
      console.error('Profile submit error:', error);
      this.showToast(error.message || window.MESSAGES.error.calculationError, 'error');
    }
  }

  async handleUpdateProfile(e) {
    const formData = new FormData(e.target);
    
    const profileData = {
      name: formData.get('name') || document.getElementById('profile-name').value,
      profile: {
        age: parseInt(formData.get('age')) || parseInt(document.getElementById('profile-age').value),
        gender: formData.get('gender') || document.getElementById('profile-gender').value,
        height: parseInt(formData.get('height')) || parseInt(document.getElementById('profile-height').value),
        weight: parseFloat(formData.get('weight')) || parseFloat(document.getElementById('profile-weight').value),
        targetWeight: parseFloat(formData.get('targetWeight')) || parseFloat(document.getElementById('profile-target-weight').value) || null,
        activityLevel: formData.get('activityLevel') || document.getElementById('profile-activity').value,
        goal: formData.get('goal') || document.getElementById('profile-goal').value
      }
    };

    try {
      await window.authService.updateUser(profileData);
      this.currentUser = { ...this.currentUser, ...profileData };
      this.updateUserDisplay();
      
      this.showToast(window.MESSAGES.success.profileSaved, 'success');
    } catch (error) {
      console.error('Update profile error:', error);
      this.showToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
    }
  }

  // Plan Actions
  handleQuickPlan() {
    if (this.currentUser?.profile) {
      // ใช้โปรไฟล์ปัจจุบัน
      const profile = this.currentUser.profile;
      
      try {
        const calculation = window.calculatorService.calculateTargetCalories(profile);
        const mealPlan = window.mealPlanner.generateMealPlan(calculation.targetCalories, profile.goal);
        
        this.currentPlan = {
          profile,
          calculation,
          mealPlan,
          generatedAt: new Date().toISOString()
        };
        
        this.showResults();
        this.showToast('สร้างแผนด่วนสำเร็จ!', 'success');
      } catch (error) {
        console.error('Quick plan error:', error);
        this.showToast('เกิดข้อผิดพลาดในการสร้างแผนด่วน', 'error');
      }
    } else {
      this.showProfileForm();
    }
  }

  regenerateMeals() {
    if (!this.currentPlan) return;
    
    try {
      const newMealPlan = window.mealPlanner.generateMealPlan(
        this.currentPlan.calculation.targetCalories, 
        this.currentPlan.profile.goal
      );
      
      this.currentPlan.mealPlan = newMealPlan;
      this.updateResultsDisplay();
      
      this.showToast(window.MESSAGES.success.mealGenerated, 'success');
    } catch (error) {
      console.error('Regenerate meals error:', error);
      this.showToast('เกิดข้อผิดพลาดในการสุ่มเมนู', 'error');
    }
  }

  savePlan() {
    if (!this.currentPlan || !this.currentUser) return;
    
    try {
      window.mealPlanner.saveMealPlan(this.currentPlan, this.currentUser.id);
      this.loadDashboardData(); // อัปเดต recent plans
      this.showToast(window.MESSAGES.success.planSaved, 'success');
    } catch (error) {
      console.error('Save plan error:', error);
      this.showToast('เกิดข้อผิดพลาดในการบันทึกแผน', 'error');
    }
  }

  // UI Methods
  showLoading() {
    document.getElementById('loading-screen').classList.remove('hidden');
  }

  hideLoading() {
    document.getElementById('loading-screen').classList.add('hidden');
  }

  showAuthSection() {
    document.getElementById('auth-section').classList.remove('hidden');
    document.getElementById('main-app').classList.add('hidden');
  }

  showMainApp() {
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('main-app').classList.remove('hidden');
  }

  showLoginForm() {
    document.getElementById('login-form').classList.remove('hidden');
    document.getElementById('register-form').classList.add('hidden');
  }

  showRegisterForm() {
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('register-form').classList.remove('hidden');
  }

  showDashboard() {
    this.currentView = 'dashboard';
    this.navigateTo('dashboard');
    
    document.getElementById('dashboard-page').classList.remove('hidden');
    document.getElementById('settings-page').classList.add('hidden');
    document.getElementById('profile-form-page').classList.add('hidden');
    document.getElementById('results-page').classList.add('hidden');
  }

  showProfileForm() {
    this.currentView = 'form';
    
    document.getElementById('dashboard-page').classList.add('hidden');
    document.getElementById('settings-page').classList.add('hidden');
    document.getElementById('profile-form-page').classList.remove('hidden');
    document.getElementById('results-page').classList.add('hidden');
    
    this.populateProfileForm();
  }

  showResults() {
    this.currentView = 'results';
    
    document.getElementById('dashboard-page').classList.add('hidden');
    document.getElementById('settings-page').classList.add('hidden');
    document.getElementById('profile-form-page').classList.add('hidden');
    document.getElementById('results-page').classList.remove('hidden');
    
    this.updateResultsDisplay();
  }

  navigateTo(page) {
    this.currentPage = page;
    
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
    });
    
    if (page === 'dashboard') {
      document.getElementById('nav-dashboard').classList.add('active');
      document.getElementById('dashboard-page').classList.remove('hidden');
      document.getElementById('settings-page').classList.add('hidden');
    } else if (page === 'settings') {
      document.getElementById('nav-settings').classList.add('active');
      document.getElementById('dashboard-page').classList.add('hidden');
      document.getElementById('settings-page').classList.remove('hidden');
      this.populateSettingsForm();
    }
  }

  switchTab(tabName) {
    // Update tab triggers
    document.querySelectorAll('.tab-trigger').forEach(trigger => {
      trigger.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(`tab-${tabName}`).classList.add('active');
  }

  // Data Population Methods
  populateProfileForm() {
    if (this.currentUser?.profile) {
      const profile = this.currentUser.profile;
      
      // Profile form page
      if (document.getElementById('plan-age')) {
        document.getElementById('plan-age').value = profile.age || '';
        document.getElementById('plan-gender').value = profile.gender || '';
        document.getElementById('plan-height').value = profile.height || '';
        document.getElementById('plan-weight').value = profile.weight || '';
        document.getElementById('plan-target-weight').value = profile.targetWeight || '';
        document.getElementById('plan-activity').value = profile.activityLevel || '';
        document.getElementById('plan-goal').value = profile.goal || '';
        document.getElementById('plan-timeframe').value = profile.timeframe || '';
      }
    }
  }

  populateSettingsForm() {
    if (this.currentUser) {
      document.getElementById('profile-name').value = this.currentUser.name || '';
      
      if (this.currentUser.profile) {
        const profile = this.currentUser.profile;
        document.getElementById('profile-age').value = profile.age || '';
        document.getElementById('profile-gender').value = profile.gender || '';
        document.getElementById('profile-height').value = profile.height || '';
        document.getElementById('profile-weight').value = profile.weight || '';
        document.getElementById('profile-target-weight').value = profile.targetWeight || '';
        document.getElementById('profile-activity').value = profile.activityLevel || '';
        document.getElementById('profile-goal').value = profile.goal || '';
      }
    }
  }

  updateUserDisplay() {
    if (this.currentUser) {
      const displayElement = document.getElementById('user-name-display');
      if (displayElement) {
        displayElement.textContent = `สวัสดี ${this.currentUser.name}!`;
      }
    }
  }

  updateResultsDisplay() {
    if (!this.currentPlan) return;
    
    const { profile, calculation, mealPlan } = this.currentPlan;
    
    // Update header info
    const userInfo = document.getElementById('results-user-info');
    if (userInfo) {
      userInfo.textContent = `สำหรับ ${this.currentUser?.name || 'คุณ'} • ${mealPlan.date}`;
    }
    
    // Update calorie values
    document.getElementById('bmr-value').textContent = `${calculation.bmr} แคลอรี่`;
    document.getElementById('tdee-value').textContent = `${calculation.tdee} แคลอรี่`;
    document.getElementById('target-value').textContent = `${calculation.targetCalories} แคลอรี่`;
    
    // Update meal summary
    const counts = window.calculateMealCounts(mealPlan);
    document.getElementById('total-meal-calories').textContent = mealPlan.totalCalories;
    document.getElementById('total-meals').textContent = counts.total;
    document.getElementById('breakfast-count').textContent = `${counts.breakfast} เมนู`;
    document.getElementById('lunch-count').textContent = `${counts.lunch} เมนู`;
    document.getElementById('dinner-count').textContent = `${counts.dinner} เมนู`;
    document.getElementById('snacks-count').textContent = `${counts.snacks} เมนู`;
    
    // Update formulas
    this.updateFormulaDisplay(calculation);
    
    // Update AI recommendation
    const recommendation = window.calculatorService.generateAIRecommendation(profile, calculation);
    document.getElementById('ai-recommendation').textContent = recommendation.main;
    
    // Update meal displays
    this.updateMealDisplay('breakfast', mealPlan.breakfast);
    this.updateMealDisplay('lunch', mealPlan.lunch);
    this.updateMealDisplay('dinner', mealPlan.dinner);
    this.updateMealDisplay('snacks', mealPlan.snacks);
  }

  updateFormulaDisplay(calculation) {
    if (calculation.formula) {
      document.getElementById('bmr-formula').textContent = calculation.formula.bmr.formula;
      document.getElementById('tdee-formula').textContent = calculation.formula.tdee.formula;
      document.getElementById('goal-formula').textContent = calculation.formula.target.formula;
    }
  }

  updateMealDisplay(mealType, meals) {
    const container = document.getElementById(`${mealType}-items`);
    const caloriesElement = document.getElementById(`${mealType}-calories`);
    
    if (!container) return;
    
    // คำนวณแคลอรี่รวม
    const totalCalories = window.calculateMealCalories(meals);
    if (caloriesElement) {
      caloriesElement.textContent = `${totalCalories} แคลอรี่`;
    }
    
    // สร้าง HTML สำหรับเมนู
    container.innerHTML = meals.map(meal => `
      <div class="meal-item">
        <div class="meal-item-header">
          <h4>${meal.name}</h4>
          <div class="meal-item-calories">${meal.calories} แคลอรี่</div>
        </div>
        <p>${meal.description}</p>
        <div class="meal-item-tags">
          ${meal.tags.map(tag => `<span class="meal-tag">${tag}</span>`).join('')}
        </div>
      </div>
    `).join('');
  }

  loadDashboardData() {
    if (!this.currentUser) return;
    
    // โหลดแผนล่าสุด
    const recentPlans = window.mealPlanner.getSavedPlans(this.currentUser.id);
    this.updateRecentPlansList(recentPlans);
    
    // อัปเดตสถิติ
    this.updateDashboardStats(recentPlans);
  }

  updateRecentPlansList(plans) {
    const container = document.getElementById('recent-plans-list');
    if (!container) return;
    
    if (plans.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-utensils"></i>
          <p>ยังไม่มีแผนอาหาร</p>
          <button class="btn btn-primary" id="create-first-plan">สร้างแผนแรก</button>
        </div>
      `;
      
      // Re-attach event listener
      const createFirstPlan = document.getElementById('create-first-plan');
      if (createFirstPlan) {
        createFirstPlan.addEventListener('click', () => this.showProfileForm());
      }
      return;
    }
    
    container.innerHTML = plans.slice(0, 6).map(plan => `
      <div class="plan-card" data-plan-id="${plan.id}">
        <h4>แผนอาหาร ${window.getGoalText(plan.profile.goal)}</h4>
        <div class="plan-meta">
          <span>${plan.mealPlan.date}</span>
          <span>${plan.calculation.targetCalories} แคลอรี่</span>
        </div>
        <div class="plan-stats">
          <span>${plan.mealPlan.totalCalories} แคลอรี่รวม</span>
          <span>${window.calculateMealCounts(plan.mealPlan).total} เมนู</span>
        </div>
      </div>
    `).join('');
    
    // Add click handlers for plan cards
    container.querySelectorAll('.plan-card').forEach(card => {
      card.addEventListener('click', () => {
        const planId = card.dataset.planId;
        this.loadPlan(planId);
      });
    });
  }

  updateDashboardStats(plans) {
    const totalPlans = plans.length;
    const todayCalories = plans.length > 0 ? plans[0].mealPlan.totalCalories : 0;
    
    document.getElementById('total-plans').textContent = totalPlans;
    document.getElementById('total-calories').textContent = todayCalories;
    document.getElementById('goal-progress').textContent = totalPlans > 0 ? '85%' : '0%';
  }

  loadPlan(planId) {
    const plans = window.mealPlanner.getSavedPlans(this.currentUser.id);
    const plan = plans.find(p => p.id === planId);
    
    if (plan) {
      this.currentPlan = plan;
      this.showResults();
    }
  }

  // Utility Methods
  useCurrentProfile() {
    if (this.currentUser?.profile) {
      this.populateProfileForm();
      this.showToast('โหลดโปรไฟล์ปัจจุบันแล้ว', 'success');
    } else {
      this.showToast('ไม่พบโปรไฟล์ กรุณาไปตั้งค่าก่อน', 'warning');
    }
  }

  toggleDarkMode(enabled) {
    if (enabled) {
      document.body.classList.add('dark');
      localStorage.setItem('darkMode', 'enabled');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('darkMode', 'disabled');
    }
  }

  toggleNotifications(enabled) {
    localStorage.setItem('notifications', enabled ? 'enabled' : 'disabled');
    this.showToast(
      enabled ? 'เปิดการแจ้งเตือนแล้ว' : 'ปิดการแจ้งเตือนแล้ว', 
      'success'
    );
  }

  async checkAuthentication() {
    try {
      const user = window.authService.getCurrentUser();
      if (user) {
        this.currentUser = user;
        this.showMainApp();
        this.updateUserDisplay();
        this.loadDashboardData();
      } else {
        this.showAuthSection();
      }
    } catch (error) {
      console.error('Auth check error:', error);
      this.showAuthSection();
    }
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? 'fas fa-check-circle' : 
                 type === 'error' ? 'fas fa-exclamation-circle' :
                 type === 'warning' ? 'fas fa-exclamation-triangle' : 
                 'fas fa-info-circle';
    
    toast.innerHTML = `
      <div class="toast-icon">
        <i class="${icon}"></i>
      </div>
      <div class="toast-content">
        <div class="toast-message">${message}</div>
      </div>
    `;
    
    const container = document.getElementById('toast-container');
    container.appendChild(toast);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 3000);
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.app = new AICalorieCoachApp();
});

console.log('🎉 Main application script loaded');