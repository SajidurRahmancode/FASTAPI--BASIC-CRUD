import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Fixed: Updated interfaces to match your database schema
export interface User {
  user_id: number;  // Changed from 'id' to 'user_id' to match database
  email: string;    // Removed optional '?' since email is required
  password: string; // Added password field from your database
}

export interface UserFormData {
  email: string;    // Changed from 'name' to 'email' to match your database
  password: string; // Changed from 'name' to 'password' to match your database
}

const api = {
  // Get all users
  getUsers: async (): Promise<User[]> => {
    const response = await apiClient.get('/users');
    return response.data;
  },

  // Get a single user by ID - Fixed: parameter name changed for clarity
  getUser: async (user_id: number): Promise<User> => {
    const response = await apiClient.get(`/users/${user_id}`);
    return response.data;
  },

  // Create a new user - Fixed: userData now contains email and password
  createUser: async (userData: UserFormData): Promise<User> => {
    const response = await apiClient.post('/users', userData);
    return response.data;
  },

  // Update an existing user - Fixed: parameter names updated for consistency
  updateUser: async (user_id: number, userData: UserFormData): Promise<User> => {
    const response = await apiClient.put(`/users/${user_id}`, userData);
    return response.data;
  },

  // Delete a user - Fixed: parameter name changed for clarity
  deleteUser: async (user_id: number): Promise<void> => {
    await apiClient.delete(`/users/${user_id}`);
  },
};

export default api;