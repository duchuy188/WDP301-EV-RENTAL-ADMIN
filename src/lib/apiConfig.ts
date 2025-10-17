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
      // Admin vehicle endpoints
      list: '/api/vehicles/admin',
      create: '/api/vehicles',
      getById: (id: string) => `/api/vehicles/${id}`,
      statistics: '/api/vehicles/statistics',
      bulkCreate: '/api/vehicles/bulk-create',
      importLicensePlates: '/api/vehicles/import-license-plates',
      assignByQuantity: '/api/vehicles/assign-by-quantity',
      exportPricingTemplate: '/api/vehicles/export-pricing-template',
      importPricingUpdates: '/api/vehicles/import-pricing-updates',
      update: (id: string) => `/api/vehicles/${id}`,
      delete: (id: string) => `/api/vehicles/${id}`,
      updateStatus: (id: string) => `/api/vehicles/${id}/status`,
      updateBattery: (id: string) => `/api/vehicles/${id}/battery`
    },
    stations: {
      list: '/api/stations',
      create: '/api/stations',
      getById: (id: string) => `/api/stations/${id}`,
      update: (id: string) => `/api/stations/${id}`,
      delete: (id: string) => `/api/stations/${id}`,
      sync: (id: string) => `/api/stations/${id}/sync`,
      syncAll: '/api/stations/sync-all',
      getStaff: (id: string) => `/api/stations/${id}/staff`
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

