// API Configuration and Endpoints
export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://wdp301-ev-rental-backend.onrender.com',
  timeout: 30000,
  endpoints: {
    auth: {
      login: '/api/auth/Login',
      logout: '/api/auth/Logout',
      refresh: '/api/auth/Refresh',
      profile: '/api/auth/Profile'
    },
    users: {
      list: '/api/users',
      create: '/api/users',
      update: (id: string) => `/api/users/${id}`,
      delete: (id: string) => `/api/users/${id}`,
      getById: (id: string) => `/api/users/${id}`
    },
    vehicles: {
      list: '/api/vehicles',
      create: '/api/vehicles',
      update: (id: string) => `/api/vehicles/${id}`,
      delete: (id: string) => `/api/vehicles/${id}`,
      getById: (id: string) => `/api/vehicles/${id}`
    },
    stations: {
      list: '/api/stations',
      create: '/api/stations',
      update: (id: string) => `/api/stations/${id}`,
      delete: (id: string) => `/api/stations/${id}`,
      getById: (id: string) => `/api/stations/${id}`
    },
    rentals: {
      list: '/api/rentals',
      create: '/api/rentals',
      update: (id: string) => `/api/rentals/${id}`,
      delete: (id: string) => `/api/rentals/${id}`,
      getById: (id: string) => `/api/rentals/${id}`
    },
    assignment: {
      unassignedStaff: '/api/users/staff/unassigned',
      assignStaff: '/api/users/staff/assign'
    }
  }
};

export default API_CONFIG;

