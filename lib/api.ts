import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

function processQueue(error: Error | null) {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve();
    }
  });
  failedQueue = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    const isAuthEndpoint = originalRequest.url?.includes("/auth/");
    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      isAuthEndpoint
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(() => apiClient(originalRequest));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      await apiClient.post("/auth/refresh");
      processQueue(null);
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError as Error);
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export interface ApiResponse<T> {
  status: boolean;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  status: false;
  message: string;
  errors?: Record<string, string[]>;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function handleAxiosError(error: unknown): never {
  if (axios.isAxiosError(error)) {
    const response = error.response?.data as ApiErrorResponse | undefined;
    throw new ApiError(
      error.response?.status || 500,
      response?.message || error.message,
      response?.errors,
    );
  }
  throw error;
}

export async function apiGet<T>(path: string): Promise<T> {
  try {
    const response = await apiClient.get<ApiResponse<T>>(path);
    return response.data.data;
  } catch (error) {
    throw handleAxiosError(error);
  }
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  try {
    const response = await apiClient.post<ApiResponse<T>>(path, body);
    return response.data.data;
  } catch (error) {
    throw handleAxiosError(error);
  }
}

export async function apiPut<T>(path: string, body?: unknown): Promise<T> {
  try {
    const response = await apiClient.put<ApiResponse<T>>(path, body);
    return response.data.data;
  } catch (error) {
    throw handleAxiosError(error);
  }
}

export async function apiDelete<T>(path: string): Promise<T> {
  try {
    const response = await apiClient.delete<ApiResponse<T>>(path);
    return response.data.data;
  } catch (error) {
    throw handleAxiosError(error);
  }
}
