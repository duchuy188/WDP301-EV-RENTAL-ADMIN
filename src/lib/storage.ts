// Mock data storage utilities
export interface Vehicle {
  id: string;
  model: string;
  battery: number;
  status: 'available' | 'rented' | 'maintenance';
  location: string;
  lastRent?: string;
}

export interface Station {
  id: string;
  name: string;
  address: string;
  availableVehicles: number;
  rentedVehicles: number;
  maintenanceVehicles: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  license: string;
  riskLevel: 'normal' | 'risky';
  totalRentals: number;
  joinDate: string;
}

export interface Staff {
  id: string;
  name: string;
  station: string;
  deliveries: number;
  rating: number;
  status: 'active' | 'inactive';
}

export interface RentalData {
  date: string;
  rentals: number;
  revenue: number;
}

const STORAGE_KEYS = {
  VEHICLES: 'ev-rental-vehicles',
  STATIONS: 'ev-rental-stations',
  CUSTOMERS: 'ev-rental-customers',
  STAFF: 'ev-rental-staff',
  RENTALS: 'ev-rental-data',
  AUTH: 'ev-rental-auth'
};

// Initialize mock data
const initializeData = () => {
  if (!localStorage.getItem(STORAGE_KEYS.VEHICLES)) {
    const mockVehicles: Vehicle[] = [
      { id: '1', model: 'Tesla Model 3', battery: 85, status: 'available', location: 'Station A' },
      { id: '2', model: 'Nissan Leaf', battery: 72, status: 'rented', location: 'Station B', lastRent: '2025-01-15' },
      { id: '3', model: 'BMW i3', battery: 45, status: 'maintenance', location: 'Station A' },
      { id: '4', model: 'VinFast VF8', battery: 90, status: 'available', location: 'Station C' },
      { id: '5', model: 'Hyundai Kona', battery: 78, status: 'rented', location: 'Station B', lastRent: '2025-01-14' },
    ];
    localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(mockVehicles));
  }

  if (!localStorage.getItem(STORAGE_KEYS.STATIONS)) {
    const mockStations: Station[] = [
      { id: '1', name: 'Station A - Quận 1', address: 'Đường Lê Lợi, Quận 1, TP.HCM', availableVehicles: 5, rentedVehicles: 3, maintenanceVehicles: 1 },
      { id: '2', name: 'Station B - Quận 3', address: 'Đường Nam Kỳ Khởi Nghĩa, Quận 3, TP.HCM', availableVehicles: 8, rentedVehicles: 5, maintenanceVehicles: 2 },
      { id: '3', name: 'Station C - Quận 7', address: 'Đường Nguyễn Thị Thập, Quận 7, TP.HCM', availableVehicles: 6, rentedVehicles: 2, maintenanceVehicles: 0 },
    ];
    localStorage.setItem(STORAGE_KEYS.STATIONS, JSON.stringify(mockStations));
  }

  if (!localStorage.getItem(STORAGE_KEYS.CUSTOMERS)) {
    const mockCustomers: Customer[] = [
      { id: '1', name: 'Nguyễn Văn An', email: 'an@email.com', license: 'B123456789', riskLevel: 'normal', totalRentals: 15, joinDate: '2024-06-15' },
      { id: '2', name: 'Trần Thị Bình', email: 'binh@email.com', license: 'B987654321', riskLevel: 'risky', totalRentals: 3, joinDate: '2024-12-01' },
      { id: '3', name: 'Lê Hoàng Cường', email: 'cuong@email.com', license: 'B555666777', riskLevel: 'normal', totalRentals: 8, joinDate: '2024-08-20' },
    ];
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(mockCustomers));
  }

  if (!localStorage.getItem(STORAGE_KEYS.STAFF)) {
    const mockStaff: Staff[] = [
      { id: '1', name: 'Phạm Minh Đức', station: 'Station A - Quận 1', deliveries: 45, rating: 4.8, status: 'active' },
      { id: '2', name: 'Võ Thị Hoa', station: 'Station B - Quận 3', deliveries: 62, rating: 4.9, status: 'active' },
      { id: '3', name: 'Ngô Thanh Long', station: 'Station C - Quận 7', deliveries: 38, rating: 4.5, status: 'inactive' },
    ];
    localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(mockStaff));
  }

  if (!localStorage.getItem(STORAGE_KEYS.RENTALS)) {
    const mockRentals: RentalData[] = [
      { date: '2025-01-08', rentals: 45, revenue: 2250000 },
      { date: '2025-01-09', rentals: 52, revenue: 2600000 },
      { date: '2025-01-10', rentals: 38, revenue: 1900000 },
      { date: '2025-01-11', rentals: 61, revenue: 3050000 },
      { date: '2025-01-12', rentals: 48, revenue: 2400000 },
      { date: '2025-01-13', rentals: 55, revenue: 2750000 },
      { date: '2025-01-14', rentals: 67, revenue: 3350000 },
    ];
    localStorage.setItem(STORAGE_KEYS.RENTALS, JSON.stringify(mockRentals));
  }
};

export const storage = {
  getVehicles: (): Vehicle[] => {
    initializeData();
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.VEHICLES) || '[]');
  },
  
  getStations: (): Station[] => {
    initializeData();
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.STATIONS) || '[]');
  },
  
  getCustomers: (): Customer[] => {
    initializeData();
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOMERS) || '[]');
  },
  
  getStaff: (): Staff[] => {
    initializeData();
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.STAFF) || '[]');
  },
  
  getRentals: (): RentalData[] => {
    initializeData();
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.RENTALS) || '[]');
  },
  
  setAuth: (isAuthenticated: boolean) => {
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(isAuthenticated));
  },
  
  getAuth: (): boolean => {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.AUTH) || 'false');
  }
};