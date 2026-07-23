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
  strictVatBilling: boolean;
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

// Accounting integrity check (GET /maintenance/tenants/:id/integrity)
export interface AccountingHealth {
  isClean: boolean;
  checkedAt: string;
  trialBalance: {
    totalDebit: number;
    totalCredit: number;
    difference: number;
    balanced: boolean;
  };
  unbalancedEntries: Array<{
    journalEntryId: number;
    voucherNumber: string;
    totalDebit: number;
    totalCredit: number;
    difference: number;
  }>;
  partyBalanceDrift: Array<{
    partyId: number;
    partyName: string;
    storedBalance: number;
    ledgerBalance: number;
    difference: number;
  }>;
  accountBalanceDrift: Array<{
    accountId: number;
    code: string;
    name: string;
    storedBalance: number;
    ledgerBalance: number;
    difference: number;
  }>;
  accountsWithoutSubType: Array<{ id: number; code: string; name: string; type: string }>;
  unstampedLineCount: number;
}

// Maintenance scripts (GET /maintenance/scripts)
export interface MaintenanceScript {
  key: string;
  label: string;
  description: string;
  mutating: boolean;
  supportsDryRun: boolean;
}

export interface ScriptRunResult {
  script: string;
  label: string;
  tenantId: number;
  dryRun: boolean;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  report: unknown;
}

// Journal entries (GET /accounting/journals, read as tenant)
export interface JournalLine {
  id: number;
  debit: number;
  credit: number;
  description: string | null;
  account: { id: number; name: string; code: string; type: string } | null;
}

export interface JournalEntryRow {
  id: number;
  voucherNumber: string;
  voucherType: string;
  date: string;
  narration: string | null;
  memo: string | null;
  reference: string | null;
  isReversed: boolean;
  lines: JournalLine[];
  fiscalYear: { id: number; name: string } | null;
}

export interface Paginated<T> {
  items: T[];
  pagination: { page: number; limit: number; totalCount: number; totalPages: number };
}

// Party ledger (GET /accounting/parties/:partyId/statement, read as tenant)
export interface PartyStatementRow {
  journalEntryId: number;
  lineId: number;
  date: string;
  voucherNumber: string;
  voucherType: string;
  accountCode: string;
  accountName: string;
  description: string | null;
  debit: number;
  credit: number;
  balance: number;
}

export interface PartyStatement {
  party: {
    id: number;
    name: string;
    type: string;
    code: string | null;
    panNumber: string | null;
    creditDays: number | null;
  };
  fromDate: string | null;
  toDate: string;
  openingBalance: number;
  rows: PartyStatementRow[];
  totalDebit: number;
  totalCredit: number;
  closingBalance: number;
}
