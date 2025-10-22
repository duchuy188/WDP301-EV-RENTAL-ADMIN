import { axiosInstance } from './api/axiosInstance';
import { 
  User, 
  UsersResponse, 
  UsersParams, 
  UpdateUserPayload, 
  CreateStaffPayload, 
  CreateStaffResponse,
  RiskyCustomersParams,
  RiskyCustomersResponse,
  RiskyCustomerDetailResponse,
  RiskScoreResponse,
  ResetRiskScoreResponse,
  AddViolationRequest,
  AddViolationResponse
} from './type/userTypes';
import { buildQueryParams, isTimeoutError, isNetworkError } from './utils/apiUtils';

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
    status: 'active' | 'suspended'
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
    status: 'active' | 'suspended',
    params?: Omit<UsersParams, 'status'>
  ): Promise<UsersResponse> {
    return this.getUsers({
      ...params,
      status,
    });
  }

  /**
   * Get risky customers list with full filters
   * GET /api/users/risky-customers
   * @param params - Query parameters with risk filters
   * @returns Promise<RiskyCustomersResponse>
   */
  static async getRiskyCustomers(params?: RiskyCustomersParams): Promise<RiskyCustomersResponse> {
    const response = await axiosInstance.get('/api/users/risky-customers', {
      params: {
        page: params?.page || 1,
        limit: params?.limit || 10,
        minRiskScore: params?.minRiskScore,
        riskLevel: params?.riskLevel,
        search: params?.search,
      },
    });
    return response.data;
  }

  /**
   * Get risky customer detail
   * GET /api/users/risky-customers/{id}
   * @param id - Customer ID
   * @returns Promise<RiskyCustomerDetailResponse>
   */
  static async getRiskyCustomerDetail(id: string): Promise<RiskyCustomerDetailResponse> {
    const response = await axiosInstance.get(`/api/users/risky-customers/${id}`);
    return response.data;
  }

  /**
   * Get user risk score
   * GET /api/users/{id}/risk-score
   * @param id - User ID
   * @returns Promise<RiskScoreResponse>
   */
  static async getRiskScore(id: string): Promise<RiskScoreResponse> {
    const response = await axiosInstance.get(`/api/users/${id}/risk-score`);
    return response.data;
  }

  /**
   * Reset user risk score
   * POST /api/users/{id}/reset-risk-score
   * @param id - User ID
   * @returns Promise<ResetRiskScoreResponse>
   */
  static async resetRiskScore(id: string): Promise<ResetRiskScoreResponse> {
    const response = await axiosInstance.post(`/api/users/${id}/reset-risk-score`);
    return response.data;
  }

  /**
   * Add violation to user
   * POST /api/users/{id}/violations
   * @param id - User ID
   * @param data - Violation data
   * @returns Promise<AddViolationResponse>
   */
  static async addViolation(id: string, data: AddViolationRequest): Promise<AddViolationResponse> {
    const response = await axiosInstance.post(`/api/users/${id}/violations`, data);
    return response.data;
  }

  /**
   * Create a new staff account - simplified without retry logic
   * @param payload - Staff creation data
   * @returns Promise<CreateStaffResponse>
   */
  static async createStaff(payload: CreateStaffPayload): Promise<CreateStaffResponse> {
    try {
      console.log('Creating staff with payload:', payload);
      const response = await axiosInstance.post('/api/users/staff', payload);
      console.log('Staff creation response:', response);
      return response.data;
    } catch (error: any) {
      console.log('CreateStaff error details:', error);
      console.log('Error response:', error.response);
      console.log('Error status:', error.response?.status);
      console.log('Error message:', error.response?.data?.message);
      
      // Handle 400 Bad Request specifically
      if (error.response?.status === 400) {
        const errorMsg = error.response?.data?.message || '';
        console.log('400 error message:', errorMsg);
        
        // Check if it's a duplicate email error
        if (errorMsg.includes('email') || errorMsg.includes('đã tồn tại') || errorMsg.includes('already exists') || errorMsg.includes('duplicate')) {
          throw new Error('DUPLICATE_EMAIL');
        }
        
        // Other validation errors
        throw new Error(`VALIDATION_ERROR: ${errorMsg}`);
      }

      // Handle timeout errors
      if (isTimeoutError(error)) {
        throw new Error('TIMEOUT_ERROR');
      }

      // Handle network errors
      if (isNetworkError(error)) {
        throw new Error('NETWORK_ERROR');
      }

      // Handle other errors
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      throw new Error(`API_ERROR: ${errorMessage}`);
    }
  }

}

