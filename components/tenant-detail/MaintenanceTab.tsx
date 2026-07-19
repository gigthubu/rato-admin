'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Code,
  Group,
  List,
  Loader,
  Modal,
  ScrollArea,
  SimpleGrid,
  Stack,
  Table,
  Text,
  ThemeIcon,
} from '@mantine/core';
import {
  IconAlertTriangle,
  IconCircleCheck,
  IconPlayerPlay,
  IconRefresh,
  IconEye,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';
import { apiGet, apiPost, ApiError } from '@/lib/api';
import type { AccountingHealth, MaintenanceScript, ScriptRunResult } from '@/lib/types';

interface Props {
  tenantId: number;
}

function formatMoney(value: number) {
  return value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** One row of the integrity summary: a label, a count, and whether it's a problem. */
function CheckRow({ label, count, ok }: { label: string; count: number; ok: boolean }) {
  return (
    <Group justify="space-between" wrap="nowrap">
      <Text size="sm">{label}</Text>
      <Badge size="sm" color={ok ? 'green' : 'red'} variant={ok ? 'light' : 'filled'}>
        {count}
      </Badge>
    </Group>
  );
}

export function MaintenanceTab({ tenantId }: Props) {
  const [health, setHealth] = useState<AccountingHealth | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [scripts, setScripts] = useState<MaintenanceScript[]>([]);
  const [runningScript, setRunningScript] = useState<string | null>(null);
  const [result, setResult] = useState<ScriptRunResult | null>(null);

  const runIntegrityCheck = useCallback(async () => {
    setIsChecking(true);
    try {
      setHealth(await apiGet<AccountingHealth>(`/maintenance/tenants/${tenantId}/integrity`));
    } catch (error) {
      notifications.show({
        color: 'red',
        title: 'Integrity check failed',
        message: error instanceof ApiError ? error.message : 'Unable to run the check.',
      });
    } finally {
      setIsChecking(false);
    }
  }, [tenantId]);

  useEffect(() => {
    apiGet<MaintenanceScript[]>('/maintenance/scripts')
      .then(setScripts)
      .catch(() => setScripts([]));
  }, []);

  useEffect(() => {
    void runIntegrityCheck();
  }, [runIntegrityCheck]);

  const runScript = async (script: MaintenanceScript, dryRun: boolean) => {
    setRunningScript(`${script.key}:${dryRun}`);
    try {
      const data = await apiPost<ScriptRunResult>(`/maintenance/tenants/${tenantId}/scripts`, {
        script: script.key,
        dryRun,
      });
      setResult(data);
      // An apply may have changed the very things the integrity check reports on.
      if (!dryRun) void runIntegrityCheck();
    } catch (error) {
      notifications.show({
        color: 'red',
        title: `${script.label} failed`,
        message: error instanceof ApiError ? error.message : 'Unable to run the script.',
      });
    } finally {
      setRunningScript(null);
    }
  };

  return (
    <Stack gap="md">
      {/* ---- Integrity ---- */}
      <Card withBorder radius="md" p="md">
        <Group justify="space-between" mb="sm" wrap="nowrap">
          <Text fw={600}>Data Integrity</Text>
          <Button
            size="xs"
            variant="light"
            leftSection={<IconRefresh size={14} />}
            onClick={runIntegrityCheck}
            loading={isChecking}
          >
            Re-check
          </Button>
        </Group>

        {isChecking && !health ? (
          <Group justify="center" py="lg"><Loader size="sm" /></Group>
        ) : !health ? (
          <Text size="sm" c="dimmed">No result yet.</Text>
        ) : (
          <Stack gap="sm">
            <Alert
              color={health.isClean ? 'green' : 'red'}
              icon={health.isClean ? <IconCircleCheck size={16} /> : <IconAlertTriangle size={16} />}
              title={health.isClean ? 'Books are clean' : 'Problems found'}
            >
              <Text size="sm">
                Checked {dayjs(health.checkedAt).format('MMM D, YYYY h:mm A')}
              </Text>
            </Alert>

            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
              <CheckRow
                label="Trial balance"
                count={Number(health.trialBalance.difference.toFixed(2))}
                ok={health.trialBalance.balanced}
              />
              <CheckRow
                label="Unbalanced entries"
                count={health.unbalancedEntries.length}
                ok={health.unbalancedEntries.length === 0}
              />
              <CheckRow
                label="Party balance drift"
                count={health.partyBalanceDrift.length}
                ok={health.partyBalanceDrift.length === 0}
              />
              <CheckRow
                label="Account balance drift"
                count={health.accountBalanceDrift.length}
                ok={health.accountBalanceDrift.length === 0}
              />
              <CheckRow
                label="Accounts without sub-type"
                count={health.accountsWithoutSubType.length}
                ok={health.accountsWithoutSubType.length === 0}
              />
              <CheckRow
                label="Journal lines missing fiscal year"
                count={health.unstampedLineCount}
                ok={health.unstampedLineCount === 0}
              />
            </SimpleGrid>

            <Text size="xs" c="dimmed">
              Debit {formatMoney(health.trialBalance.totalDebit)} · Credit{' '}
              {formatMoney(health.trialBalance.totalCredit)}
            </Text>

            {health.partyBalanceDrift.length > 0 && (
              <Table.ScrollContainer minWidth={520}>
                <Table striped withTableBorder>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Party</Table.Th>
                      <Table.Th>Stored</Table.Th>
                      <Table.Th>Ledger</Table.Th>
                      <Table.Th>Difference</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {health.partyBalanceDrift.map((d) => (
                      <Table.Tr key={d.partyId}>
                        <Table.Td><Text size="sm">{d.partyName}</Text></Table.Td>
                        <Table.Td><Text size="sm">{formatMoney(d.storedBalance)}</Text></Table.Td>
                        <Table.Td><Text size="sm">{formatMoney(d.ledgerBalance)}</Text></Table.Td>
                        <Table.Td><Text size="sm" c="red">{formatMoney(d.difference)}</Text></Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            )}
          </Stack>
        )}
      </Card>

      {/* ---- Scripts ---- */}
      <Card withBorder radius="md" p="md">
        <Text fw={600} mb="xs">Maintenance Scripts</Text>
        <Text size="sm" c="dimmed" mb="md">
          These run against this tenant only. Always preview before applying.
        </Text>

        <Stack gap="sm">
          {scripts.map((script) => (
            <Card key={script.key} withBorder radius="sm" p="sm">
              <Group justify="space-between" wrap="nowrap" align="flex-start">
                <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                  <Group gap="xs">
                    <Text size="sm" fw={500}>{script.label}</Text>
                    <Badge size="xs" color={script.mutating ? 'orange' : 'blue'}>
                      {script.mutating ? 'Writes' : 'Read-only'}
                    </Badge>
                  </Group>
                  <Text size="xs" c="dimmed">{script.description}</Text>
                </Stack>
              </Group>

              <Group mt="sm" gap="xs">
                {script.supportsDryRun && (
                  <Button
                    size="xs"
                    variant="light"
                    leftSection={<IconEye size={14} />}
                    loading={runningScript === `${script.key}:true`}
                    onClick={() => runScript(script, true)}
                  >
                    Preview
                  </Button>
                )}
                <Button
                  size="xs"
                  color={script.mutating ? 'orange' : 'blue'}
                  leftSection={<IconPlayerPlay size={14} />}
                  loading={runningScript === `${script.key}:false`}
                  onClick={() => runScript(script, false)}
                >
                  {script.mutating ? 'Apply' : 'Run'}
                </Button>
              </Group>
            </Card>
          ))}
        </Stack>
      </Card>

      {/* ---- Result ---- */}
      <Modal
        opened={result !== null}
        onClose={() => setResult(null)}
        title={
          <Group gap="xs">
            <Text fw={600}>{result?.label}</Text>
            {result?.dryRun && <Badge size="xs" color="blue">Preview — nothing written</Badge>}
          </Group>
        }
        size="lg"
        fullScreen={typeof window !== 'undefined' && window.innerWidth < 768}
      >
        {result && (
          <Stack gap="sm">
            <Group gap="xs">
              <ThemeIcon size="sm" color="green" variant="light"><IconCircleCheck size={14} /></ThemeIcon>
              <Text size="sm">Finished in {result.durationMs} ms</Text>
            </Group>
            <ScrollArea.Autosize mah={400}>
              <Code block style={{ fontSize: 11 }}>
                {JSON.stringify(result.report, null, 2)}
              </Code>
            </ScrollArea.Autosize>
            {result.dryRun && (
              <List size="xs" c="dimmed">
                <List.Item>Nothing was written. Re-run with Apply to commit these changes.</List.Item>
              </List>
            )}
          </Stack>
        )}
      </Modal>
    </Stack>
  );
}
