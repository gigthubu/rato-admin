// Auth Types
export interface AuthUser {
  id: number;
  tenantId: number;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'USER';
  email: string;
  name: string;
  tenantSlug: string;
}

// Registration Types
export interface Registration {
  id: number;
  email: string;
  name: string;
  phone: string;
  companyName: string;
  businessType: string;
  address: string;
  city: string;
  panNumber: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  otpVerified: boolean;
  tenantId: number | null;
  expiryDate: string | null;
  createdAt: string;
  approvedAt: string | null;
}

// Tenant Types
export interface Tenant {
  id: number;
  name: string;
  slug: string;
  fiscalYear: string;
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
}

export interface TenantWithDetails extends Tenant {
  users: User[];
  features: Feature[];
  _count?: {
    users: number;
    invoices: number;
    parties: number;
  };
}

// User Types
export interface User {
  id: number;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'USER';
  tenantId: number;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

// Feature Types
export interface Feature {
  id: number;
  name: string;
  isEnabled: boolean;
  tenantId: number;
}

// Stats Types
export interface AdminStats {
  totalTenants: number;
  activeTenants: number;
  suspendedTenants: number;
  pendingRegistrations: number;
  totalUsers: number;
  recentRegistrations: Registration[];
}
