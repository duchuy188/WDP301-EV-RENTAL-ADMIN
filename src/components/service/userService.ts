import { axiosInstance } from './api/axiosInstance';
import { User, UsersResponse, UsersParams, UpdateUserPayload, CreateStaffPayload, CreateStaffResponse } from './type/userTypes';
import { buildQueryParams, isTimeoutError, isNetworkError, retryWithBackoff } from './utils/apiUtils';

export class UserService {
  /**
   * Get list of users with pagination and filtering
   * @param params - Query parameters for filtering and pagination
   * @returns Promise<UsersResponse>
   */
  static async getUsers(params?: UsersParams): Promise<UsersResponse> {
    const requestParams = buildQueryParams(params);
    
    const response = await axiosInstance.get('/api/users', {
      params: requestParams,
    });

    return response.data;
  }

  /**
   * Get a single user by ID
   * @param userId - User ID
   * @returns Promise<User>
   */
  static async getUserById(userId: string): Promise<User> {
    const response = await axiosInstance.get(`/api/users/${userId}`);
    return response.data;
  }

  /**
   * Update a user's information (PUT)
   * @param userId - User ID
   * @param payload - Fields to update
   * @returns Promise<User>
   */
  static async updateUser(userId: string, payload: UpdateUserPayload): Promise<User> {
    const response = await axiosInstance.put(`/api/users/${userId}`, payload);
    return response.data;
  }

  /**
   * Update user status
   * @param userId - User ID
   * @param status - New status
   * @returns Promise<User>
   */
  static async updateUserStatus(
    userId: string,
    status: 'active' | 'blocked'
  ): Promise<User> {
    const response = await axiosInstance.patch(`/api/users/${userId}/status`, {
      status,
    });
    return response.data;
  }

  /**
   * Update user role
   * @param userId - User ID
   * @param role - New role
   * @returns Promise<User>
   */
  static async updateUserRole(
    userId: string,
    role: 'Admin' | 'Station Staff' | 'EV Renter'
  ): Promise<User> {
    const response = await axiosInstance.patch(`/api/users/${userId}/role`, {
      role,
    });
    return response.data;
  }

  /**
   * Delete user
   * @param userId - User ID
   * @returns Promise<void>
   */
  static async deleteUser(userId: string): Promise<void> {
    await axiosInstance.delete(`/api/users/${userId}`);
  }

  /**
   * Search users by query
   * @param query - Search query
   * @param params - Additional parameters
   * @returns Promise<UsersResponse>
   */
  static async searchUsers(query: string, params?: Omit<UsersParams, 'search'>): Promise<UsersResponse> {
    return this.getUsers({
      ...params,
      search: query,
    });
  }

  /**
   * Get users by role
   * @param role - User role
   * @param params - Additional parameters
   * @returns Promise<UsersResponse>
   */
  static async getUsersByRole(
    role: 'Admin' | 'Station Staff' | 'EV Renter',
    params?: Omit<UsersParams, 'role'>
  ): Promise<UsersResponse> {
    return this.getUsers({
      ...params,
      role,
    });
  }

  /**
   * Get users by status
   * @param status - User status
   * @param params - Additional parameters
   * @returns Promise<UsersResponse>
   */
  static async getUsersByStatus(
    status: 'active' | 'blocked',
    params?: Omit<UsersParams, 'status'>
  ): Promise<UsersResponse> {
    return this.getUsers({
      ...params,
      status,
    });
  }

  /**
   * Get risky customers list
   * @param params - Query parameters (excluding role)
   * @returns Promise<UsersResponse>
   */
  static async getRiskyCustomers(params?: Omit<UsersParams, 'role'>): Promise<UsersResponse> {
    const requestParams = buildQueryParams(params);
    const response = await axiosInstance.get('/api/users/risky-customers', {
      params: requestParams,
    });
    return response.data;
  }

  /**
   * Create a new staff account with retry logic
   * @param payload - Staff creation data
   * @param retryCount - Current retry attempt
   * @returns Promise<CreateStaffResponse>
   */
  static async createStaff(payload: CreateStaffPayload): Promise<CreateStaffResponse> {
    return retryWithBackoff(
      async () => {
        const response = await axiosInstance.post('/api/users/staff', payload);
        return response.data;
      },
      2, // maxRetries
      1000 // baseDelay
    ).catch((error: any) => {
      // Handle timeout errors specially
      if (isTimeoutError(error)) {
        throw new Error('Server đang xử lý chậm. Tài khoản có thể đã được tạo thành công. Vui lòng kiểm tra danh sách nhân viên.');
      }

      // Handle network errors specially
      if (isNetworkError(error)) {
        throw new Error('Không thể kết nối đến server. Tài khoản có thể đã được tạo thành công. Vui lòng kiểm tra danh sách nhân viên.');
      }

      // Handle other errors
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create staff account';
      throw new Error(errorMessage);
    });
  }

}

