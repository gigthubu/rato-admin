'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Group,
  Loader,
  Modal,
  Pagination,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { IconPrinter, IconReportMoney, IconSearch } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';
import { apiGetAsTenant, ApiError } from '@/lib/api';
import type {
  AdminParty,
  JournalEntryRow,
  Paginated,
  PartyStatement,
  Tenant,
} from '@/lib/types';
import { adToBs, formatBsDate } from '@/lib/nepali-date';

interface Props {
  tenant: Tenant;
  parties: AdminParty[];
}

function money(value: number) {
  return value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function lineTotal(entry: JournalEntryRow, side: 'debit' | 'credit') {
  return entry.lines.reduce((sum, line) => sum + Number(line[side] || 0), 0);
}

/** BS above AD — the admin thinks in BS, reconciles in AD. */
function DateCell({ value }: { value: string }) {
  const date = new Date(value);
  return (
    <Stack gap={0}>
      <Text size="sm">{formatBsDate(adToBs(date))}</Text>
      <Text size="xs" c="dimmed">{dayjs(date).format('DD MMM YYYY')}</Text>
    </Stack>
  );
}

export function LedgerTab({ tenant, parties }: Props) {
  const [entries, setEntries] = useState<JournalEntryRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Party statement
  const [partyId, setPartyId] = useState<string | null>(null);
  const [statement, setStatement] = useState<PartyStatement | null>(null);
  const [isLoadingStatement, setIsLoadingStatement] = useState(false);
  const [statementOpen, setStatementOpen] = useState(false);

  const loadEntries = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '25' });
      if (search.trim()) params.set('search', search.trim());
      const data = await apiGetAsTenant<Paginated<JournalEntryRow>>(
        tenant.id,
        `/accounting/journals?${params.toString()}`,
      );
      setEntries(data.items);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      notifications.show({
        color: 'red',
        title: 'Failed to load transactions',
        message: error instanceof ApiError ? error.message : 'Unable to load journal entries.',
      });
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  }, [tenant.id, page, search]);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  const openStatement = async (id: string) => {
    setPartyId(id);
    setIsLoadingStatement(true);
    setStatementOpen(true);
    try {
      const data = await apiGetAsTenant<PartyStatement>(
        tenant.id,
        `/accounting/parties/${id}/statement`,
      );
      setStatement(data);
    } catch (error) {
      notifications.show({
        color: 'red',
        title: 'Failed to load statement',
        message: error instanceof ApiError ? error.message : 'Unable to load the party statement.',
      });
      setStatementOpen(false);
    } finally {
      setIsLoadingStatement(false);
    }
  };

  return (
    <Stack gap="md">
      {/* ---- Party statement picker ---- */}
      <Card withBorder radius="md" p="md">
        <Text fw={600} mb="sm">Party Ledger</Text>
        <Group align="flex-end" gap="sm" wrap="wrap">
          <Select
            placeholder="Select a party"
            searchable
            clearable
            value={partyId}
            onChange={(value) => value && openStatement(value)}
            data={parties.map((p) => ({ value: String(p.id), label: p.name }))}
            leftSection={<IconReportMoney size={16} />}
            style={{ flex: 1, minWidth: 220 }}
          />
        </Group>
        {parties.length === 0 && (
          <Text size="xs" c="dimmed" mt="xs">No parties found for this tenant.</Text>
        )}
      </Card>

      {/* ---- Transactions ---- */}
      <Card withBorder radius="md" p="md">
        <Group justify="space-between" mb="sm" wrap="wrap" gap="sm">
          <Text fw={600}>Transactions</Text>
          <TextInput
            placeholder="Search voucher, narration…"
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.currentTarget.value);
            }}
            style={{ flex: 1, minWidth: 200, maxWidth: 320 }}
          />
        </Group>

        {isLoading ? (
          <Group justify="center" py="xl"><Loader size="sm" /></Group>
        ) : entries.length === 0 ? (
          <Text size="sm" c="dimmed" ta="center" py="lg">No transactions found.</Text>
        ) : (
          <>
            <Table.ScrollContainer minWidth={760}>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Voucher</Table.Th>
                    <Table.Th>Date</Table.Th>
                    <Table.Th>Narration</Table.Th>
                    <Table.Th>Debit</Table.Th>
                    <Table.Th>Credit</Table.Th>
                    <Table.Th>FY</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {entries.map((entry) => (
                    <Table.Tr key={entry.id}>
                      <Table.Td>
                        <Stack gap={2}>
                          <Text size="sm" fw={500}>{entry.voucherNumber}</Text>
                          <Group gap={4}>
                            <Badge size="xs" variant="light">{entry.voucherType}</Badge>
                            {entry.isReversed && <Badge size="xs" color="red">Reversed</Badge>}
                          </Group>
                        </Stack>
                      </Table.Td>
                      <Table.Td><DateCell value={entry.date} /></Table.Td>
                      <Table.Td>
                        <Text size="sm" lineClamp={2}>
                          {entry.narration || entry.memo || '—'}
                        </Text>
                      </Table.Td>
                      <Table.Td><Text size="sm">{money(lineTotal(entry, 'debit'))}</Text></Table.Td>
                      <Table.Td><Text size="sm">{money(lineTotal(entry, 'credit'))}</Text></Table.Td>
                      <Table.Td>
                        <Text size="xs" c="dimmed">{entry.fiscalYear?.name || '—'}</Text>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>

            {totalPages > 1 && (
              <Group justify="center" mt="md">
                <Pagination value={page} onChange={setPage} total={totalPages} size="sm" />
              </Group>
            )}
          </>
        )}
      </Card>

      {/* ---- Statement modal (printable) ---- */}
      <Modal
        opened={statementOpen}
        onClose={() => setStatementOpen(false)}
        title={
          <Group gap="sm" className="no-print">
            <Text fw={600}>{statement?.party.name ?? 'Party statement'}</Text>
            {statement && (
              <Tooltip label="Print statement">
                <ActionIcon variant="light" onClick={() => window.print()}>
                  <IconPrinter size={16} />
                </ActionIcon>
              </Tooltip>
            )}
          </Group>
        }
        size="xl"
        fullScreen={typeof window !== 'undefined' && window.innerWidth < 768}
      >
        {isLoadingStatement ? (
          <Group justify="center" py="xl"><Loader size="sm" /></Group>
        ) : statement ? (
          <div className="print-area">
            <Stack gap="sm">
              {/* Print-only header — the modal title is hidden when printing. */}
              <Stack gap={2}>
                <Text fw={700} size="lg">{tenant.name}</Text>
                <Text fw={600}>Statement of Account — {statement.party.name}</Text>
                <Text size="xs" c="dimmed">
                  {statement.fromDate
                    ? `${dayjs(statement.fromDate).format('DD MMM YYYY')} to `
                    : 'Up to '}
                  {dayjs(statement.toDate).format('DD MMM YYYY')}
                  {statement.party.panNumber ? ` · PAN ${statement.party.panNumber}` : ''}
                </Text>
              </Stack>

              <Group gap="lg">
                <Text size="sm">Opening: <b>{money(statement.openingBalance)}</b></Text>
                <Text size="sm">Closing: <b>{money(statement.closingBalance)}</b></Text>
              </Group>

              <Table.ScrollContainer minWidth={720}>
                <Table striped withTableBorder>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Date</Table.Th>
                      <Table.Th>Voucher</Table.Th>
                      <Table.Th>Particulars</Table.Th>
                      <Table.Th>Debit</Table.Th>
                      <Table.Th>Credit</Table.Th>
                      <Table.Th>Balance</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {statement.rows.map((row) => (
                      <Table.Tr key={row.lineId}>
                        <Table.Td><DateCell value={row.date} /></Table.Td>
                        <Table.Td>
                          <Text size="sm">{row.voucherNumber}</Text>
                          <Text size="xs" c="dimmed">{row.voucherType}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{row.description || row.accountName}</Text>
                        </Table.Td>
                        <Table.Td><Text size="sm">{row.debit ? money(row.debit) : '—'}</Text></Table.Td>
                        <Table.Td><Text size="sm">{row.credit ? money(row.credit) : '—'}</Text></Table.Td>
                        <Table.Td><Text size="sm" fw={500}>{money(row.balance)}</Text></Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                  <Table.Tfoot>
                    <Table.Tr>
                      <Table.Th colSpan={3}>Total</Table.Th>
                      <Table.Th>{money(statement.totalDebit)}</Table.Th>
                      <Table.Th>{money(statement.totalCredit)}</Table.Th>
                      <Table.Th>{money(statement.closingBalance)}</Table.Th>
                    </Table.Tr>
                  </Table.Tfoot>
                </Table>
              </Table.ScrollContainer>
            </Stack>
          </div>
        ) : null}

        <Group justify="flex-end" mt="md" className="no-print">
          <Button
            variant="light"
            leftSection={<IconPrinter size={16} />}
            onClick={() => window.print()}
            disabled={!statement}
          >
            Print
          </Button>
        </Group>
      </Modal>
    </Stack>
  );
}
