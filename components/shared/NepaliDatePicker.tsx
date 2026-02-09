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
  useMantineTheme,
} from '@mantine/core';
import { IconChevronLeft, IconChevronRight, IconCalendar } from '@tabler/icons-react';
import {
  NepaliDate,
  adToBs,
  bsToAd,
  formatBsDate,
  formatAdDate,
  getBsMonthCalendar,
  getDaysInBsMonth,
  BS_MONTHS_EN,
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
  const theme = useMantineTheme();
  const [opened, setOpened] = useState(false);
  const [mode, setMode] = useState<CalendarMode>('bs');
  
  // Current view state
  const today = getCurrentBsDate();
  const [viewYear, setViewYear] = useState(value ? adToBs(value).year : today.year);
  const [viewMonth, setViewMonth] = useState(value ? adToBs(value).month : today.month);
  
  // Selected date in BS
  const selectedBs = value ? adToBs(value) : null;

  // Reset view when value changes externally
  useEffect(() => {
    if (value) {
      const bs = adToBs(value);
      setViewYear(bs.year);
      setViewMonth(bs.month);
    }
  }, [value]);

  useEffect(() => {
    if (!showModeToggle && mode !== 'bs') {
      setMode('bs');
    }
  }, [showModeToggle, mode]);

  const handlePrevMonth = useCallback(() => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  }, [viewMonth]);

  const handleNextMonth = useCallback(() => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  }, [viewMonth]);

  const handleSelectDate = useCallback((day: number) => {
    const bs: NepaliDate = { year: viewYear, month: viewMonth, day };
    const ad = bsToAd(bs);
    
    // Check min/max constraints
    if (minDate && ad < minDate) return;
    if (maxDate && ad > maxDate) return;
    
    onChange?.(ad);
    setOpened(false);
  }, [viewYear, viewMonth, onChange, minDate, maxDate]);

  const handleClear = useCallback(() => {
    onChange?.(null);
    setOpened(false);
  }, [onChange]);

  const handleToday = useCallback(() => {
    const todayAd = new Date();
    const todayBs = adToBs(todayAd);
    setViewYear(todayBs.year);
    setViewMonth(todayBs.month);
    onChange?.(todayAd);
    setOpened(false);
  }, [onChange]);

  // Generate calendar grid
  const calendarGrid = getBsMonthCalendar(viewYear, viewMonth);

  // Check if a day is selected
  const isSelected = (day: number) => {
    return selectedBs?.year === viewYear && 
           selectedBs?.month === viewMonth && 
           selectedBs?.day === day;
  };

  // Check if a day is today
  const isToday = (day: number) => {
    return today.year === viewYear && 
           today.month === viewMonth && 
           today.day === day;
  };

  // Check if a day is disabled (out of range)
  const isDisabled = (day: number) => {
    const bs: NepaliDate = { year: viewYear, month: viewMonth, day };
    const ad = bsToAd(bs);
    if (minDate && ad < minDate) return true;
    if (maxDate && ad > maxDate) return true;
    return false;
  };

  // Year options for dropdown
  const yearOptions = Array.from({ length: 20 }, (_, i) => {
    const year = today.year - 10 + i;
    return { value: String(year), label: String(year) };
  });

  // Month options for dropdown
  const monthOptions = BS_MONTHS_EN.map((name, i) => ({
    value: String(i + 1),
    label: name,
  }));

  // Format display value
  const displayValue = value
    ? mode === 'bs'
      ? formatBsDate(adToBs(value))
      : formatAdDate(value)
    : '';

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
          styles={{
            input: { cursor: disabled ? 'not-allowed' : 'pointer' }
          }}
        />
      </Popover.Target>

      <Popover.Dropdown p="sm" style={{ width: 320 }}>
        <Stack gap="sm">
          {/* Calendar Mode Toggle */}
          {showModeToggle && (
            <SegmentedControl
              value={mode}
              onChange={(v) => setMode(v as CalendarMode)}
              data={[
                { label: 'नेपाली (BS)', value: 'bs' },
                { label: 'English (AD)', value: 'ad' },
              ]}
              size="xs"
              fullWidth
            />
          )}

          {/* Month/Year Navigation */}
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

          {/* Weekday Headers */}
          <SimpleGrid cols={7} spacing={0}>
            {(mode === 'bs' ? WEEKDAYS_NP : WEEKDAYS_EN).map((day) => (
              <Text 
                key={day} 
                size="xs" 
                fw={600} 
                ta="center" 
                c="dimmed"
                py={4}
              >
                {day}
              </Text>
            ))}
          </SimpleGrid>

          {/* Calendar Grid */}
          <Box>
            {calendarGrid.map((week, weekIndex) => (
              <SimpleGrid key={weekIndex} cols={7} spacing={0}>
                {week.map((day, dayIndex) => (
                  <Box 
                    key={dayIndex}
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'center',
                      padding: 2 
                    }}
                  >
                    {day !== null ? (
                      <ActionIcon
                        variant={isSelected(day) ? 'filled' : isToday(day) ? 'light' : 'subtle'}
                        color={isSelected(day) ? 'red' : isToday(day) ? 'blue' : 'gray'}
                        size="md"
                        radius="xl"
                        onClick={() => handleSelectDate(day)}
                        disabled={isDisabled(day)}
                        style={{
                          fontWeight: isToday(day) ? 600 : 400,
                        }}
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

          {/* Footer Actions */}
          <Group justify="space-between" mt="xs">
            <Button variant="subtle" size="xs" onClick={handleToday}>
              Today
            </Button>
            {clearable && value && (
              <Button variant="subtle" size="xs" color="gray" onClick={handleClear}>
                Clear
              </Button>
            )}
          </Group>

          {/* Display Both Dates */}
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

// Export a simpler inline display component
export function NepaliDateDisplay({ 
  date, 
  format = 'both' 
}: { 
  date: Date; 
  format?: 'bs' | 'ad' | 'both' 
}) {
  const bs = adToBs(date);
  
  if (format === 'bs') {
    return <span>{formatBsDate(bs)}</span>;
  }
  
  if (format === 'ad') {
    return <span>{formatAdDate(date)}</span>;
  }
  
  return (
    <span>
      {formatBsDate(bs)} <Text component="span" size="xs" c="dimmed">({formatAdDate(date)})</Text>
    </span>
  );
}
