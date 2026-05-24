'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Paper,
  Group,
  Stack,
  Text,
  ActionIcon,
  Button,
  SimpleGrid,
  SegmentedControl,
  Select,
  Popover,
  TextInput,
  Box,
} from '@mantine/core';
import { IconChevronLeft, IconChevronRight, IconCalendar } from '@tabler/icons-react';
import {
  NepaliDate,
  adToBs,
  bsToAd,
  formatBsDate,
  formatAdDate,
  getBsMonthCalendar,
  getAdMonthCalendar,
  getDaysInBsMonth,
  getDaysInAdMonth,
  BS_MONTHS_EN,
  AD_MONTHS_EN,
  WEEKDAYS_EN,
  WEEKDAYS_NP,
  getCurrentBsDate,
} from '@/lib/nepali-date';

interface NepaliDatePickerProps {
  value?: Date | null;
  onChange?: (date: Date | null) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  description?: string;
  error?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  clearable?: boolean;
  showModeToggle?: boolean;
}

type CalendarMode = 'bs' | 'ad';

export function NepaliDatePicker({
  value,
  onChange,
  label,
  placeholder = 'Select date',
  required,
  description,
  error,
  disabled,
  minDate,
  maxDate,
  clearable = true,
  showModeToggle = true,
}: NepaliDatePickerProps) {
  const [opened, setOpened] = useState(false);
  const [mode, setMode] = useState<CalendarMode>('bs');

  const today = getCurrentBsDate();
  const todayAd = new Date();

  // BS view state
  const [bsViewYear, setBsViewYear] = useState(value ? adToBs(value).year : today.year);
  const [bsViewMonth, setBsViewMonth] = useState(value ? adToBs(value).month : today.month);

  // AD view state
  const [adViewYear, setAdViewYear] = useState(value ? value.getFullYear() : todayAd.getFullYear());
  const [adViewMonth, setAdViewMonth] = useState(value ? value.getMonth() + 1 : todayAd.getMonth() + 1);

  // Keep view state in sync when value changes externally
  useEffect(() => {
    if (value) {
      const bs = adToBs(value);
      setBsViewYear(bs.year);
      setBsViewMonth(bs.month);
      setAdViewYear(value.getFullYear());
      setAdViewMonth(value.getMonth() + 1);
    }
  }, [value]);

  useEffect(() => {
    if (!showModeToggle) setMode('bs');
  }, [showModeToggle]);

  // Switch between modes — keep the view centred on the current value
  const handleModeChange = useCallback((m: string) => {
    setMode(m as CalendarMode);
    if (m === 'ad') {
      if (value) {
        setAdViewYear(value.getFullYear());
        setAdViewMonth(value.getMonth() + 1);
      } else {
        setAdViewYear(todayAd.getFullYear());
        setAdViewMonth(todayAd.getMonth() + 1);
      }
    } else {
      if (value) {
        const bs = adToBs(value);
        setBsViewYear(bs.year);
        setBsViewMonth(bs.month);
      } else {
        setBsViewYear(today.year);
        setBsViewMonth(today.month);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handlePrevMonth = useCallback(() => {
    if (mode === 'bs') {
      if (bsViewMonth === 1) { setBsViewMonth(12); setBsViewYear(y => y - 1); }
      else setBsViewMonth(m => m - 1);
    } else {
      if (adViewMonth === 1) { setAdViewMonth(12); setAdViewYear(y => y - 1); }
      else setAdViewMonth(m => m - 1);
    }
  }, [mode, bsViewMonth, adViewMonth]);

  const handleNextMonth = useCallback(() => {
    if (mode === 'bs') {
      if (bsViewMonth === 12) { setBsViewMonth(1); setBsViewYear(y => y + 1); }
      else setBsViewMonth(m => m + 1);
    } else {
      if (adViewMonth === 12) { setAdViewMonth(1); setAdViewYear(y => y + 1); }
      else setAdViewMonth(m => m + 1);
    }
  }, [mode, bsViewMonth, adViewMonth]);

  const handleSelectDay = useCallback((day: number) => {
    let selected: Date;
    if (mode === 'bs') {
      selected = bsToAd({ year: bsViewYear, month: bsViewMonth, day });
    } else {
      // Construct an AD date at noon UTC to avoid timezone-induced day shifts
      selected = new Date(Date.UTC(adViewYear, adViewMonth - 1, day, 12, 0, 0));
    }
    if (minDate && selected < minDate) return;
    if (maxDate && selected > maxDate) return;
    onChange?.(selected);
    setOpened(false);
  }, [mode, bsViewYear, bsViewMonth, adViewYear, adViewMonth, minDate, maxDate, onChange]);

  const handleClear = useCallback(() => { onChange?.(null); setOpened(false); }, [onChange]);

  const handleToday = useCallback(() => {
    const now = new Date();
    if (mode === 'ad') {
      const noon = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0));
      onChange?.(noon);
    } else {
      onChange?.(now);
    }
    setOpened(false);
  }, [mode, onChange]);

  // Calendar grid
  const calendarGrid = mode === 'bs'
    ? getBsMonthCalendar(bsViewYear, bsViewMonth)
    : getAdMonthCalendar(adViewYear, adViewMonth);

  // Selected date state
  const selectedBs = value ? adToBs(value) : null;
  const todayBs = today;

  const isSelected = (day: number) => {
    if (!value) return false;
    if (mode === 'bs') {
      return selectedBs?.year === bsViewYear && selectedBs?.month === bsViewMonth && selectedBs?.day === day;
    }
    return value.getUTCFullYear() === adViewYear && value.getUTCMonth() + 1 === adViewMonth && value.getUTCDate() === day;
  };

  const isToday = (day: number) => {
    if (mode === 'bs') {
      return todayBs.year === bsViewYear && todayBs.month === bsViewMonth && todayBs.day === day;
    }
    return todayAd.getFullYear() === adViewYear && todayAd.getMonth() + 1 === adViewMonth && todayAd.getDate() === day;
  };

  const isDisabled = (day: number) => {
    let date: Date;
    if (mode === 'bs') {
      date = bsToAd({ year: bsViewYear, month: bsViewMonth, day });
    } else {
      date = new Date(Date.UTC(adViewYear, adViewMonth - 1, day, 12, 0, 0));
    }
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  // Year options — 15 years back, 15 forward
  const bsYearOptions = Array.from({ length: 30 }, (_, i) => {
    const year = today.year - 15 + i;
    return { value: String(year), label: String(year) };
  });
  const adYearOptions = Array.from({ length: 30 }, (_, i) => {
    const year = todayAd.getFullYear() - 15 + i;
    return { value: String(year), label: String(year) };
  });

  const monthOptions = mode === 'bs'
    ? BS_MONTHS_EN.map((name, i) => ({ value: String(i + 1), label: name }))
    : AD_MONTHS_EN.map((name, i) => ({ value: String(i + 1), label: name }));

  const displayValue = value
    ? mode === 'bs'
      ? formatBsDate(adToBs(value))
      : formatAdDate(value)
    : '';

  const viewYear = mode === 'bs' ? bsViewYear : adViewYear;
  const viewMonth = mode === 'bs' ? bsViewMonth : adViewMonth;
  const setViewYear = mode === 'bs' ? setBsViewYear : setAdViewYear;
  const setViewMonth = mode === 'bs' ? setBsViewMonth : setAdViewMonth;
  const yearOptions = mode === 'bs' ? bsYearOptions : adYearOptions;

  return (
    <Popover
      opened={opened}
      onChange={setOpened}
      position="bottom-start"
      shadow="md"
      withinPortal
    >
      <Popover.Target>
        <TextInput
          label={label}
          description={description}
          placeholder={placeholder}
          value={displayValue}
          onClick={() => !disabled && setOpened(true)}
          readOnly
          required={required}
          error={error}
          disabled={disabled}
          rightSection={
            <ActionIcon
              variant="subtle"
              onClick={() => !disabled && setOpened(true)}
              disabled={disabled}
            >
              <IconCalendar size={16} />
            </ActionIcon>
          }
          styles={{ input: { cursor: disabled ? 'not-allowed' : 'pointer' } }}
        />
      </Popover.Target>

      <Popover.Dropdown p="sm" style={{ width: 320 }}>
        <Stack gap="sm">
          {showModeToggle && (
            <SegmentedControl
              value={mode}
              onChange={handleModeChange}
              data={[
                { label: 'नेपाली (BS)', value: 'bs' },
                { label: 'English (AD)', value: 'ad' },
              ]}
              size="xs"
              fullWidth
            />
          )}

          <Group justify="space-between" gap="xs">
            <ActionIcon variant="subtle" onClick={handlePrevMonth}>
              <IconChevronLeft size={16} />
            </ActionIcon>
            <Group gap="xs">
              <Select
                value={String(viewMonth)}
                onChange={(v) => v && setViewMonth(parseInt(v))}
                data={monthOptions}
                size="xs"
                w={100}
                allowDeselect={false}
              />
              <Select
                value={String(viewYear)}
                onChange={(v) => v && setViewYear(parseInt(v))}
                data={yearOptions}
                size="xs"
                w={80}
                allowDeselect={false}
              />
            </Group>
            <ActionIcon variant="subtle" onClick={handleNextMonth}>
              <IconChevronRight size={16} />
            </ActionIcon>
          </Group>

          <SimpleGrid cols={7} spacing={0}>
            {(mode === 'bs' ? WEEKDAYS_NP : WEEKDAYS_EN).map((day) => (
              <Text key={day} size="xs" fw={600} ta="center" c="dimmed" py={4}>
                {day}
              </Text>
            ))}
          </SimpleGrid>

          <Box>
            {calendarGrid.map((week, wi) => (
              <SimpleGrid key={wi} cols={7} spacing={0}>
                {week.map((day, di) => (
                  <Box key={di} style={{ display: 'flex', justifyContent: 'center', padding: 2 }}>
                    {day !== null ? (
                      <ActionIcon
                        variant={isSelected(day) ? 'filled' : isToday(day) ? 'light' : 'subtle'}
                        color={isSelected(day) ? 'red' : isToday(day) ? 'blue' : 'gray'}
                        size="md"
                        radius="xl"
                        onClick={() => handleSelectDay(day)}
                        disabled={isDisabled(day)}
                        style={{ fontWeight: isToday(day) ? 600 : 400 }}
                      >
                        {day}
                      </ActionIcon>
                    ) : (
                      <Box style={{ width: 28, height: 28 }} />
                    )}
                  </Box>
                ))}
              </SimpleGrid>
            ))}
          </Box>

          <Group justify="space-between" mt="xs">
            <Button variant="subtle" size="xs" onClick={handleToday}>Today</Button>
            {clearable && value && (
              <Button variant="subtle" size="xs" color="gray" onClick={handleClear}>Clear</Button>
            )}
          </Group>

          {value && (
            <Paper p="xs" bg="gray.0" radius="sm">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed">BS:</Text>
                  <Text size="sm" fw={500}>{formatBsDate(adToBs(value), 'full')}</Text>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Text size="xs" c="dimmed">AD:</Text>
                  <Text size="sm" fw={500}>{formatAdDate(value)}</Text>
                </div>
              </Group>
            </Paper>
          )}
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}

export function NepaliDateDisplay({
  date,
  format = 'both',
}: {
  date: Date;
  format?: 'bs' | 'ad' | 'both';
}) {
  const bs = adToBs(date);
  if (format === 'bs') return <span>{formatBsDate(bs)}</span>;
  if (format === 'ad') return <span>{formatAdDate(date)}</span>;
  return (
    <span>
      {formatBsDate(bs)} <Text component="span" size="xs" c="dimmed">({formatAdDate(date)})</Text>
    </span>
  );
}
