'use client';

import { useEffect, useState } from 'react';
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
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
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
} from '@tabler/icons-react';
import { apiGet, apiPost, apiPut } from '@/lib/api';
import type { Tenant, Feature, User, FiscalYear } from '@/lib/types';
import { NepaliDatePicker } from '@/components/shared';
import dayjs from 'dayjs';

interface TenantWithRelations extends Tenant {
  users?: User[];
  features?: Feature[];
  _count?: {
    users: number;
    invoices: number;
    parties: number;
    items: number;
  };
}

interface TenantStats {
  usersCount: number;
  invoicesCount: number;
  partiesCount: number;
  itemsCount: number;
}

const featureConfig: Record<string, { icon: React.ReactNode; description: string; color: string }> = {
  invoicing: {
    icon: <IconFileInvoice size={20} />,
    description: 'Create and manage sales invoices',
    color: 'blue',
  },
  inventory: {
    icon: <IconPackage size={20} />,
    description: 'Track inventory and stock levels',
    color: 'orange',
  },
  accounting: {
    icon: <IconCalculator size={20} />,
    description: 'Manage ledger and accounting',
    color: 'green',
  },
  payroll: {
    icon: <IconUsersGroup size={20} />,
    description: 'Process employee salaries',
    color: 'violet',
  },
  reports: {
    icon: <IconChartBar size={20} />,
    description: 'Generate business reports',
    color: 'cyan',
  },
  bulk_uploads: {
    icon: <IconUpload size={20} />,
    description: 'Bulk import from Excel/CSV',
    color: 'pink',
  },
};

const featureLabels: Record<string, string> = {
  invoicing: 'Invoicing & Sales',
  inventory: 'Inventory Management',
  accounting: 'Accounting & Ledger',
  payroll: 'Payroll Management',
  reports: 'Reports & Analytics',
  bulk_uploads: 'Bulk Uploads',
};

export default function TenantsPage() {
  const [tenants, setTenants] = useState<TenantWithRelations[]>([]);
  const [filteredTenants, setFilteredTenants] = useState<TenantWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>('all');
  const [selectedTenant, setSelectedTenant] = useState<TenantWithRelations | null>(null);
  const [tenantFeatures, setTenantFeatures] = useState<Feature[]>([]);
  const [tenantUsers, setTenantUsers] = useState<User[]>([]);
  const [tenantStats, setTenantStats] = useState<TenantStats | null>(null);
  const [tenantFiscalYears, setTenantFiscalYears] = useState<FiscalYear[]>([]);
  const [fyStartDate, setFyStartDate] = useState<Date | null>(null);
  const [fyEndDate, setFyEndDate] = useState<Date | null>(null);
  const [fyIsCurrent, setFyIsCurrent] = useState(true);
  const [isCreatingFy, setIsCreatingFy] = useState(false);
  const [viewModalOpened, { open: openViewModal, close: closeViewModal }] = useDisclosure(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>('info');

  const fetchTenants = async () => {
    try {
      const data = await apiGet<TenantWithRelations[]>('/tenants');
      setTenants(data);
      setFilteredTenants(data);
    } catch (error) {
      console.error('Failed to fetch tenants:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to load tenants',
        color: 'red',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  useEffect(() => {
    let filtered = tenants;

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(searchLower) ||
          t.slug.toLowerCase().includes(searchLower)
      );
    }

    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter((t) => t.status === statusFilter);
    }

    setFilteredTenants(filtered);
  }, [search, statusFilter, tenants]);

  const handleStatusToggle = async (tenant: TenantWithRelations) => {
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
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to update tenant status',
        color: 'red',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const fetchTenantDetails = async (tenantId: number) => {
    // Fetch features
    try {
      const features = await apiGet<Feature[]>(`/admin/tenants/${tenantId}/features`);
      setTenantFeatures(features);
    } catch {
      setTenantFeatures([]);
    }

    // Fetch users
    try {
      const users = await apiGet<User[]>(`/admin/tenants/${tenantId}/users`);
      setTenantUsers(users);
    } catch {
      setTenantUsers([]);
    }

    // Fetch stats
    try {
      const stats = await apiGet<TenantStats>(`/admin/tenants/${tenantId}/stats`);
      setTenantStats(stats);
    } catch {
      setTenantStats(null);
    }

    try {
      const fiscalYears = await apiGet<FiscalYear[]>(`/tenants/${tenantId}/fiscal-years`);
      setTenantFiscalYears(fiscalYears);
    } catch {
      setTenantFiscalYears([]);
    }
  };

  const handleFeatureToggle = async (feature: Feature) => {
    try {
      await apiPut(`/features/${feature.id}`, { isEnabled: !feature.isEnabled });
      setTenantFeatures((prev) =>
        prev.map((f) =>
          f.id === feature.id ? { ...f, isEnabled: !f.isEnabled } : f
        )
      );
      notifications.show({
        title: 'Success',
        message: `Feature ${feature.isEnabled ? 'disabled' : 'enabled'}`,
        color: 'green',
      });
    } catch {
      notifications.show({
        title: 'Error',
        message: 'Failed to update feature',
        color: 'red',
      });
    }
  };

  const openTenantView = (tenant: TenantWithRelations) => {
    setSelectedTenant(tenant);
    setActiveTab('info');
    fetchTenantDetails(tenant.id);
    openViewModal();
  };

  const handleCreateFiscalYear = async () => {
    if (!selectedTenant) return;
    if (!fyStartDate || !fyEndDate) {
      notifications.show({
        color: 'red',
        title: 'Missing dates',
        message: 'Please select both start and end dates.',
      });
      return;
    }

    setIsCreatingFy(true);
    try {
      const payload = {
        startDate: fyStartDate.toISOString(),
        endDate: fyEndDate.toISOString(),
        isCurrent: fyIsCurrent,
      };
      const created = await apiPost<FiscalYear>(`/tenants/${selectedTenant.id}/fiscal-years`, payload);
      notifications.show({
        color: 'green',
        title: 'Fiscal year created',
        message: `Fiscal year ${created.name} added.`,
      });

      const fiscalYears = await apiGet<FiscalYear[]>(`/tenants/${selectedTenant.id}/fiscal-years`);
      setTenantFiscalYears(fiscalYears);

      if (created.isCurrent) {
        setSelectedTenant({ ...selectedTenant, fiscalYear: created.name });
        fetchTenants();
      }

      setFyStartDate(null);
      setFyEndDate(null);
      setFyIsCurrent(true);
    } catch (error: any) {
      notifications.show({
        color: 'red',
        title: 'Failed to create fiscal year',
        message: error?.message || 'Unable to create fiscal year.',
      });
    } finally {
      setIsCreatingFy(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge color="green">Active</Badge>;
      case 'SUSPENDED':
        return <Badge color="red">Suspended</Badge>;
      default:
        return <Badge color="gray">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Badge color="blue" size="xs">Admin</Badge>;
      case 'USER':
        return <Badge color="gray" size="xs">User</Badge>;
      default:
        return <Badge color="gray" size="xs">{role}</Badge>;
    }
  };

  return (
    <Box>
      <Group justify="space-between" mb="xl">
        <Stack gap={0}>
          <Title order={2}>Tenants</Title>
          <Text c="dimmed" size="sm">
            Manage tenant accounts, features, and view their data
          </Text>
        </Stack>
      </Group>

      {/* Filters */}
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

      {/* Table */}
      <Paper radius="md" shadow="sm">
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
                <Table.Td colSpan={6}>
                  <Text ta="center" py="xl" c="dimmed">
                    Loading...
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : filteredTenants.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={6}>
                  <Text ta="center" py="xl" c="dimmed">
                    No tenants found
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              filteredTenants.map((tenant) => (
                <Table.Tr key={tenant.id}>
                  <Table.Td>
                    <Text size="sm" fw={500}>
                      {tenant.name}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed">
                      {tenant.slug}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{tenant.fiscalYear}</Text>
                  </Table.Td>
                  <Table.Td>{getStatusBadge(tenant.status)}</Table.Td>
                  <Table.Td>
                    <Text size="xs" c="dimmed">
                      {dayjs(tenant.createdAt).format('MMM D, YYYY')}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Tooltip label="View Details">
                        <ActionIcon
                          variant="subtle"
                          color="blue"
                          onClick={() => openTenantView(tenant)}
                        >
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
        size="xl"
      >
        {selectedTenant && (
          <Tabs value={activeTab} onChange={setActiveTab}>
            <Tabs.List mb="md">
              <Tabs.Tab value="info" leftSection={<IconSettings size={16} />}>
                Information
              </Tabs.Tab>
              <Tabs.Tab value="features" leftSection={<IconToggleLeft size={16} />}>
                Features
              </Tabs.Tab>
              <Tabs.Tab value="data" leftSection={<IconDatabase size={16} />}>
                Data Overview
              </Tabs.Tab>
              <Tabs.Tab value="users" leftSection={<IconUsers size={16} />}>
                Users
              </Tabs.Tab>
              <Tabs.Tab value="fiscal" leftSection={<IconCalendar size={16} />}>
                Fiscal Years
              </Tabs.Tab>
            </Tabs.List>

            {/* Information Tab */}
            <Tabs.Panel value="info">
              <Stack gap="md">
                <Paper bg="gray.0" p="md" radius="md">
                  <Text fw={600} mb="sm">
                    Basic Information
                  </Text>
                  <SimpleGrid cols={2}>
                    <Box>
                      <Text size="xs" c="dimmed">
                        Name
                      </Text>
                      <Text size="sm" fw={500}>
                        {selectedTenant.name}
                      </Text>
                    </Box>
                    <Box>
                      <Text size="xs" c="dimmed">
                        Slug
                      </Text>
                      <Text size="sm" fw={500}>
                        {selectedTenant.slug}
                      </Text>
                    </Box>
                    <Box>
                      <Text size="xs" c="dimmed">
                        Fiscal Year
                      </Text>
                      <Text size="sm" fw={500}>
                        {selectedTenant.fiscalYear}
                      </Text>
                    </Box>
                    <Box>
                      <Text size="xs" c="dimmed">
                        Status
                      </Text>
                      {getStatusBadge(selectedTenant.status)}
                    </Box>
                    <Box>
                      <Text size="xs" c="dimmed">
                        Created On
                      </Text>
                      <Text size="sm" fw={500}>
                        {dayjs(selectedTenant.createdAt).format('MMMM D, YYYY h:mm A')}
                      </Text>
                    </Box>
                    <Box>
                      <Text size="xs" c="dimmed">
                        Tenant ID
                      </Text>
                      <Text size="sm" fw={500}>
                        {selectedTenant.id}
                      </Text>
                    </Box>
                  </SimpleGrid>
                </Paper>

                <Group>
                  <Button
                    variant={selectedTenant.status === 'ACTIVE' ? 'outline' : 'filled'}
                    color={selectedTenant.status === 'ACTIVE' ? 'red' : 'green'}
                    onClick={() => handleStatusToggle(selectedTenant)}
                    loading={isProcessing}
                  >
                    {selectedTenant.status === 'ACTIVE' ? 'Suspend Tenant' : 'Activate Tenant'}
                  </Button>
                </Group>
              </Stack>
            </Tabs.Panel>

            {/* Features Tab */}
            <Tabs.Panel value="features">
              <Stack gap="md">
                <Text size="sm" c="dimmed">
                  Enable or disable features for this tenant
                </Text>

                {tenantFeatures.length === 0 ? (
                  <Text c="dimmed" ta="center" py="lg">
                    No features configured for this tenant
                  </Text>
                ) : (
                  <SimpleGrid cols={2}>
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
                              <ThemeIcon
                                size="lg"
                                radius="md"
                                color={config.color}
                                variant={feature.isEnabled ? 'filled' : 'light'}
                              >
                                {config.icon}
                              </ThemeIcon>
                              <Box>
                                <Text size="sm" fw={500}>
                                  {featureLabels[feature.name] || feature.name}
                                </Text>
                                <Text size="xs" c="dimmed">
                                  {config.description}
                                </Text>
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

            {/* Data Overview Tab */}
            <Tabs.Panel value="data">
              <Stack gap="md">
                <Text size="sm" c="dimmed">
                  Overview of tenant&apos;s business data
                </Text>

                <SimpleGrid cols={2}>
                  <Card padding="lg" radius="md" withBorder>
                    <Group>
                      <ThemeIcon size="xl" radius="md" color="blue" variant="light">
                        <IconReceipt size={24} />
                      </ThemeIcon>
                      <Box>
                        <Text size="xl" fw={700}>
                          {tenantStats?.invoicesCount ?? '-'}
                        </Text>
                        <Text size="sm" c="dimmed">
                          Invoices
                        </Text>
                      </Box>
                    </Group>
                  </Card>

                  <Card padding="lg" radius="md" withBorder>
                    <Group>
                      <ThemeIcon size="xl" radius="md" color="green" variant="light">
                        <IconUserCircle size={24} />
                      </ThemeIcon>
                      <Box>
                        <Text size="xl" fw={700}>
                          {tenantStats?.partiesCount ?? '-'}
                        </Text>
                        <Text size="sm" c="dimmed">
                          Parties
                        </Text>
                      </Box>
                    </Group>
                  </Card>

                  <Card padding="lg" radius="md" withBorder>
                    <Group>
                      <ThemeIcon size="xl" radius="md" color="orange" variant="light">
                        <IconPackage size={24} />
                      </ThemeIcon>
                      <Box>
                        <Text size="xl" fw={700}>
                          {tenantStats?.itemsCount ?? '-'}
                        </Text>
                        <Text size="sm" c="dimmed">
                          Inventory Items
                        </Text>
                      </Box>
                    </Group>
                  </Card>

                  <Card padding="lg" radius="md" withBorder>
                    <Group>
                      <ThemeIcon size="xl" radius="md" color="violet" variant="light">
                        <IconUsers size={24} />
                      </ThemeIcon>
                      <Box>
                        <Text size="xl" fw={700}>
                          {tenantStats?.usersCount ?? tenantUsers.length}
                        </Text>
                        <Text size="sm" c="dimmed">
                          Users
                        </Text>
                      </Box>
                    </Group>
                  </Card>
                </SimpleGrid>

                <Divider my="sm" />

                <Paper bg="gray.0" p="md" radius="md">
                  <Group justify="space-between" mb="sm">
                    <Text fw={600}>Quick Access</Text>
                  </Group>
                  <Text size="sm" c="dimmed" mb="md">
                    Access tenant&apos;s application to view detailed data
                  </Text>
                  <Anchor
                    href={`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/${selectedTenant.slug}`}
                    target="_blank"
                  >
                    <Button
                      variant="light"
                      leftSection={<IconExternalLink size={16} />}
                    >
                      Open Tenant App
                    </Button>
                  </Anchor>
                </Paper>
              </Stack>
            </Tabs.Panel>

            {/* Users Tab */}
            <Tabs.Panel value="users">
              <Stack gap="md">
                <Text size="sm" c="dimmed">
                  Users registered under this tenant
                </Text>

                {tenantUsers.length === 0 ? (
                  <Text c="dimmed" ta="center" py="lg">
                    No users found for this tenant
                  </Text>
                ) : (
                  <Table striped>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Name</Table.Th>
                        <Table.Th>Email</Table.Th>
                        <Table.Th>Role</Table.Th>
                        <Table.Th>Status</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {tenantUsers.map((user) => (
                        <Table.Tr key={user.id}>
                          <Table.Td>
                            <Text size="sm" fw={500}>
                              {user.name}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm" c="dimmed">
                              {user.email}
                            </Text>
                          </Table.Td>
                          <Table.Td>{getRoleBadge(user.role)}</Table.Td>
                          <Table.Td>
                            <Badge color={user.isActive ? 'green' : 'red'} size="xs">
                              {user.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                )}
              </Stack>
            </Tabs.Panel>

            {/* Fiscal Years Tab */}
            <Tabs.Panel value="fiscal">
              <Stack gap="md">
                <Text size="sm" c="dimmed">
                  Create and manage fiscal years for this tenant.
                </Text>

                <Card withBorder radius="md" p="md">
                  <Text fw={600} mb="sm">
                    Add Fiscal Year
                  </Text>
                  <SimpleGrid cols={3}>
                    <NepaliDatePicker
                      label="Start Date"
                      value={fyStartDate}
                      onChange={setFyStartDate}
                      placeholder="Select start date"
                    />
                    <NepaliDatePicker
                      label="End Date"
                      value={fyEndDate}
                      onChange={setFyEndDate}
                      placeholder="Select end date"
                    />
                    <Box>
                      <Text size="sm" mb={6}>
                        Set as Current
                      </Text>
                      <Switch
                        checked={fyIsCurrent}
                        onChange={(event) => setFyIsCurrent(event.currentTarget.checked)}
                        color="green"
                        label={fyIsCurrent ? 'Current fiscal year' : 'Not current'}
                      />
                    </Box>
                  </SimpleGrid>
                  <Group justify="flex-end" mt="md">
                    <Button onClick={handleCreateFiscalYear} loading={isCreatingFy}>
                      Create Fiscal Year
                    </Button>
                  </Group>
                </Card>

                <Card withBorder radius="md" p="md">
                  <Text fw={600} mb="sm">
                    Existing Fiscal Years
                  </Text>
                  {tenantFiscalYears.length === 0 ? (
                    <Text size="sm" c="dimmed">
                      No fiscal years created for this tenant yet.
                    </Text>
                  ) : (
                    <Table striped>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Name</Table.Th>
                          <Table.Th>Start</Table.Th>
                          <Table.Th>End</Table.Th>
                          <Table.Th>Current</Table.Th>
                          <Table.Th>Status</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {tenantFiscalYears.map((fy) => (
                          <Table.Tr key={fy.id}>
                            <Table.Td>
                              <Text size="sm" fw={500}>
                                {fy.name}
                              </Text>
                            </Table.Td>
                            <Table.Td>
                              <Text size="sm">
                                {dayjs(fy.startDate).format('MMM D, YYYY')}
                              </Text>
                            </Table.Td>
                            <Table.Td>
                              <Text size="sm">
                                {dayjs(fy.endDate).format('MMM D, YYYY')}
                              </Text>
                            </Table.Td>
                            <Table.Td>
                              <Badge size="xs" color={fy.isCurrent ? 'green' : 'gray'}>
                                {fy.isCurrent ? 'Current' : 'No'}
                              </Badge>
                            </Table.Td>
                            <Table.Td>
                              <Badge size="xs" color={fy.isClosed ? 'red' : 'blue'}>
                                {fy.isClosed ? 'Closed' : 'Open'}
                              </Badge>
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  )}
                </Card>
              </Stack>
            </Tabs.Panel>
          </Tabs>
        )}
      </Modal>
    </Box>
  );
}
