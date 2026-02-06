'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  AppShell,
  NavLink,
  Group,
  Title,
  Text,
  Box,
  Stack,
  Avatar,
  Menu,
  UnstyledButton,
  Divider,
  ThemeIcon,
  Center,
  Loader,
} from '@mantine/core';
import {
  IconDashboard,
  IconBuilding,
  IconUserPlus,
  IconSettings,
  IconLogout,
  IconChevronRight,
  IconShield,
} from '@tabler/icons-react';
import { useAuth } from '@/lib/auth-context';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: IconDashboard },
  { href: '/dashboard/registrations', label: 'Registrations', icon: IconUserPlus },
  { href: '/dashboard/tenants', label: 'Tenants', icon: IconBuilding },
  { href: '/dashboard/settings', label: 'Settings', icon: IconSettings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (isLoading) {
    return (
      <Center h="100vh">
        <Loader color="red" size="lg" />
      </Center>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AppShell
      navbar={{
        width: 280,
        breakpoint: 'sm',
      }}
      padding="md"
    >
      <AppShell.Navbar p="md" style={{ background: '#1a1a2e' }}>
        {/* Logo */}
        <Box mb="xl" pt="xs">
          <Group gap="sm">
            <ThemeIcon size={40} radius="md" color="red">
              <IconShield size={24} />
            </ThemeIcon>
            <Stack gap={0}>
              <Title order={4} c="white">
                रातो खाता
              </Title>
              <Text size="xs" c="dimmed">
                Admin Portal
              </Text>
            </Stack>
          </Group>
        </Box>

        <Divider color="dark.4" mb="md" />

        {/* Navigation */}
        <Stack gap="xs" style={{ flex: 1 }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/dashboard' && pathname.startsWith(item.href));
            
            return (
              <NavLink
                key={item.href}
                href={item.href}
                label={item.label}
                leftSection={<item.icon size={20} />}
                rightSection={<IconChevronRight size={14} />}
                active={isActive}
                onClick={(e) => {
                  e.preventDefault();
                  router.push(item.href);
                }}
                styles={{
                  root: {
                    borderRadius: 8,
                    color: isActive ? 'white' : 'rgba(255,255,255,0.7)',
                    backgroundColor: isActive ? 'rgba(229, 57, 53, 0.2)' : 'transparent',
                    '&:hover': {
                      backgroundColor: isActive 
                        ? 'rgba(229, 57, 53, 0.3)' 
                        : 'rgba(255,255,255,0.05)',
                    },
                  },
                  label: {
                    fontWeight: isActive ? 600 : 400,
                  },
                }}
              />
            );
          })}
        </Stack>

        <Divider color="dark.4" my="md" />

        {/* User Menu */}
        <Menu position="top-start" width={240}>
          <Menu.Target>
            <UnstyledButton
              style={{
                padding: '12px',
                borderRadius: 8,
                background: 'rgba(255,255,255,0.05)',
                width: '100%',
              }}
            >
              <Group>
                <Avatar color="red" radius="xl" size="md">
                  {user?.name?.charAt(0).toUpperCase()}
                </Avatar>
                <Box style={{ flex: 1 }}>
                  <Text size="sm" fw={500} c="white">
                    {user?.name}
                  </Text>
                  <Text size="xs" c="dimmed">
                    Super Admin
                  </Text>
                </Box>
              </Group>
            </UnstyledButton>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Label>Account</Menu.Label>
            <Menu.Item leftSection={<IconSettings size={16} />}>
              Settings
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item
              color="red"
              leftSection={<IconLogout size={16} />}
              onClick={handleLogout}
            >
              Logout
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </AppShell.Navbar>

      <AppShell.Main style={{ background: '#f8f9fa' }}>
        {children}
      </AppShell.Main>
    </AppShell>
  );
}
