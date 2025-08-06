// Authentication System
class AuthManager {
  constructor() {
    this.currentUser = null;
    this.authListeners = [];
    this.init();
  }

  init() {
    // โหลดข้อมูลผู้ใช้จาก localStorage
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        this.currentUser = JSON.parse(savedUser);
        this.notifyAuthListeners(this.currentUser);
      } catch (error) {
        console.error('Error loading saved user:', error);
        localStorage.removeItem('currentUser');
      }
    }

    // สร้างข้อมูล demo users ถ้ายังไม่มี
    this.initializeDemoData();
  }

  initializeDemoData() {
    const users = this.getUsers();
    if (!users['demo@example.com']) {
      users['demo@example.com'] = {
        id: 'demo_user_001',
        name: 'ผู้ใช้ทดลอง',
        email: 'demo@example.com',
        password: '123456', // ใน production ควรเข้ารหัส
        createdAt: new Date().toISOString(),
        profile: {
          age: 25,
          gender: 'male',
          height: 170,
          weight: 70,
          targetWeight: 65,
          activityLevel: 'moderate',
          goal: 'lose'
        }
      };
      this.saveUsers(users);
      console.log('🎯 Demo data initialized');
    }
  }

  getUsers() {
    const users = localStorage.getItem('users');
    return users ? JSON.parse(users) : {};
  }

  saveUsers(users) {
    localStorage.setItem('users', JSON.stringify(users));
  }

  async login(email, password) {
    try {
      // จำลองความล่าช้าของ API
      await this.delay(500);

      const users = this.getUsers();
      const user = users[email];

      if (!user) {
        throw new Error('ไม่พบบัญชีผู้ใช้นี้');
      }

      if (user.password !== password) {
        throw new Error('รหัสผ่านไม่ถูกต้อง');
      }

      // สร้าง user object สำหรับ session (ไม่รวมรหัสผ่าน)
      this.currentUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        profile: user.profile
      };

      // บันทึกใน localStorage
      localStorage.setItem('currentUser', JSON.stringify(this.currentUser));

      // แจ้ง listeners
      this.notifyAuthListeners(this.currentUser);

      return this.currentUser;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async register(userData) {
    try {
      // จำลองความล่าช้าของ API
      await this.delay(800);

      const { name, email, password } = userData;
      
      // ตรวจสอบข้อมูล
      if (!name || !email || !password) {
        throw new Error('กรุณากรอกข้อมูลให้ครบถ้วน');
      }

      if (password.length < 6) {
        throw new Error('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      }

      const users = this.getUsers();

      // ตรวจสอบว่าอีเมลซ้ำหรือไม่
      if (users[email]) {
        throw new Error('อีเมลนี้ถูกใช้งานแล้ว');
      }

      // สร้างผู้ใช้ใหม่
      const newUser = {
        id: `user_${Date.now()}`,
        name,
        email,
        password, // ใน production ควรเข้ารหัส
        createdAt: new Date().toISOString(),
        profile: null
      };

      // บันทึกในฐานข้อมูล
      users[email] = newUser;
      this.saveUsers(users);

      // Login อัตโนมัติ
      this.currentUser = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        createdAt: newUser.createdAt,
        profile: newUser.profile
      };

      localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
      this.notifyAuthListeners(this.currentUser);

      return this.currentUser;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  }

  async logout() {
    try {
      this.currentUser = null;
      localStorage.removeItem('currentUser');
      this.notifyAuthListeners(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  async updateProfile(profileData) {
    try {
      if (!this.currentUser) {
        throw new Error('ไม่มีผู้ใช้ที่เข้าสู่ระบบ');
      }

      // อัปเดตโปรไฟล์ใน currentUser
      this.currentUser.profile = { ...this.currentUser.profile, ...profileData };
      
      // อัปเดตใน localStorage
      localStorage.setItem('currentUser', JSON.stringify(this.currentUser));

      // อัปเดตในฐานข้อมูลผู้ใช้
      const users = this.getUsers();
      if (users[this.currentUser.email]) {
        users[this.currentUser.email].profile = this.currentUser.profile;
        this.saveUsers(users);
      }

      this.notifyAuthListeners(this.currentUser);
      return this.currentUser;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  async updateUser(userData) {
    try {
      if (!this.currentUser) {
        throw new Error('ไม่มีผู้ใช้ที่เข้าสู่ระบบ');
      }

      // อัปเดตข้อมูลใน currentUser
      this.currentUser = { ...this.currentUser, ...userData };
      
      // อัปเดตใน localStorage
      localStorage.setItem('currentUser', JSON.stringify(this.currentUser));

      // อัปเดตในฐานข้อมูลผู้ใช้
      const users = this.getUsers();
      if (users[this.currentUser.email]) {
        Object.assign(users[this.currentUser.email], userData);
        this.saveUsers(users);
      }

      this.notifyAuthListeners(this.currentUser);
      return this.currentUser;
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  }

  getCurrentUser() {
    return this.currentUser;
  }

  isAuthenticated() {
    return this.currentUser !== null;
  }

  onAuthStateChanged(callback) {
    this.authListeners.push(callback);
    
    // เรียก callback ทันทีด้วยสถานะปัจจุบัน
    callback(this.currentUser);

    // return function เพื่อยกเลิกการฟัง
    return () => {
      const index = this.authListeners.indexOf(callback);
      if (index > -1) {
        this.authListeners.splice(index, 1);
      }
    };
  }

  notifyAuthListeners(user) {
    this.authListeners.forEach(listener => {
      try {
        listener(user);
      } catch (error) {
        console.error('Error in auth listener:', error);
      }
    });
  }

  // Helper method สำหรับจำลองความล่าช้า
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Method สำหรับล้างข้อมูลทั้งหมด (สำหรับ testing)
  clearAllData() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('users');
    localStorage.removeItem('dailyPlans');
    this.currentUser = null;
    this.notifyAuthListeners(null);
    console.log('🗑️ All data cleared');
  }

  // Method สำหรับสร้างข้อมูลตัวอย่าง
  createSampleData() {
    this.clearAllData();
    this.initializeDemoData();
    console.log('📦 Sample data created');
  }
}

// สร้าง instance และ export
window.authManager = new AuthManager();

// Export functions สำหรับใช้งานสะดวก
window.authService = {
  login: (email, password) => window.authManager.login(email, password),
  register: (userData) => window.authManager.register(userData),
  logout: () => window.authManager.logout(),
  updateProfile: (profileData) => window.authManager.updateProfile(profileData),
  updateUser: (userData) => window.authManager.updateUser(userData),
  getCurrentUser: () => window.authManager.getCurrentUser(),
  isAuthenticated: () => window.authManager.isAuthenticated(),
  onAuthStateChanged: (callback) => window.authManager.onAuthStateChanged(callback)
};

console.log('🔐 Auth system initialized');