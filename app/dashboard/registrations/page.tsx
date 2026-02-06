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
  Alert,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconSearch,
  IconCheck,
  IconX,
  IconEye,
  IconFilter,
} from '@tabler/icons-react';
import { apiGet, apiPost } from '@/lib/api';
import type { Registration } from '@/lib/types';
import dayjs from 'dayjs';

export default function RegistrationsPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>('all');
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null);
  const [viewModalOpened, { open: openViewModal, close: closeViewModal }] = useDisclosure(false);
  const [approveModalOpened, { open: openApproveModal, close: closeApproveModal }] = useDisclosure(false);
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchRegistrations = async () => {
    try {
      const data = await apiGet<Registration[]>('/registrations');
      setRegistrations(data);
      setFilteredRegistrations(data);
    } catch (error) {
      console.error('Failed to fetch registrations:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to load registrations',
        color: 'red',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  useEffect(() => {
    let filtered = registrations;

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.companyName.toLowerCase().includes(searchLower) ||
          r.email.toLowerCase().includes(searchLower) ||
          r.name.toLowerCase().includes(searchLower)
      );
    }

    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }

    setFilteredRegistrations(filtered);
  }, [search, statusFilter, registrations]);

  const handleApprove = async () => {
    if (!selectedReg) return;
    setIsProcessing(true);

    try {
      await apiPost(`/registrations/${selectedReg.id}/approve`, {
        expiryDate: expiryDate?.toISOString(),
      });
      notifications.show({
        title: 'Success',
        message: 'Registration approved successfully',
        color: 'green',
      });
      closeApproveModal();
      fetchRegistrations();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to approve registration',
        color: 'red',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (reg: Registration) => {
    setIsProcessing(true);
    try {
      await apiPost(`/registrations/${reg.id}/reject`);
      notifications.show({
        title: 'Success',
        message: 'Registration rejected',
        color: 'orange',
      });
      fetchRegistrations();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to reject registration',
        color: 'red',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (reg: Registration) => {
    if (!reg.otpVerified && reg.status === 'PENDING') {
      return <Badge color="gray">Unverified</Badge>;
    }
    switch (reg.status) {
      case 'PENDING':
        return <Badge color="orange">Pending</Badge>;
      case 'APPROVED':
        return <Badge color="green">Approved</Badge>;
      case 'REJECTED':
        return <Badge color="red">Rejected</Badge>;
      default:
        return <Badge color="gray">{reg.status}</Badge>;
    }
  };

  return (
    <Box>
      <Group justify="space-between" mb="xl">
        <Stack gap={0}>
          <Title order={2}>Registration Requests</Title>
          <Text c="dimmed" size="sm">
            Review and manage registration requests
          </Text>
        </Stack>
      </Group>

      {/* Filters */}
      <Paper p="md" radius="md" shadow="sm" mb="lg">
        <Group>
          <TextInput
            placeholder="Search by company, email, or name..."
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
              { value: 'PENDING', label: 'Pending' },
              { value: 'APPROVED', label: 'Approved' },
              { value: 'REJECTED', label: 'Rejected' },
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
              <Table.Th>Company</Table.Th>
              <Table.Th>Contact</Table.Th>
              <Table.Th>Business Type</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Registered</Table.Th>
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
            ) : filteredRegistrations.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={6}>
                  <Text ta="center" py="xl" c="dimmed">
                    No registrations found
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              filteredRegistrations.map((reg) => (
                <Table.Tr key={reg.id}>
                  <Table.Td>
                    <Stack gap={0}>
                      <Text size="sm" fw={500}>
                        {reg.companyName}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {reg.city}
                      </Text>
                    </Stack>
                  </Table.Td>
                  <Table.Td>
                    <Stack gap={0}>
                      <Text size="sm">{reg.name}</Text>
                      <Text size="xs" c="dimmed">
                        {reg.email}
                      </Text>
                    </Stack>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" tt="capitalize">
                      {reg.businessType}
                    </Text>
                  </Table.Td>
                  <Table.Td>{getStatusBadge(reg)}</Table.Td>
                  <Table.Td>
                    <Text size="xs" c="dimmed">
                      {dayjs(reg.createdAt).format('MMM D, YYYY')}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Tooltip label="View Details">
                        <ActionIcon
                          variant="subtle"
                          color="gray"
                          onClick={() => {
                            setSelectedReg(reg);
                            openViewModal();
                          }}
                        >
                          <IconEye size={18} />
                        </ActionIcon>
                      </Tooltip>
                      {reg.status === 'PENDING' && reg.otpVerified && (
                        <>
                          <Tooltip label="Approve">
                            <ActionIcon
                              variant="subtle"
                              color="green"
                              onClick={() => {
                                setSelectedReg(reg);
                                setExpiryDate(dayjs().add(1, 'year').toDate());
                                openApproveModal();
                              }}
                            >
                              <IconCheck size={18} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Reject">
                            <ActionIcon
                              variant="subtle"
                              color="red"
                              onClick={() => handleReject(reg)}
                              loading={isProcessing}
                            >
                              <IconX size={18} />
                            </ActionIcon>
                          </Tooltip>
                        </>
                      )}
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </Paper>

      {/* View Modal */}
      <Modal
        opened={viewModalOpened}
        onClose={closeViewModal}
        title={<Title order={4}>Registration Details</Title>}
        size="lg"
      >
        {selectedReg && (
          <Stack gap="md">
            <Paper bg="gray.0" p="md" radius="md">
              <Text fw={600} mb="sm">
                Personal Information
              </Text>
              <Group grow>
                <Box>
                  <Text size="xs" c="dimmed">
                    Name
                  </Text>
                  <Text size="sm" fw={500}>
                    {selectedReg.name}
                  </Text>
                </Box>
                <Box>
                  <Text size="xs" c="dimmed">
                    Email
                  </Text>
                  <Text size="sm" fw={500}>
                    {selectedReg.email}
                  </Text>
                </Box>
              </Group>
              <Box mt="sm">
                <Text size="xs" c="dimmed">
                  Phone
                </Text>
                <Text size="sm" fw={500}>
                  {selectedReg.phone}
                </Text>
              </Box>
            </Paper>

            <Paper bg="gray.0" p="md" radius="md">
              <Text fw={600} mb="sm">
                Business Information
              </Text>
              <Group grow>
                <Box>
                  <Text size="xs" c="dimmed">
                    Company Name
                  </Text>
                  <Text size="sm" fw={500}>
                    {selectedReg.companyName}
                  </Text>
                </Box>
                <Box>
                  <Text size="xs" c="dimmed">
                    Business Type
                  </Text>
                  <Text size="sm" fw={500} tt="capitalize">
                    {selectedReg.businessType}
                  </Text>
                </Box>
              </Group>
              <Box mt="sm">
                <Text size="xs" c="dimmed">
                  Address
                </Text>
                <Text size="sm" fw={500}>
                  {selectedReg.address}, {selectedReg.city}
                </Text>
              </Box>
              {selectedReg.panNumber && (
                <Box mt="sm">
                  <Text size="xs" c="dimmed">
                    PAN Number
                  </Text>
                  <Text size="sm" fw={500}>
                    {selectedReg.panNumber}
                  </Text>
                </Box>
              )}
            </Paper>

            <Paper bg="gray.0" p="md" radius="md">
              <Text fw={600} mb="sm">
                Status
              </Text>
              <Group>
                <Box>
                  <Text size="xs" c="dimmed">
                    Registration Status
                  </Text>
                  {getStatusBadge(selectedReg)}
                </Box>
                <Box>
                  <Text size="xs" c="dimmed">
                    Email Verified
                  </Text>
                  <Badge color={selectedReg.otpVerified ? 'green' : 'gray'}>
                    {selectedReg.otpVerified ? 'Yes' : 'No'}
                  </Badge>
                </Box>
                <Box>
                  <Text size="xs" c="dimmed">
                    Registered On
                  </Text>
                  <Text size="sm" fw={500}>
                    {dayjs(selectedReg.createdAt).format('MMM D, YYYY h:mm A')}
                  </Text>
                </Box>
              </Group>
            </Paper>

            {selectedReg.status === 'PENDING' && selectedReg.otpVerified && (
              <Group mt="md">
                <Button
                  color="green"
                  leftSection={<IconCheck size={16} />}
                  onClick={() => {
                    closeViewModal();
                    setExpiryDate(dayjs().add(1, 'year').toDate());
                    openApproveModal();
                  }}
                >
                  Approve
                </Button>
                <Button
                  color="red"
                  variant="outline"
                  leftSection={<IconX size={16} />}
                  onClick={() => {
                    closeViewModal();
                    handleReject(selectedReg);
                  }}
                >
                  Reject
                </Button>
              </Group>
            )}
          </Stack>
        )}
      </Modal>

      {/* Approve Modal */}
      <Modal
        opened={approveModalOpened}
        onClose={closeApproveModal}
        title={<Title order={4}>Approve Registration</Title>}
        size="md"
      >
        {selectedReg && (
          <Stack gap="md">
            <Alert color="blue" variant="light">
              You are about to approve the registration for{' '}
              <Text span fw={600}>
                {selectedReg.companyName}
              </Text>
              . This will create a new tenant and admin user.
            </Alert>

            <DateInput
              label="Subscription Expiry Date"
              description="Set when the subscription should expire"
              placeholder="Select date"
              value={expiryDate}
              onChange={setExpiryDate}
              minDate={new Date()}
            />

            <Divider />

            <Group justify="flex-end">
              <Button variant="default" onClick={closeApproveModal}>
                Cancel
              </Button>
              <Button
                color="green"
                onClick={handleApprove}
                loading={isProcessing}
              >
                Approve & Create Tenant
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Box>
  );
}
