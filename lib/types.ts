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
  panNumber: string | null;
  vatNumber: string | null;
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
}

export interface FiscalYear {
  id: number;
  tenantId: number;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  isClosed: boolean;
  createdAt: string;
}

// User Types
export interface TenantUser {
  id: number;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'USER';
  createdAt: string;
}

// Feature Types
export interface Feature {
  id: number;
  name: string;
  isEnabled: boolean;
  tenantId: number;
}

// Admin Stats
export interface TenantAdminStats {
  invoiceCount: number;
  purchaseCount: number;
  partyCount: number;
  itemCount: number;
  totalPaymentsReceived: number;
  totalExpenses: number;
}

// Admin Invoice (lightweight for listing)
export interface AdminInvoice {
  id: number;
  number: string;
  invoiceDate: string;
  invoiceDateBs: string | null;
  totalAmount: number;
  paidAmount: number;
  status: string;
  party: { name: string } | null;
}

// Admin Party (lightweight for listing)
export interface AdminParty {
  id: number;
  name: string;
  type: string;
  panNumber: string | null;
  balance: number;
  createdAt: string;
}

// Registration info for a tenant (from linked registration)
export interface TenantRegistrationInfo {
  id: number;
  email: string;
  name: string;
  companyName: string;
  expiryDate: string | null;
  status: string;
  approvedAt: string | null;
  createdAt: string;
}

// Stats Types (dashboard)
export interface AdminStats {
  totalTenants: number;
  activeTenants: number;
  suspendedTenants: number;
  pendingRegistrations: number;
  totalUsers: number;
  recentRegistrations: Registration[];
}

// Legacy alias kept for dashboard page compatibility
export type User = TenantUser;
