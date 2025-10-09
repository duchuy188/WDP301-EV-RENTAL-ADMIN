// Station interface
export interface Station {
  _id: string;
  code: string;
  name: string;
  address?: string;
  status?: string;
}

// User types based on API documentation
export interface User {
  _id: string;
  fullname: string;
  email: string;
  phone: string;
  address?: string;
  avatar?: string;
  avatarPublicId?: string;
  status: 'active' | 'suspended';
  role: 'Admin' | 'Station Staff' | 'EV Renter';
  stationId?: string | Station | null;
  kycStatus: 'approved' | 'pending' | 'rejected' | 'not_submitted';
  createdAt: string;
  updatedAt: string;
  passwordHash?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: string;
  _v?: number;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface UsersResponse {
  users: User[];
  pagination: Pagination;
}

export interface UsersParams {
  page?: number;
  limit?: number;
  role?: 'Admin' | 'Station Staff' | 'EV Renter';
  status?: 'active' | 'suspended';
  stationId?: string;
  search?: string;
  sort?: 'createdAt' | 'fullname' | 'email';
}

// Payload for updating a user's profile information
export interface UpdateUserPayload {
  fullname?: string;
  email?: string;
  phone?: string;
  address?: string;
  avatar?: string;
  stationId?: string;
  status?: 'active' | 'suspended';
  kycStatus?: 'approved' | 'pending' | 'rejected' | 'not_submitted';
}

// Payload for creating a new staff account
export interface CreateStaffPayload {
  fullname: string;
  email: string;
  phone: string;
  role: 'Station Staff';
}

// Response from creating a staff account
export interface CreateStaffResponse {
  message: string;
  user: User;
  temporaryPassword: string;
}

