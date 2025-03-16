// frontend/src/utils/api.ts
import axios from 'axios';

// Create a base API instance
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
  withCredentials: true, // Important for sending/receiving cookies
  timeout: 10000 // 10 seconds timeout
});

// Add a request interceptor to attach JWT token from localStorage if available
// This serves as a fallback if cookies aren't working
api.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle authentication errors
    if (error.response && error.response.status === 401) {
      // Clear any stored tokens
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        
        // Optional: Redirect to login page if not already there
        if (window.location.pathname !== '/') {
          window.location.href = '/';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// API functions for authentication
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    
    // Store token in localStorage if returned by the API
    if (response.data && response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    
    return response.data;
  },
  
  logout: async () => {
    const response = await api.post('/auth/logout');
    localStorage.removeItem('token');
    return response.data;
  },
  
  checkAuth: async () => {
    try {
      const response = await api.get('/auth/check');
      return { authenticated: true, user: response.data.user };
    } catch (error) {
      return { authenticated: false, user: null };
    }
  }
};

// API functions for company-related operations
export const companyApi = {
  searchCompanies: async (query: string) => {
    const response = await api.get(`/companies/search?query=${encodeURIComponent(query)}`);
    return response.data;
  },
  
  exportToExcel: async (companies: any[]) => {
    const response = await api.post('/companies/export/excel', companies, {
      responseType: 'blob'
    });
    
    // Create and trigger download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'suppliers.xlsx');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return true;
  },
  
  exportToText: async (companies: any[]) => {
    const response = await api.post('/companies/export/text', companies, {
      responseType: 'blob'
    });
    
    // Create and trigger download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'suppliers.txt');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return true;
  },
  
  insertCompanies: async (companies: any[]) => {
    const response = await api.post('/companies/insert', companies);
    return response.data;
  }
};

// OpenStreetMap address parsing
export const searchAddress = async (address: string) => {
  if (!address) return null;
  
  try {
    // Use Nominatim API directly from the frontend
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`,
      {
        headers: {
          'User-Agent': 'NipexJQS/1.0'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch address data');
    }
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      const parts = data[0].display_name.split(', ');
      
      return {
        town: parts.length >= 2 ? parts[1] : (parts.length === 1 ? parts[0] : 'Unknown'),
        display_name: data[0].display_name,
        lat: data[0].lat,
        lon: data[0].lon
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing address:', error);
    return null;
  }
};

