'use client';

import { useState } from 'react';
import {
  Title,
  Text,
  Paper,
  Group,
  Stack,
  Box,
  TextInput,
  Button,
  Divider,
  PasswordInput,
  Card,
  ThemeIcon,
  Alert,
  Switch,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
  IconUser,
  IconLock,
  IconMail,
  IconShield,
  IconBell,
  IconInfoCircle,
} from '@tabler/icons-react';
import { useAuth } from '@/lib/auth-context';
import { apiPut } from '@/lib/api';

export default function SettingsPage() {
  const { user } = useAuth();
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const profileForm = useForm({
    initialValues: {
      name: user?.name || '',
      email: user?.email || '',
    },
    validate: {
      name: (value) => (value.length < 2 ? 'Name is too short' : null),
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
    },
  });

  const passwordForm = useForm({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validate: {
      currentPassword: (value) =>
        value.length < 6 ? 'Password must be at least 6 characters' : null,
      newPassword: (value) =>
        value.length < 6 ? 'Password must be at least 6 characters' : null,
      confirmPassword: (value, values) =>
        value !== values.newPassword ? 'Passwords do not match' : null,
    },
  });

  const handleProfileUpdate = async (values: typeof profileForm.values) => {
    setIsUpdatingProfile(true);
    try {
      await apiPut('/auth/profile', values);
      notifications.show({
        title: 'Success',
        message: 'Profile updated successfully',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to update profile',
        color: 'red',
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordUpdate = async (values: typeof passwordForm.values) => {
    setIsUpdatingPassword(true);
    try {
      await apiPut('/auth/password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      notifications.show({
        title: 'Success',
        message: 'Password updated successfully',
        color: 'green',
      });
      passwordForm.reset();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to update password',
        color: 'red',
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <Box>
      <Group justify="space-between" mb="xl">
        <Stack gap={0}>
          <Title order={2}>Settings</Title>
          <Text c="dimmed" size="sm">
            Manage your admin account settings
          </Text>
        </Stack>
      </Group>

      <Stack gap="xl">
        {/* Profile Settings */}
        <Paper radius="md" shadow="sm" p="lg">
          <Group mb="lg">
            <ThemeIcon size="lg" radius="md" color="blue" variant="light">
              <IconUser size={20} />
            </ThemeIcon>
            <Box>
              <Title order={4}>Profile Information</Title>
              <Text size="sm" c="dimmed">
                Update your account profile details
              </Text>
            </Box>
          </Group>

          <form onSubmit={profileForm.onSubmit(handleProfileUpdate)}>
            <Stack gap="md">
              <TextInput
                label="Full Name"
                placeholder="Your name"
                leftSection={<IconUser size={16} />}
                {...profileForm.getInputProps('name')}
              />

              <TextInput
                label="Email Address"
                placeholder="your@email.com"
                leftSection={<IconMail size={16} />}
                {...profileForm.getInputProps('email')}
              />

              <Group justify="flex-end" mt="sm">
                <Button type="submit" loading={isUpdatingProfile}>
                  Save Changes
                </Button>
              </Group>
            </Stack>
          </form>
        </Paper>

        {/* Password Settings */}
        <Paper radius="md" shadow="sm" p="lg">
          <Group mb="lg">
            <ThemeIcon size="lg" radius="md" color="orange" variant="light">
              <IconLock size={20} />
            </ThemeIcon>
            <Box>
              <Title order={4}>Change Password</Title>
              <Text size="sm" c="dimmed">
                Update your account password
              </Text>
            </Box>
          </Group>

          <form onSubmit={passwordForm.onSubmit(handlePasswordUpdate)}>
            <Stack gap="md">
              <PasswordInput
                label="Current Password"
                placeholder="Enter current password"
                leftSection={<IconLock size={16} />}
                {...passwordForm.getInputProps('currentPassword')}
              />

              <PasswordInput
                label="New Password"
                placeholder="Enter new password"
                leftSection={<IconLock size={16} />}
                {...passwordForm.getInputProps('newPassword')}
              />

              <PasswordInput
                label="Confirm New Password"
                placeholder="Confirm new password"
                leftSection={<IconLock size={16} />}
                {...passwordForm.getInputProps('confirmPassword')}
              />

              <Group justify="flex-end" mt="sm">
                <Button type="submit" color="orange" loading={isUpdatingPassword}>
                  Update Password
                </Button>
              </Group>
            </Stack>
          </form>
        </Paper>

        {/* Account Info */}
        <Paper radius="md" shadow="sm" p="lg">
          <Group mb="lg">
            <ThemeIcon size="lg" radius="md" color="green" variant="light">
              <IconShield size={20} />
            </ThemeIcon>
            <Box>
              <Title order={4}>Account Information</Title>
              <Text size="sm" c="dimmed">
                Your admin account details
              </Text>
            </Box>
          </Group>

          <Stack gap="md">
            <Group grow>
              <Box>
                <Text size="xs" c="dimmed" mb={4}>
                  Account Type
                </Text>
                <Text size="sm" fw={500}>
                  Super Administrator
                </Text>
              </Box>
              <Box>
                <Text size="xs" c="dimmed" mb={4}>
                  User ID
                </Text>
                <Text size="sm" fw={500}>
                  {user?.id || '-'}
                </Text>
              </Box>
            </Group>

            <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
              You have full administrative access to manage all tenants, users, and
              system settings.
            </Alert>
          </Stack>
        </Paper>

        {/* Notification Settings */}
        <Paper radius="md" shadow="sm" p="lg">
          <Group mb="lg">
            <ThemeIcon size="lg" radius="md" color="violet" variant="light">
              <IconBell size={20} />
            </ThemeIcon>
            <Box>
              <Title order={4}>Notification Preferences</Title>
              <Text size="sm" c="dimmed">
                Configure how you receive notifications
              </Text>
            </Box>
          </Group>

          <Stack gap="md">
            <Card withBorder padding="sm">
              <Group justify="space-between">
                <Box>
                  <Text size="sm" fw={500}>
                    New Registration Alerts
                  </Text>
                  <Text size="xs" c="dimmed">
                    Receive email when a new registration request is submitted
                  </Text>
                </Box>
                <Switch defaultChecked color="blue" />
              </Group>
            </Card>

            <Card withBorder padding="sm">
              <Group justify="space-between">
                <Box>
                  <Text size="sm" fw={500}>
                    Subscription Expiry Warnings
                  </Text>
                  <Text size="xs" c="dimmed">
                    Receive alerts before tenant subscriptions expire
                  </Text>
                </Box>
                <Switch defaultChecked color="blue" />
              </Group>
            </Card>

            <Card withBorder padding="sm">
              <Group justify="space-between">
                <Box>
                  <Text size="sm" fw={500}>
                    System Health Alerts
                  </Text>
                  <Text size="xs" c="dimmed">
                    Receive notifications about system issues or downtime
                  </Text>
                </Box>
                <Switch defaultChecked color="blue" />
              </Group>
            </Card>
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
}
