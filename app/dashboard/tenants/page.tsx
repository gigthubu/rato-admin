'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Title,
  Text,
  Paper,
  Group,
  Stack,
  Badge,
  Table,
  Button,
  Box,
  TextInput,
  Select,
  Modal,
  Divider,
  ActionIcon,
  Tooltip,
  Switch,
  Tabs,
  Card,
  ThemeIcon,
  SimpleGrid,
  Anchor,
  CopyButton,
  Alert,
} from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconSearch,
  IconEdit,
  IconEye,
  IconFilter,
  IconToggleLeft,
  IconUsers,
  IconFileInvoice,
  IconPackage,
  IconCalculator,
  IconUsersGroup,
  IconChartBar,
  IconUpload,
  IconSettings,
  IconDatabase,
  IconReceipt,
  IconUserCircle,
  IconExternalLink,
  IconCalendar,
  IconKey,
  IconCopy,
  IconCheck,
  IconInfoCircle,
  IconBook,
  IconTool,
} from '@tabler/icons-react';
import { apiGet, apiPost, apiPut } from '@/lib/api';
import type {
  Tenant,
  Feature,
  TenantUser,
  FiscalYear,
  TenantAdminStats,
  AdminInvoice,
  AdminParty,
  TenantRegistrationInfo,
} from '@/lib/types';
import { NepaliDatePicker } from '@/components/shared';
import { FiscalYearsTab } from '@/components/tenant-detail/FiscalYearsTab';
import { LedgerTab } from '@/components/tenant-detail/LedgerTab';
import { MaintenanceTab } from '@/components/tenant-detail/MaintenanceTab';
import dayjs from 'dayjs';

const featureConfig: Record<string, { icon: React.ReactNode; description: string; color: string }> = {
  invoicing: { icon: <IconFileInvoice size={20} />, description: 'Create and manage sales invoices', color: 'blue' },
  inventory: { icon: <IconPackage size={20} />, description: 'Track inventory and stock levels', color: 'orange' },
  accounting: { icon: <IconCalculator size={20} />, description: 'Manage ledger and accounting', color: 'green' },
  payroll: { icon: <IconUsersGroup size={20} />, description: 'Process employee salaries', color: 'violet' },
  reports: { icon: <IconChartBar size={20} />, description: 'Generate business reports', color: 'cyan' },
  bulk_uploads: { icon: <IconUpload size={20} />, description: 'Bulk import from Excel/CSV', color: 'pink' },
};

const featureLabels: Record<string, string> = {
  invoicing: 'Invoicing & Sales',
  inventory: 'Inventory Management',
  accounting: 'Accounting & Ledger',
  payroll: 'Payroll Management',
  reports: 'Reports & Analytics',
  bulk_uploads: 'Bulk Uploads',
};

const INVOICE_STATUS_COLORS: Record<string, string> = {
  PAID: 'green',
  PARTIAL: 'blue',
  PENDING: 'yellow',
  CANCELLED: 'red',
  OVERDUE: 'orange',
};

function formatAmount(amount: number) {
  return `Rs. ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getStatusBadge(status: string) {
  if (status === 'ACTIVE') return <Badge color="green">Active</Badge>;
  if (status === 'SUSPENDED') return <Badge color="red">Suspended</Badge>;
  return <Badge color="gray">{status}</Badge>;
}

function getRoleBadge(role: string) {
  const colors: Record<string, string> = { ADMIN: 'blue', USER: 'gray', SUPER_ADMIN: 'red' };
  return <Badge color={colors[role] || 'gray'} size="xs">{role}</Badge>;
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [filteredTenants, setFilteredTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>('all');

  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const isMobile = useMediaQuery('(max-width: 48em)');
  const [viewModalOpened, { open: openViewModal, close: closeViewModal }] = useDisclosure(false);
  const [activeTab, setActiveTab] = useState<string | null>('info');
  const [isProcessing, setIsProcessing] = useState(false);

  // Tenant detail state
  const [tenantFeatures, setTenantFeatures] = useState<Feature[]>([]);
  const [tenantUsers, setTenantUsers] = useState<TenantUser[]>([]);
  const [tenantStats, setTenantStats] = useState<TenantAdminStats | null>(null);
  const [registrationInfo, setRegistrationInfo] = useState<TenantRegistrationInfo | null>(null);
  const [adminInvoices, setAdminInvoices] = useState<AdminInvoice[]>([]);
  const [adminParties, setAdminParties] = useState<AdminParty[]>([]);
  const [tenantFiscalYears, setTenantFiscalYears] = useState<FiscalYear[]>([]);


  // Edit info form
  const [editInfoOpen, setEditInfoOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPan, setEditPan] = useState('');
  const [editVat, setEditVat] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editStrictVat, setEditStrictVat] = useState(false);
  const [isSavingInfo, setIsSavingInfo] = useState(false);

  // Edit expiry
  const [editExpiryDate, setEditExpiryDate] = useState<Date | null>(null);
  const [isSavingExpiry, setIsSavingExpiry] = useState(false);

  // Reset password modal
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [resettingUserId, setResettingUserId] = useState<number | null>(null);
  const [pwModalOpened, { open: openPwModal, close: closePwModal }] = useDisclosure(false);

  const fetchTenants = useCallback(async () => {
    try {
      const data = await apiGet<Tenant[]>('/tenants');
      setTenants(data);
      setFilteredTenants(data);
    } catch {
      notifications.show({ title: 'Error', message: 'Failed to load tenants', color: 'red' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  useEffect(() => {
    let filtered = tenants;
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((t) => t.name.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q));
    }
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter((t) => t.status === statusFilter);
    }
    setFilteredTenants(filtered);
  }, [search, statusFilter, tenants]);

  const fetchTenantDetails = useCallback(async (tenantId: number) => {
    const [features, users, stats, regInfo, invoices, parties, fiscalYears] = await Promise.allSettled([
      apiGet<Feature[]>(`/tenants/${tenantId}/admin-features`),
      apiGet<TenantUser[]>(`/tenants/${tenantId}/admin-users`),
      apiGet<TenantAdminStats>(`/tenants/${tenantId}/admin-stats`),
      apiGet<TenantRegistrationInfo>(`/tenants/${tenantId}/registration-info`),
      apiGet<AdminInvoice[]>(`/tenants/${tenantId}/admin-invoices`),
      apiGet<AdminParty[]>(`/tenants/${tenantId}/admin-parties`),
      apiGet<FiscalYear[]>(`/tenants/${tenantId}/fiscal-years`),
    ]);

    setTenantFeatures(features.status === 'fulfilled' ? features.value : []);
    setTenantUsers(users.status === 'fulfilled' ? users.value : []);
    setTenantStats(stats.status === 'fulfilled' ? stats.value : null);
    setRegistrationInfo(regInfo.status === 'fulfilled' ? regInfo.value : null);
    setAdminInvoices(invoices.status === 'fulfilled' ? invoices.value : []);
    setAdminParties(parties.status === 'fulfilled' ? parties.value : []);
    setTenantFiscalYears(fiscalYears.status === 'fulfilled' ? fiscalYears.value : []);
  }, []);

  const handleStatusToggle = async (tenant: Tenant) => {
    setIsProcessing(true);
    const newStatus = tenant.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await apiPut(`/tenants/${tenant.id}`, { status: newStatus });
      notifications.show({
        title: 'Success',
        message: `Tenant ${newStatus === 'ACTIVE' ? 'activated' : 'suspended'}`,
        color: 'green',
      });
      fetchTenants();
      if (selectedTenant?.id === tenant.id) {
        setSelectedTenant({ ...selectedTenant, status: newStatus });
      }
    } catch {
      notifications.show({ title: 'Error', message: 'Failed to update tenant status', color: 'red' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFeatureToggle = async (feature: Feature) => {
    try {
      await apiPut(`/features/${feature.id}`, { isEnabled: !feature.isEnabled });
      setTenantFeatures((prev) => prev.map((f) => (f.id === feature.id ? { ...f, isEnabled: !f.isEnabled } : f)));
      notifications.show({
        title: 'Success',
        message: `Feature ${feature.isEnabled ? 'disabled' : 'enabled'}`,
        color: 'green',
      });
    } catch {
      notifications.show({ title: 'Error', message: 'Failed to update feature', color: 'red' });
    }
  };

  const handleOpenEditInfo = () => {
    setEditName(selectedTenant?.name || '');
    setEditPan(selectedTenant?.panNumber || '');
    setEditVat(selectedTenant?.vatNumber || '');
    setEditSlug(selectedTenant?.slug || '');
    setEditStrictVat(Boolean(selectedTenant?.strictVatBilling));
    setEditInfoOpen(true);
  };

  const handleSaveInfo = async () => {
    if (!selectedTenant) return;
    setIsSavingInfo(true);
    try {
      const payload: Record<string, string | boolean> = {};
      if (editName.trim()) payload.name = editName.trim();
      if (editSlug.trim()) payload.slug = editSlug.trim();
      if (editPan.trim()) payload.panNumber = editPan.trim();
      if (editVat.trim()) payload.vatNumber = editVat.trim();
      payload.strictVatBilling = editStrictVat;

      await apiPut(`/tenants/${selectedTenant.id}/admin-info`, payload);
      const updated = {
        ...selectedTenant,
        name: editName.trim() || selectedTenant.name,
        slug: editSlug.trim() || selectedTenant.slug,
        panNumber: editPan.trim() || null,
        vatNumber: editVat.trim() || null,
        strictVatBilling: editStrictVat,
      };
      setSelectedTenant(updated);
      setTenants((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      notifications.show({ title: 'Success', message: 'Tenant info updated', color: 'green' });
      setEditInfoOpen(false);
    } catch {
      notifications.show({ title: 'Error', message: 'Failed to update info', color: 'red' });
    } finally {
      setIsSavingInfo(false);
    }
  };

  const handleSaveExpiry = async () => {
    if (!selectedTenant || !editExpiryDate) return;
    setIsSavingExpiry(true);
    try {
      await apiPut(`/tenants/${selectedTenant.id}/registration-expiry`, {
        expiryDate: editExpiryDate.toISOString(),
      });
      setRegistrationInfo((prev) => (prev ? { ...prev, expiryDate: editExpiryDate.toISOString() } : prev));
      notifications.show({ title: 'Success', message: 'Expiry date updated', color: 'green' });
      setEditExpiryDate(null);
    } catch {
      notifications.show({ title: 'Error', message: 'Failed to update expiry', color: 'red' });
    } finally {
      setIsSavingExpiry(false);
    }
  };

  const handleResetPassword = async (userId: number) => {
    if (!selectedTenant) return;
    setResettingUserId(userId);
    try {
      const result = await apiPost<{ tempPassword: string }>(
        `/tenants/${selectedTenant.id}/users/${userId}/reset-password`,
      );
      setTempPassword(result.tempPassword);
      openPwModal();
    } catch {
      notifications.show({ title: 'Error', message: 'Failed to reset password', color: 'red' });
    } finally {
      setResettingUserId(null);
    }
  };

  const openTenantView = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setActiveTab('info');
    setEditInfoOpen(false);
    setEditExpiryDate(null);
    setTenantFeatures([]);
    setTenantUsers([]);
    setTenantStats(null);
    setRegistrationInfo(null);
    setAdminInvoices([]);
    setAdminParties([]);
    setTenantFiscalYears([]);
    fetchTenantDetails(tenant.id);
    openViewModal();
  };

  const expiryStatus = registrationInfo?.expiryDate
    ? dayjs(registrationInfo.expiryDate).isBefore(dayjs())
      ? 'expired'
      : 'active'
    : 'none';

  return (
    <Box>
      <Group justify="space-between" mb="xl">
        <Stack gap={0}>
          <Title order={2}>Tenants</Title>
          <Text c="dimmed" size="sm">Manage tenant accounts, features, and view their data</Text>
        </Stack>
      </Group>

      <Paper p="md" radius="md" shadow="sm" mb="lg">
        <Group>
          <TextInput
            placeholder="Search by name or slug..."
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1 }}
          />
          <Select
            placeholder="Filter by status"
            leftSection={<IconFilter size={16} />}
            value={statusFilter}
            onChange={setStatusFilter}
            data={[
              { value: 'all', label: 'All Status' },
              { value: 'ACTIVE', label: 'Active' },
              { value: 'SUSPENDED', label: 'Suspended' },
            ]}
            w={180}
          />
        </Group>
      </Paper>

      <Paper radius="md" shadow="sm">
        <Table.ScrollContainer minWidth={700}>
          <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Tenant</Table.Th>
              <Table.Th>Slug</Table.Th>
              <Table.Th>Fiscal Year</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Created</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {isLoading ? (
              <Table.Tr>
                <Table.Td colSpan={6}><Text ta="center" py="xl" c="dimmed">Loading...</Text></Table.Td>
              </Table.Tr>
            ) : filteredTenants.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={6}><Text ta="center" py="xl" c="dimmed">No tenants found</Text></Table.Td>
              </Table.Tr>
            ) : (
              filteredTenants.map((tenant) => (
                <Table.Tr key={tenant.id}>
                  <Table.Td><Text size="sm" fw={500}>{tenant.name}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="dimmed">{tenant.slug}</Text></Table.Td>
                  <Table.Td><Text size="sm">{tenant.fiscalYear}</Text></Table.Td>
                  <Table.Td>{getStatusBadge(tenant.status)}</Table.Td>
                  <Table.Td><Text size="xs" c="dimmed">{dayjs(tenant.createdAt).format('MMM D, YYYY')}</Text></Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Tooltip label="View Details">
                        <ActionIcon variant="subtle" color="blue" onClick={() => openTenantView(tenant)}>
                          <IconEye size={18} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label={tenant.status === 'ACTIVE' ? 'Suspend' : 'Activate'}>
                        <ActionIcon
                          variant="subtle"
                          color={tenant.status === 'ACTIVE' ? 'red' : 'green'}
                          onClick={() => handleStatusToggle(tenant)}
                          loading={isProcessing}
                        >
                          <IconEdit size={18} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Paper>

      {/* Tenant Details Modal */}
      <Modal
        opened={viewModalOpened}
        onClose={closeViewModal}
        title={
          <Group>
            <Title order={4}>{selectedTenant?.name}</Title>
            {selectedTenant && getStatusBadge(selectedTenant.status)}
          </Group>
        }
        size="90%"
        fullScreen={isMobile}
      >
        {selectedTenant && (
          <Tabs value={activeTab} onChange={setActiveTab}>
            {/* Seven tabs never fit a phone — let the strip scroll instead of wrapping. */}
            <Tabs.List mb="md" style={{ flexWrap: 'nowrap', overflowX: 'auto' }}>
              <Tabs.Tab value="info" leftSection={<IconSettings size={16} />}>Information</Tabs.Tab>
              <Tabs.Tab value="features" leftSection={<IconToggleLeft size={16} />}>Features</Tabs.Tab>
              <Tabs.Tab value="data" leftSection={<IconDatabase size={16} />}>Stats</Tabs.Tab>
              <Tabs.Tab value="invoices" leftSection={<IconReceipt size={16} />}>Invoices</Tabs.Tab>
              <Tabs.Tab value="parties" leftSection={<IconUserCircle size={16} />}>Parties</Tabs.Tab>
              <Tabs.Tab value="users" leftSection={<IconUsers size={16} />}>Users</Tabs.Tab>
              <Tabs.Tab value="fiscal" leftSection={<IconCalendar size={16} />}>Fiscal Years</Tabs.Tab>
              <Tabs.Tab value="ledger" leftSection={<IconBook size={16} />}>Ledger</Tabs.Tab>
              <Tabs.Tab value="maintenance" leftSection={<IconTool size={16} />}>Maintenance</Tabs.Tab>
            </Tabs.List>

            {/* Information Tab */}
            <Tabs.Panel value="info">
              <Stack gap="md">
                {/* Basic Info Display */}
                <Paper bg="gray.0" p="md" radius="md">
                  <Group justify="space-between" mb="sm">
                    <Text fw={600}>Basic Information</Text>
                    {!editInfoOpen && (
                      <Button size="xs" variant="light" leftSection={<IconEdit size={14} />} onClick={handleOpenEditInfo}>
                        Edit Info
                      </Button>
                    )}
                  </Group>
                  <SimpleGrid cols={{ base: 1, sm: 2 }}>
                    <Box>
                      <Text size="xs" c="dimmed">Name</Text>
                      <Text size="sm" fw={500}>{selectedTenant.name}</Text>
                    </Box>
                    <Box>
                      <Text size="xs" c="dimmed">Slug</Text>
                      <Text size="sm" fw={500}>{selectedTenant.slug}</Text>
                    </Box>
                    <Box>
                      <Text size="xs" c="dimmed">PAN Number</Text>
                      <Text size="sm" fw={500}>{selectedTenant.panNumber || '—'}</Text>
                    </Box>
                    <Box>
                      <Text size="xs" c="dimmed">VAT Number</Text>
                      <Text size="sm" fw={500}>{selectedTenant.vatNumber || '—'}</Text>
                    </Box>
                    <Box>
                      <Text size="xs" c="dimmed">Fiscal Year</Text>
                      <Text size="sm" fw={500}>{selectedTenant.fiscalYear}</Text>
                    </Box>
                    <Box>
                      <Text size="xs" c="dimmed">Tenant ID</Text>
                      <Text size="sm" fw={500}>#{selectedTenant.id}</Text>
                    </Box>
                    <Box>
                      <Text size="xs" c="dimmed">VAT Billing</Text>
                      <Badge color={selectedTenant.strictVatBilling ? 'green' : 'gray'} size="sm">
                        {selectedTenant.strictVatBilling ? 'VAT registered' : 'Gross (no VAT)'}
                      </Badge>
                    </Box>
                    <Box>
                      <Text size="xs" c="dimmed">Status</Text>
                      {getStatusBadge(selectedTenant.status)}
                    </Box>
                    <Box>
                      <Text size="xs" c="dimmed">Created On</Text>
                      <Text size="sm" fw={500}>{dayjs(selectedTenant.createdAt).format('MMMM D, YYYY')}</Text>
                    </Box>
                  </SimpleGrid>
                </Paper>

                {/* Edit Info Form */}
                {editInfoOpen && (
                  <Card withBorder radius="md" p="md">
                    <Text fw={600} mb="sm">Edit Tenant Info</Text>
                    <SimpleGrid cols={{ base: 1, sm: 2 }}>
                      <TextInput label="Name" value={editName} onChange={(e) => setEditName(e.target.value)} />
                      <TextInput
                        label="Slug"
                        value={editSlug}
                        onChange={(e) => setEditSlug(e.target.value)}
                        description="Lowercase, alphanumeric, hyphens only"
                      />
                      <TextInput label="PAN Number" value={editPan} onChange={(e) => setEditPan(e.target.value)} />
                      <TextInput label="VAT Number" value={editVat} onChange={(e) => setEditVat(e.target.value)} />
                    </SimpleGrid>
                    <Switch
                      mt="md"
                      checked={editStrictVat}
                      onChange={(e) => setEditStrictVat(e.currentTarget.checked)}
                      label="VAT registered (strict VAT billing)"
                      description="On: tax invoice with taxable / non-taxable / VAT breakdown. Off: plain invoice showing a gross total only."
                    />
                    <Group justify="flex-end" mt="md">
                      <Button variant="subtle" onClick={() => setEditInfoOpen(false)}>Cancel</Button>
                      <Button loading={isSavingInfo} onClick={handleSaveInfo}>Save Changes</Button>
                    </Group>
                  </Card>
                )}

                {/* Subscription / Expiry Section */}
                {registrationInfo && (
                  <Paper bg="gray.0" p="md" radius="md">
                    <Text fw={600} mb="sm">Subscription</Text>
                    <SimpleGrid cols={{ base: 1, sm: 2 }}>
                      <Box>
                        <Text size="xs" c="dimmed">Company</Text>
                        <Text size="sm" fw={500}>{registrationInfo.companyName}</Text>
                      </Box>
                      <Box>
                        <Text size="xs" c="dimmed">Registration Status</Text>
                        <Badge color={registrationInfo.status === 'APPROVED' ? 'green' : 'yellow'} size="sm">
                          {registrationInfo.status}
                        </Badge>
                      </Box>
                      <Box>
                        <Text size="xs" c="dimmed">Expiry Date</Text>
                        {registrationInfo.expiryDate ? (
                          <Group gap="xs">
                            <Text size="sm" fw={500}>{dayjs(registrationInfo.expiryDate).format('MMMM D, YYYY')}</Text>
                            <Badge color={expiryStatus === 'expired' ? 'red' : 'green'} size="xs">
                              {expiryStatus === 'expired' ? 'Expired' : 'Active'}
                            </Badge>
                          </Group>
                        ) : (
                          <Text size="sm" c="dimmed">No expiry set</Text>
                        )}
                      </Box>
                      <Box>
                        <Text size="xs" c="dimmed">Approved On</Text>
                        <Text size="sm" fw={500}>
                          {registrationInfo.approvedAt ? dayjs(registrationInfo.approvedAt).format('MMM D, YYYY') : '—'}
                        </Text>
                      </Box>
                    </SimpleGrid>

                    <Divider my="sm" />
                    <Text size="sm" fw={500} mb="xs">Change Expiry Date</Text>
                    <Group align="flex-end">
                      <Box style={{ flex: 1 }}>
                        <NepaliDatePicker
                          label="New Expiry Date"
                          value={editExpiryDate}
                          onChange={setEditExpiryDate}
                          placeholder="Select new expiry date"
                        />
                      </Box>
                      <Button
                        loading={isSavingExpiry}
                        disabled={!editExpiryDate}
                        onClick={handleSaveExpiry}
                      >
                        Update Expiry
                      </Button>
                    </Group>
                  </Paper>
                )}

                {/* Actions */}
                <Group>
                  <Button
                    variant={selectedTenant.status === 'ACTIVE' ? 'outline' : 'filled'}
                    color={selectedTenant.status === 'ACTIVE' ? 'red' : 'green'}
                    onClick={() => handleStatusToggle(selectedTenant)}
                    loading={isProcessing}
                  >
                    {selectedTenant.status === 'ACTIVE' ? 'Suspend Tenant' : 'Activate Tenant'}
                  </Button>
                  <Anchor
                    href={`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/${selectedTenant.slug}`}
                    target="_blank"
                  >
                    <Button variant="light" leftSection={<IconExternalLink size={16} />}>
                      Open Tenant App
                    </Button>
                  </Anchor>
                </Group>
              </Stack>
            </Tabs.Panel>

            {/* Features Tab */}
            <Tabs.Panel value="features">
              <Stack gap="md">
                <Text size="sm" c="dimmed">Enable or disable features for this tenant</Text>
                {tenantFeatures.length === 0 ? (
                  <Text c="dimmed" ta="center" py="lg">No features configured for this tenant</Text>
                ) : (
                  <SimpleGrid cols={{ base: 1, sm: 2 }}>
                    {tenantFeatures.map((feature) => {
                      const config = featureConfig[feature.name] || {
                        icon: <IconSettings size={20} />,
                        description: feature.name,
                        color: 'gray',
                      };
                      return (
                        <Card key={feature.id} padding="md" radius="md" withBorder>
                          <Group justify="space-between" wrap="nowrap">
                            <Group gap="sm" wrap="nowrap">
                              <ThemeIcon size="lg" radius="md" color={config.color} variant={feature.isEnabled ? 'filled' : 'light'}>
                                {config.icon}
                              </ThemeIcon>
                              <Box>
                                <Text size="sm" fw={500}>{featureLabels[feature.name] || feature.name}</Text>
                                <Text size="xs" c="dimmed">{config.description}</Text>
                              </Box>
                            </Group>
                            <Switch
                              checked={feature.isEnabled}
                              onChange={() => handleFeatureToggle(feature)}
                              color="green"
                            />
                          </Group>
                        </Card>
                      );
                    })}
                  </SimpleGrid>
                )}
              </Stack>
            </Tabs.Panel>

            {/* Stats Tab */}
            <Tabs.Panel value="data">
              <Stack gap="md">
                <Text size="sm" c="dimmed">Overview of tenant&apos;s business data</Text>
                <SimpleGrid cols={{ base: 1, sm: 3 }}>
                  <Card padding="lg" radius="md" withBorder>
                    <Group>
                      <ThemeIcon size="xl" radius="md" color="blue" variant="light">
                        <IconReceipt size={24} />
                      </ThemeIcon>
                      <Box>
                        <Text size="xl" fw={700}>{tenantStats?.invoiceCount ?? '—'}</Text>
                        <Text size="sm" c="dimmed">Sales Invoices</Text>
                      </Box>
                    </Group>
                  </Card>
                  <Card padding="lg" radius="md" withBorder>
                    <Group>
                      <ThemeIcon size="xl" radius="md" color="orange" variant="light">
                        <IconFileInvoice size={24} />
                      </ThemeIcon>
                      <Box>
                        <Text size="xl" fw={700}>{tenantStats?.purchaseCount ?? '—'}</Text>
                        <Text size="sm" c="dimmed">Purchases</Text>
                      </Box>
                    </Group>
                  </Card>
                  <Card padding="lg" radius="md" withBorder>
                    <Group>
                      <ThemeIcon size="xl" radius="md" color="green" variant="light">
                        <IconUserCircle size={24} />
                      </ThemeIcon>
                      <Box>
                        <Text size="xl" fw={700}>{tenantStats?.partyCount ?? '—'}</Text>
                        <Text size="sm" c="dimmed">Parties</Text>
                      </Box>
                    </Group>
                  </Card>
                  <Card padding="lg" radius="md" withBorder>
                    <Group>
                      <ThemeIcon size="xl" radius="md" color="violet" variant="light">
                        <IconPackage size={24} />
                      </ThemeIcon>
                      <Box>
                        <Text size="xl" fw={700}>{tenantStats?.itemCount ?? '—'}</Text>
                        <Text size="sm" c="dimmed">Inventory Items</Text>
                      </Box>
                    </Group>
                  </Card>
                  <Card padding="lg" radius="md" withBorder>
                    <Group>
                      <ThemeIcon size="xl" radius="md" color="teal" variant="light">
                        <IconCalculator size={24} />
                      </ThemeIcon>
                      <Box>
                        <Text size="md" fw={700}>
                          {tenantStats ? formatAmount(tenantStats.totalPaymentsReceived) : '—'}
                        </Text>
                        <Text size="sm" c="dimmed">Payments Received</Text>
                      </Box>
                    </Group>
                  </Card>
                  <Card padding="lg" radius="md" withBorder>
                    <Group>
                      <ThemeIcon size="xl" radius="md" color="red" variant="light">
                        <IconChartBar size={24} />
                      </ThemeIcon>
                      <Box>
                        <Text size="md" fw={700}>
                          {tenantStats ? formatAmount(tenantStats.totalExpenses) : '—'}
                        </Text>
                        <Text size="sm" c="dimmed">Total Expenses</Text>
                      </Box>
                    </Group>
                  </Card>
                </SimpleGrid>
              </Stack>
            </Tabs.Panel>

            {/* Invoices Tab */}
            <Tabs.Panel value="invoices">
              <Stack gap="md">
                <Text size="sm" c="dimmed">Recent 20 invoices for this tenant</Text>
                {adminInvoices.length === 0 ? (
                  <Text c="dimmed" ta="center" py="lg">No invoices found</Text>
                ) : (
                  <Table.ScrollContainer minWidth={700}>
                    <Table striped>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Invoice #</Table.Th>
                        <Table.Th>Party</Table.Th>
                        <Table.Th>Date</Table.Th>
                        <Table.Th>Total</Table.Th>
                        <Table.Th>Paid</Table.Th>
                        <Table.Th>Status</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {adminInvoices.map((inv) => (
                        <Table.Tr key={inv.id}>
                          <Table.Td>
                            <Text size="sm" fw={500}>{inv.number}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">{inv.party?.name || '—'}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">{inv.invoiceDateBs || dayjs(inv.invoiceDate).format('MMM D, YYYY')}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">{formatAmount(inv.totalAmount)}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">{formatAmount(inv.paidAmount)}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Badge color={INVOICE_STATUS_COLORS[inv.status] || 'gray'} size="xs">
                              {inv.status}
                            </Badge>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                    </Table>
                  </Table.ScrollContainer>
                )}
              </Stack>
            </Tabs.Panel>

            {/* Parties Tab */}
            <Tabs.Panel value="parties">
              <Stack gap="md">
                <Text size="sm" c="dimmed">Recent parties for this tenant</Text>
                {adminParties.length === 0 ? (
                  <Text c="dimmed" ta="center" py="lg">No parties found</Text>
                ) : (
                  <Table.ScrollContainer minWidth={700}>
                    <Table striped>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Name</Table.Th>
                        <Table.Th>Type</Table.Th>
                        <Table.Th>PAN</Table.Th>
                        <Table.Th>Balance</Table.Th>
                        <Table.Th>Added</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {adminParties.map((party) => (
                        <Table.Tr key={party.id}>
                          <Table.Td>
                            <Text size="sm" fw={500}>{party.name}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Badge color={party.type === 'CUSTOMER' ? 'blue' : 'orange'} size="xs">
                              {party.type}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm" c="dimmed">{party.panNumber || '—'}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm" c={party.balance < 0 ? 'red' : undefined}>
                              {formatAmount(party.balance)}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="xs" c="dimmed">{dayjs(party.createdAt).format('MMM D, YYYY')}</Text>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                    </Table>
                  </Table.ScrollContainer>
                )}
              </Stack>
            </Tabs.Panel>

            {/* Users Tab */}
            <Tabs.Panel value="users">
              <Stack gap="md">
                <Text size="sm" c="dimmed">Users registered under this tenant</Text>
                {tenantUsers.length === 0 ? (
                  <Text c="dimmed" ta="center" py="lg">No users found for this tenant</Text>
                ) : (
                  <Table.ScrollContainer minWidth={700}>
                    <Table striped>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Name</Table.Th>
                        <Table.Th>Email</Table.Th>
                        <Table.Th>Role</Table.Th>
                        <Table.Th>Joined</Table.Th>
                        <Table.Th>Actions</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {tenantUsers.map((user) => (
                        <Table.Tr key={user.id}>
                          <Table.Td><Text size="sm" fw={500}>{user.name}</Text></Table.Td>
                          <Table.Td><Text size="sm" c="dimmed">{user.email}</Text></Table.Td>
                          <Table.Td>{getRoleBadge(user.role)}</Table.Td>
                          <Table.Td>
                            <Text size="xs" c="dimmed">{dayjs(user.createdAt).format('MMM D, YYYY')}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Tooltip label="Reset Password">
                              <ActionIcon
                                variant="subtle"
                                color="orange"
                                loading={resettingUserId === user.id}
                                onClick={() => handleResetPassword(user.id)}
                              >
                                <IconKey size={16} />
                              </ActionIcon>
                            </Tooltip>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                    </Table>
                  </Table.ScrollContainer>
                )}
              </Stack>
            </Tabs.Panel>

            {/* Fiscal Years Tab */}
            <Tabs.Panel value="fiscal">
              <FiscalYearsTab
                tenantId={selectedTenant.id}
                fiscalYears={tenantFiscalYears}
                onChange={setTenantFiscalYears}
                onCurrentYearChange={(name) => {
                  setSelectedTenant({ ...selectedTenant, fiscalYear: name });
                  fetchTenants();
                }}
              />
            </Tabs.Panel>

            {/* Ledger Tab */}
            <Tabs.Panel value="ledger">
              <LedgerTab tenant={selectedTenant} parties={adminParties} />
            </Tabs.Panel>

            {/* Maintenance Tab */}
            <Tabs.Panel value="maintenance">
              <MaintenanceTab tenantId={selectedTenant.id} />
            </Tabs.Panel>
          </Tabs>
        )}
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        opened={pwModalOpened}
        onClose={() => { closePwModal(); setTempPassword(null); }}
        title="Password Reset"
        size="sm"
      >
        <Stack gap="md">
          <Alert icon={<IconInfoCircle size={16} />} color="orange">
            Share this temporary password with the user. They should change it after logging in.
          </Alert>
          <Box>
            <Text size="xs" c="dimmed" mb={4}>Temporary Password</Text>
            <Group gap="xs">
              <TextInput value={tempPassword || ''} readOnly style={{ flex: 1 }} />
              <CopyButton value={tempPassword || ''} timeout={2000}>
                {({ copied, copy }) => (
                  <Tooltip label={copied ? 'Copied!' : 'Copy'}>
                    <ActionIcon color={copied ? 'teal' : 'blue'} variant="light" onClick={copy} size="lg">
                      {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                    </ActionIcon>
                  </Tooltip>
                )}
              </CopyButton>
            </Group>
          </Box>
          <Button fullWidth onClick={() => { closePwModal(); setTempPassword(null); }}>Done</Button>
        </Stack>
      </Modal>
    </Box>
  );
}
