import axiosInstance from './api/axiosInstance';
import { LoginRequest, LoginResponse, User } from './type/authTypes';
import { API_CONFIG } from '../../lib/apiConfig';

export class AuthService {
  /**
   * Authenticate user and return login response
   * @param credentials - Login credentials
   * @returns Promise<LoginResponse>
   */
  static async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      // Validate input
      this.validateLoginCredentials(credentials);

      // Clear any existing auth data first
      this.clearAuth();
      
      // Call the login API endpoint
      const response = await axiosInstance.post(API_CONFIG.endpoints.auth.login, {
        email: credentials.email.trim(),
        password: credentials.password
      });
      
      const data = response.data;
      
      // Validate response data structure
      this.validateLoginResponse(data);
      
      // Store token and refresh token immediately
      this.storeTokens(data);
      
      // Fetch and validate user profile
      const user = await this.fetchUserProfile();
      
      // Check admin role requirement
      this.validateAdminRole(user);
      
      // Store user data
      localStorage.setItem('auth_user', JSON.stringify(user));
      
      return {
        token: data.token,
        user: user
      };
    } catch (error: any) {
      // Always clear auth data on error
      this.clearAuth();
      
      // Re-throw with original message (axios interceptor handles status codes)
      throw error;
    }
  }

  /**
   * Validate login credentials
   * @param credentials - Login credentials
   */
  private static validateLoginCredentials(credentials: LoginRequest): void {
    if (!credentials.email || !credentials.password) {
      throw new Error('Email và mật khẩu là bắt buộc');
    }

    if (!credentials.email.includes('@')) {
      throw new Error('Vui lòng nhập địa chỉ email hợp lệ');
    }
  }

  /**
   * Validate login response data
   * @param data - Response data from login API
   */
  private static validateLoginResponse(data: any): void {
    if (!data || Object.keys(data).length === 0) {
      throw new Error('Server trả về dữ liệu rỗng. Vui lòng kiểm tra API endpoint hoặc thử lại sau.');
    }
    
    if (!data.token) {
      throw new Error('Không nhận được token xác thực từ server');
    }
  }

  /**
   * Store authentication tokens
   * @param data - Login response data
   */
  private static storeTokens(data: any): void {
    localStorage.setItem('auth_token', data.token);
    if (data.refreshToken) {
      localStorage.setItem('auth_refresh_token', data.refreshToken);
    }
  }

  /**
   * Fetch user profile from API
   * @returns Promise<User>
   */
  private static async fetchUserProfile(): Promise<User> {
    const profileResponse = await axiosInstance.get(API_CONFIG.endpoints.auth.profile);
    const user = profileResponse.data;
    
    if (!user || !user.email || !user.role) {
      throw new Error('Không nhận được thông tin người dùng hợp lệ từ API profile');
    }

    return user;
  }

  /**
   * Validate that user has Admin role
   * @param user - User object
   */
  private static validateAdminRole(user: User): void {
    if (user.role !== 'Admin') {
      this.clearAuth(); // Clear tokens if not admin
      throw new Error(`Truy cập bị từ chối. Chỉ người dùng Admin mới có thể truy cập hệ thống này. Vai trò của bạn: ${user.role}`);
    }
  }

  /**
   * Logout user and clear authentication data
   * @returns Promise<void>
   */
  static async logout(): Promise<void> {
    try {
      const token = this.getToken();
      const refreshToken = localStorage.getItem('auth_refresh_token');
      
      if (token && refreshToken) {
        await axiosInstance.post(API_CONFIG.endpoints.auth.logout, {
          refreshToken: refreshToken
        });
      }
    } catch (error: any) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error.message);
    } finally {
      // Always clear local storage
      this.clearAuth();
    }
  }

  /**
   * Get current user from localStorage
   * @returns User | null
   */
  static getCurrentUser(): User | null {
    try {
      const userStr = localStorage.getItem('auth_user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }

  /**
   * Get current authentication token
   * @returns string | null
   */
  static getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  /**
   * Check if user is authenticated and has Admin role
   * @returns boolean
   */
  static isAuthenticated(): boolean {
    try {
      const token = this.getToken();
      const user = this.getCurrentUser();
      return !!(token && user && user.role === 'Admin');
    } catch (error) {
      console.error('Auth check error:', error);
      return false;
    }
  }

  /**
   * Check if current user is Admin
   * @returns boolean
   */
  static isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'Admin' && !!this.getToken();
  }

  /**
   * Check if current user is Station Staff
   * @returns boolean
   */
  static isStationStaff(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'Station Staff';
  }

  /**
   * Check if current user is EV Renter
   * @returns boolean
   */
  static isEVRenter(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'EV Renter';
  }

  /**
   * Get current user role
   * @returns string | null
   */
  static getUserRole(): string | null {
    return this.getCurrentUser()?.role || null;
  }

  /**
   * Check if user has specific role
   * @param role - Role to check
   * @returns boolean
   */
  static hasRole(role: 'EV Renter' | 'Station Staff' | 'Admin'): boolean {
    return this.getCurrentUser()?.role === role;
  }

  /**
   * Clear all authentication data from localStorage
   */
  static clearAuth(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_refresh_token');
    localStorage.removeItem('auth_user');
  }
}

export default AuthService;
