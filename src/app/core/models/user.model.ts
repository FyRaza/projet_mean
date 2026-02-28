export type UserRole = 'admin' | 'boutique' | 'acheteur';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminUser extends User {
  role: 'admin';
  permissions: string[];
}

export interface BoutiqueUser extends User {
  role: 'boutique';
  boutiqueId: string;
}

export interface AcheteurUser extends User {
  role: 'acheteur';
  addresses: Address[];
  defaultAddressId?: string;
}

export interface Address {
  id: string;
  label: string;
  fullName?: string;
  phone?: string;
  street: string;
  landmark?: string;
  city: string;
  postalCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}
