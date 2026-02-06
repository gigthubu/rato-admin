'use client';

import { useEffect, useState } from 'react';
import {
  Title,
  Text,
  Paper,
  SimpleGrid,
  Group,
  Stack,
  ThemeIcon,
  Badge,
  Table,
  Button,
  Box,
} from '@mantine/core';
import {
  IconBuilding,
  IconUsers,
  IconUserPlus,
  IconCheck,
  IconClock,
  IconX,
} from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { apiGet } from '@/lib/api';
import type { Registration, Tenant } from '@/lib/types';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

interface DashboardStats {
  totalTenants: number;
  activeTenants: number;
  suspendedTenants: number;
  pendingRegistrations: number;
  approvedRegistrations: number;
  rejectedRegistrations: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentRegistrations, setRecentRegistrations] = useState<Registration[]>([]);
  const [recentTenants, setRecentTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [registrations, tenants] = await Promise.all([
          apiGet<Registration[]>('/registrations'),
          apiGet<Tenant[]>('/tenants'),
        ]);

        const pending = registrations.filter((r) => r.status === 'PENDING' && r.otpVerified);
        const approved = registrations.filter((r) => r.status === 'APPROVED');
        const rejected = registrations.filter((r) => r.status === 'REJECTED');
        const active = tenants.filter((t) => t.status === 'ACTIVE');
        const suspended = tenants.filter((t) => t.status === 'SUSPENDED');

        setStats({
          totalTenants: tenants.length,
          activeTenants: active.length,
          suspendedTenants: suspended.length,
          pendingRegistrations: pending.length,
          approvedRegistrations: approved.length,
          rejectedRegistrations: rejected.length,
        });

        setRecentRegistrations(registrations.slice(0, 5));
        setRecentTenants(tenants.slice(0, 5));
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const statCards = [
    {
      title: 'Total Tenants',
      value: stats?.totalTenants || 0,
      icon: IconBuilding,
      color: 'blue',
    },
    {
      title: 'Active Tenants',
      value: stats?.activeTenants || 0,
      icon: IconCheck,
      color: 'green',
    },
    {
      title: 'Suspended',
      value: stats?.suspendedTenants || 0,
      icon: IconX,
      color: 'red',
    },
    {
      title: 'Pending Requests',
      value: stats?.pendingRegistrations || 0,
      icon: IconClock,
      color: 'orange',
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge color="orange">Pending</Badge>;
      case 'APPROVED':
        return <Badge color="green">Approved</Badge>;
      case 'REJECTED':
        return <Badge color="red">Rejected</Badge>;
      case 'ACTIVE':
        return <Badge color="green">Active</Badge>;
      case 'SUSPENDED':
        return <Badge color="red">Suspended</Badge>;
      default:
        return <Badge color="gray">{status}</Badge>;
    }
  };

  return (
    <Box>
      <Group justify="space-between" mb="xl">
        <Stack gap={0}>
          <Title order={2}>Dashboard</Title>
          <Text c="dimmed" size="sm">
            Overview of your platform
          </Text>
        </Stack>
      </Group>

      {/* Stats Cards */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} mb="xl">
        {statCards.map((stat) => (
          <Paper key={stat.title} p="lg" radius="md" shadow="sm">
            <Group justify="space-between">
              <Stack gap={0}>
                <Text c="dimmed" size="sm" fw={500}>
                  {stat.title}
                </Text>
                <Title order={2}>{isLoading ? '-' : stat.value}</Title>
              </Stack>
              <ThemeIcon size={50} radius="md" color={stat.color} variant="light">
                <stat.icon size={26} />
              </ThemeIcon>
            </Group>
          </Paper>
        ))}
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
        {/* Recent Registrations */}
        <Paper p="lg" radius="md" shadow="sm">
          <Group justify="space-between" mb="md">
            <Title order={4}>Recent Registrations</Title>
            <Button
              variant="subtle"
              size="xs"
              onClick={() => router.push('/dashboard/registrations')}
            >
              View All
            </Button>
          </Group>

          {recentRegistrations.length === 0 ? (
            <Text c="dimmed" ta="center" py="xl">
              No registrations yet
            </Text>
          ) : (
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Company</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Date</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {recentRegistrations.map((reg) => (
                  <Table.Tr key={reg.id}>
                    <Table.Td>
                      <Stack gap={0}>
                        <Text size="sm" fw={500}>
                          {reg.companyName}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {reg.email}
                        </Text>
                      </Stack>
                    </Table.Td>
                    <Table.Td>{getStatusBadge(reg.status)}</Table.Td>
                    <Table.Td>
                      <Text size="xs" c="dimmed">
                        {dayjs(reg.createdAt).fromNow()}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Paper>

        {/* Recent Tenants */}
        <Paper p="lg" radius="md" shadow="sm">
          <Group justify="space-between" mb="md">
            <Title order={4}>Recent Tenants</Title>
            <Button
              variant="subtle"
              size="xs"
              onClick={() => router.push('/dashboard/tenants')}
            >
              View All
            </Button>
          </Group>

          {recentTenants.length === 0 ? (
            <Text c="dimmed" ta="center" py="xl">
              No tenants yet
            </Text>
          ) : (
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Created</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {recentTenants.map((tenant) => (
                  <Table.Tr key={tenant.id}>
                    <Table.Td>
                      <Stack gap={0}>
                        <Text size="sm" fw={500}>
                          {tenant.name}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {tenant.slug}
                        </Text>
                      </Stack>
                    </Table.Td>
                    <Table.Td>{getStatusBadge(tenant.status)}</Table.Td>
                    <Table.Td>
                      <Text size="xs" c="dimmed">
                        {dayjs(tenant.createdAt).fromNow()}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Paper>
      </SimpleGrid>
    </Box>
  );
}
