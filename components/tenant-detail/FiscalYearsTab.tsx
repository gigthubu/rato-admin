'use client';

import { useCallback, useState } from 'react';
import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Group,
  Modal,
  SimpleGrid,
  Stack,
  Switch,
  Table,
  Text,
  Tooltip,
  ActionIcon,
} from '@mantine/core';
import { IconAlertTriangle, IconEdit } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';
import { apiGet, apiPost, apiPut, ApiError } from '@/lib/api';
import type { FiscalYear } from '@/lib/types';
import { NepaliDatePicker } from '@/components/shared';
import { adToBs, formatBsDate } from '@/lib/nepali-date';

interface Props {
  tenantId: number;
  fiscalYears: FiscalYear[];
  onChange: (fiscalYears: FiscalYear[]) => void;
  /** Called when the current year changes, so the tenant list can refresh its label. */
  onCurrentYearChange?: (name: string) => void;
}

/** Both BS and AD, since the whole point of the picker is that they must agree. */
function DualDate({ value }: { value: string }) {
  const date = new Date(value);
  return (
    <Stack gap={0}>
      <Text size="sm">{formatBsDate(adToBs(date))}</Text>
      <Text size="xs" c="dimmed">{dayjs(date).format('MMM D, YYYY')}</Text>
    </Stack>
  );
}

export function FiscalYearsTab({ tenantId, fiscalYears, onChange, onCurrentYearChange }: Props) {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isCurrent, setIsCurrent] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Edit modal
  const [editing, setEditing] = useState<FiscalYear | null>(null);
  const [editStart, setEditStart] = useState<Date | null>(null);
  const [editEnd, setEditEnd] = useState<Date | null>(null);
  const [editIsCurrent, setEditIsCurrent] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  /** Set when the API refused because documents would be stranded; enables force. */
  const [strandedWarning, setStrandedWarning] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    onChange(await apiGet<FiscalYear[]>(`/tenants/${tenantId}/fiscal-years`));
  }, [tenantId, onChange]);

  const handleCreate = async () => {
    if (!startDate || !endDate) {
      notifications.show({ color: 'red', title: 'Missing dates', message: 'Select both start and end dates.' });
      return;
    }
    setIsCreating(true);
    try {
      const created = await apiPost<FiscalYear>(`/tenants/${tenantId}/fiscal-years`, {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        isCurrent,
      });
      notifications.show({ color: 'green', title: 'Fiscal year created', message: `${created.name} added.` });
      await refresh();
      if (created.isCurrent) onCurrentYearChange?.(created.name);
      setStartDate(null);
      setEndDate(null);
      setIsCurrent(true);
    } catch (error) {
      notifications.show({
        color: 'red',
        title: 'Failed to create fiscal year',
        message: error instanceof ApiError ? error.message : 'Unable to create fiscal year.',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const openEdit = (fy: FiscalYear) => {
    setEditing(fy);
    setEditStart(new Date(fy.startDate));
    setEditEnd(new Date(fy.endDate));
    setEditIsCurrent(fy.isCurrent);
    setStrandedWarning(null);
  };

  const closeEdit = () => {
    setEditing(null);
    setStrandedWarning(null);
  };

  const handleSave = async (force: boolean) => {
    if (!editing || !editStart || !editEnd) return;
    setIsSaving(true);
    try {
      const updated = await apiPut<FiscalYear>(
        `/tenants/${tenantId}/fiscal-years/${editing.id}`,
        {
          startDate: editStart.toISOString(),
          endDate: editEnd.toISOString(),
          isCurrent: editIsCurrent,
          ...(force ? { force: true } : {}),
        },
      );
      notifications.show({ color: 'green', title: 'Fiscal year updated', message: `${updated.name} saved.` });
      await refresh();
      if (updated.isCurrent) onCurrentYearChange?.(updated.name);
      closeEdit();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Unable to update fiscal year.';
      // The stranded-document refusal is the one the admin can consciously
      // override, so surface it inline with a force button rather than a toast.
      if (message.includes('would fall outside')) {
        setStrandedWarning(message);
      } else {
        notifications.show({ color: 'red', title: 'Failed to update fiscal year', message });
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Stack gap="md">
      <Text size="sm" c="dimmed">Create and manage fiscal years for this tenant.</Text>

      <Card withBorder radius="md" p="md">
        <Text fw={600} mb="sm">Add Fiscal Year</Text>
        <SimpleGrid cols={{ base: 1, sm: 3 }}>
          <NepaliDatePicker
            label="Start Date"
            value={startDate}
            onChange={setStartDate}
            placeholder="Select start date"
          />
          <NepaliDatePicker
            label="End Date"
            value={endDate}
            onChange={setEndDate}
            placeholder="Select end date"
          />
          <Box>
            <Text size="sm" mb={6}>Set as Current</Text>
            <Switch
              checked={isCurrent}
              onChange={(e) => setIsCurrent(e.currentTarget.checked)}
              color="green"
              label={isCurrent ? 'Current fiscal year' : 'Not current'}
            />
          </Box>
        </SimpleGrid>
        <Group justify="flex-end" mt="md">
          <Button onClick={handleCreate} loading={isCreating}>Create Fiscal Year</Button>
        </Group>
      </Card>

      <Card withBorder radius="md" p="md">
        <Text fw={600} mb="sm">Existing Fiscal Years</Text>
        {fiscalYears.length === 0 ? (
          <Text size="sm" c="dimmed">No fiscal years created for this tenant yet.</Text>
        ) : (
          <Table.ScrollContainer minWidth={700}>
            <Table striped>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Start (BS / AD)</Table.Th>
                  <Table.Th>End (BS / AD)</Table.Th>
                  <Table.Th>Current</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Edit</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {fiscalYears.map((fy) => (
                  <Table.Tr key={fy.id}>
                    <Table.Td><Text size="sm" fw={500}>{fy.name}</Text></Table.Td>
                    <Table.Td><DualDate value={fy.startDate} /></Table.Td>
                    <Table.Td><DualDate value={fy.endDate} /></Table.Td>
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
                    <Table.Td>
                      <Tooltip label={fy.isClosed ? 'Reopen the year before editing' : 'Edit dates'}>
                        <div>
                          <ActionIcon
                            variant="subtle"
                            disabled={fy.isClosed}
                            onClick={() => openEdit(fy)}
                          >
                            <IconEdit size={16} />
                          </ActionIcon>
                        </div>
                      </Tooltip>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </Card>

      <Modal
        opened={editing !== null}
        onClose={closeEdit}
        title={`Edit fiscal year ${editing?.name ?? ''}`}
        fullScreen={typeof window !== 'undefined' && window.innerWidth < 768}
      >
        <Stack gap="md">
          <NepaliDatePicker label="Start Date" value={editStart} onChange={setEditStart} />
          <NepaliDatePicker label="End Date" value={editEnd} onChange={setEditEnd} />
          <Switch
            checked={editIsCurrent}
            onChange={(e) => setEditIsCurrent(e.currentTarget.checked)}
            color="green"
            label={editIsCurrent ? 'Current fiscal year' : 'Not current'}
          />

          {strandedWarning && (
            <Alert color="orange" icon={<IconAlertTriangle size={16} />} title="Documents would be stranded">
              <Text size="sm">{strandedWarning}</Text>
              <Text size="xs" mt="xs" c="dimmed">
                Forcing leaves those documents stamped with a fiscal year that no longer contains
                them. Re-run the fiscal year backfill from the Maintenance tab afterwards.
              </Text>
            </Alert>
          )}

          <Group justify="flex-end">
            <Button variant="subtle" onClick={closeEdit}>Cancel</Button>
            {strandedWarning ? (
              <Button color="orange" loading={isSaving} onClick={() => handleSave(true)}>
                Save anyway
              </Button>
            ) : (
              <Button loading={isSaving} onClick={() => handleSave(false)}>Save</Button>
            )}
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
