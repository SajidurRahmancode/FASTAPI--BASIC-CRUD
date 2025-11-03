import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, clear storage and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication interfaces
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user_id: number;
  email: string;
}

// User interfaces (updated to match database schema)
export interface User {
  user_id: number;  // Changed from 'id' to 'user_id' to match database
  email: string;    // Removed optional '?' since email is required
  password?: string; // Made optional for responses (should not be returned)
}

export interface UserResponse {
  user_id: number;
  email: string;
}

export interface UserFormData {
  email: string;    // Changed from 'name' to 'email' to match your database
  password: string; // Changed from 'name' to 'password' to match your database
}

const api = {
  // Authentication endpoints
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post('/login', credentials);
    return response.data;
  },

  register: async (userData: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient.post('/register', userData);
    return response.data;
  },

  getCurrentUser: async (): Promise<UserResponse> => {
    const response = await apiClient.get('/me');
    return response.data;
  },

  // Protected CRUD endpoints (require authentication)
  getUsers: async (): Promise<UserResponse[]> => {
    const response = await apiClient.get('/users');
    return response.data;
  },

  getUser: async (user_id: number): Promise<UserResponse> => {
    const response = await apiClient.get(`/users/${user_id}`);
    return response.data;
  },

  createUser: async (userData: UserFormData): Promise<UserResponse> => {
    const response = await apiClient.post('/users', userData);
    return response.data;
  },

  updateUser: async (user_id: number, userData: UserFormData): Promise<UserResponse> => {
    const response = await apiClient.put(`/users/${user_id}`, userData);
    return response.data;
  },

  deleteUser: async (user_id: number): Promise<void> => {
    await apiClient.delete(`/users/${user_id}`);
  },

  // AI prediction endpoint
  predict: async (payload: any): Promise<any> => {
    const response = await apiClient.post('/predict', payload);
    return response.data;
  },

  // Utility functions
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('token');
  },

  logout: (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  getStoredUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
};

export default api;