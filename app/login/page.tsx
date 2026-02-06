"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Paper,
  Title,
  Text,
  TextInput,
  PasswordInput,
  Button,
  Stack,
  Center,
  Box,
  Alert,
  Group,
  ThemeIcon,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import {
  IconAlertCircle,
  IconLock,
  IconMail,
  IconShield,
} from "@tabler/icons-react";
import { useAuth } from "@/lib/auth-context";

interface LoginFormValues {
  email: string;
  password: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LoginFormValues>({
    initialValues: {
      email: "",
      password: "",
    },
    validate: {
      email: (value) => {
        if (!value) return "Email is required";
        if (!/^\S+@\S+\.\S+$/.test(value)) return "Invalid email format";
        return null;
      },
      password: (value) => {
        if (!value) return "Password is required";
        return null;
      },
    },
  });

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (values: LoginFormValues) => {
    setError(null);
    setIsSubmitting(true);

    try {
      await login(values);
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <Center h="100vh" bg="#fef2f2">
        <Text>Loading...</Text>
      </Center>
    );
  }

  return (
    <Box
      style={{
        minHeight: "100vh",
        display: "flex",
      }}
    >
      {/* Left Side - Branding */}
      <Box
        style={{
          flex: "1 1 50%",
          background:
            "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "48px",
          position: "relative",
          overflow: "hidden",
        }}
        visibleFrom="md"
      >
        {/* Decorative elements */}
        <Box
          style={{
            position: "absolute",
            top: "-10%",
            right: "-10%",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "rgba(229, 57, 53, 0.1)",
          }}
        />
        <Box
          style={{
            position: "absolute",
            bottom: "-15%",
            left: "-10%",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "rgba(229, 57, 53, 0.05)",
          }}
        />

        <Stack
          align="center"
          gap="xl"
          style={{ position: "relative", zIndex: 1 }}
        >
          <ThemeIcon size={100} radius="xl" color="red" variant="filled">
            <IconShield size={50} />
          </ThemeIcon>
          <Title
            order={1}
            c="white"
            style={{ fontSize: "3rem", fontWeight: 700, letterSpacing: "-1px" }}
          >
            Admin Portal
          </Title>
          <Text c="rgba(255,255,255,0.7)" size="xl" ta="center" maw={400}>
            रातो खाता Super Admin Dashboard
          </Text>
          <Box
            style={{
              width: "60px",
              height: "4px",
              background: "#e53935",
              borderRadius: "2px",
            }}
          />
          <Stack gap="md" mt="xl">
            <Group gap="sm">
              <Box
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#e53935",
                }}
              />
              <Text c="rgba(255,255,255,0.7)" size="sm">
                Manage all tenants & users
              </Text>
            </Group>
            <Group gap="sm">
              <Box
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#e53935",
                }}
              />
              <Text c="rgba(255,255,255,0.7)" size="sm">
                Review registration requests
              </Text>
            </Group>
            <Group gap="sm">
              <Box
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#e53935",
                }}
              />
              <Text c="rgba(255,255,255,0.7)" size="sm">
                Control features & subscriptions
              </Text>
            </Group>
          </Stack>
        </Stack>
      </Box>

      {/* Right Side - Form */}
      <Box
        style={{
          flex: "1 1 50%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "48px 24px",
          background:
            "linear-gradient(180deg, #f8f9fa 0%, #ffffff 50%, #f8f9fa 100%)",
          minHeight: "100vh",
        }}
      >
        <Box style={{ width: "100%", maxWidth: "440px" }}>
          {/* Mobile Logo */}
          <Center mb="xl" hiddenFrom="md">
            <Stack gap="xs" align="center">
              <ThemeIcon size={60} radius="xl" color="red">
                <IconShield size={30} />
              </ThemeIcon>
              <Title order={2} c="dark">
                Admin Portal
              </Title>
            </Stack>
          </Center>

          <Paper
            radius="lg"
            p={{ base: "xl", sm: "40px" }}
            shadow="md"
            style={{
              background: "white",
              border: "1px solid #e9ecef",
            }}
          >
            <Stack gap="xs" mb="xl">
              <Title order={2} ta="center" c="gray.8">
                Welcome Back
              </Title>
              <Text c="dimmed" size="sm" ta="center">
                Sign in with your super admin credentials
              </Text>
            </Stack>

            {error && (
              <Alert
                icon={<IconAlertCircle size={16} />}
                color="red"
                mb="lg"
                variant="light"
                radius="md"
              >
                {error}
              </Alert>
            )}

            <form onSubmit={form.onSubmit(handleSubmit)}>
              <Stack gap="md">
                <TextInput
                  label="Email Address"
                  placeholder="admin@ratokhata.com"
                  required
                  size="md"
                  radius="md"
                  leftSection={<IconMail size={18} color="#868e96" />}
                  {...form.getInputProps("email")}
                />

                <PasswordInput
                  label="Password"
                  placeholder="Enter your password"
                  required
                  size="md"
                  radius="md"
                  leftSection={<IconLock size={18} color="#868e96" />}
                  {...form.getInputProps("password")}
                />

                <Button
                  type="submit"
                  fullWidth
                  mt="md"
                  loading={isSubmitting}
                  size="lg"
                  radius="md"
                  color="red"
                >
                  Sign In to Admin
                </Button>
              </Stack>
            </form>
          </Paper>

          <Text c="dimmed" size="xs" ta="center" mt="xl">
            © {new Date().getFullYear()} Rato Khata. Super Admin Access Only.
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
