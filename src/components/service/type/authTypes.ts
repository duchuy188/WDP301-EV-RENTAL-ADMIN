export interface User {
  _id: string;
  fullname: string;
  email: string;
  role: 'EV Renter' | 'Station Staff' | 'Admin';
  avatar?: string;
  stationId?: string | null;
  kycStatus?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message?: string;
  token: string;
  user: User;
}