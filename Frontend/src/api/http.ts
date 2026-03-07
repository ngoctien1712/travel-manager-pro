// HTTP wrapper for API calls
// Replace baseURL and implement real API calls when backend is ready

const API_BASE_URL = '/api'; // Replace with your actual API URL

interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
  isRetry?: boolean;
}

class HttpClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  private async refreshToken(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${this.baseURL}/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) throw new Error('Refresh failed');

      const data = await response.json();
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userRole');
      window.location.href = '/login'; // Redirect to login
      return false;
    }
  }

  private async request<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    const { method = 'GET', headers = {}, body } = config;

    const token = this.getAccessToken();
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const isFormData = body instanceof FormData;
    if (isFormData) {
      delete defaultHeaders['Content-Type'];
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method,
      headers: { ...defaultHeaders, ...headers },
      body: isFormData ? (body as any) : (body ? JSON.stringify(body) : undefined),
    });

    if (response.status === 401 && !config.isRetry && !endpoint.includes('/auth/login')) {
      const refreshed = await this.refreshToken();
      if (refreshed) {
        return this.request<T>(endpoint, { ...config, isRetry: true });
      }
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const msg = (data as { message?: string })?.message ?? `Lỗi: ${response.status}`;
      throw new Error(msg);
    }

    return data as T;
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body });
  }

  async put<T>(endpoint: string, body: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body });
  }

  async patch<T>(endpoint: string, body: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'PATCH', body });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const httpClient = new HttpClient(API_BASE_URL);

// Utility to simulate API delay (for mock implementations)
export const delay = (ms: number = 400): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, 300 + Math.random() * ms));

// Helper for paginated responses
export const paginate = <T>(
  items: T[],
  page: number = 1,
  pageSize: number = 10
): { data: T[]; total: number; page: number; pageSize: number; totalPages: number } => {
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const data = items.slice(start, end);

  return {
    data,
    total: items.length,
    page,
    pageSize,
    totalPages: Math.ceil(items.length / pageSize),
  };
};

// Helper for filtering
export const filterBySearch = <T>(
  items: T[],
  search: string,
  fields: (keyof T & string)[]
): T[] => {
  if (!search) return items;
  const searchLower = search.toLowerCase();
  return items.filter(item =>
    fields.some(field => {
      const value = (item as Record<string, unknown>)[field];
      return typeof value === 'string' && value.toLowerCase().includes(searchLower);
    })
  );
};

// Helper for sorting
export const sortBy = <T>(
  items: T[],
  field: keyof T,
  order: 'asc' | 'desc' = 'asc'
): T[] => {
  return [...items].sort((a, b) => {
    const aVal = a[field];
    const bVal = b[field];
    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
};