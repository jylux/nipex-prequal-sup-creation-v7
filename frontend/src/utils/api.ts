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
  
  // In your api.ts file
exportToExcel: async (companies: any[], bidderStartNumber: string ) => {
  const response = await api.post('/companies/export/excel', {
    companies,
    bidderStartNumber
  }, {
    responseType: 'blob'
  });
  
  // Create download link
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
  
exportToText: async (companies: any[], bidderStartNumber?: string) => {
  const response = await api.post('/companies/export/text', {
    companies,
    bidderStartNumber
  }, {
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
// Cache to avoid repeated calls for the same address
const addressCache = new Map<string, { town: string, display_name: string }>();

export const searchAddress = async (address: string) => {
  if (!address) return { town: 'LAGOS', display_name: '' };
  
  // Check cache first
  const cachedResult = addressCache.get(address);
  if (cachedResult) {
    console.log('Using cached result for address:', address);
    return cachedResult;
  }
  
  try {
    // Split the address and reverse it to prioritize city names
    const addressParts = address.split(',').map(part => part.trim()).reverse();
    
    for (const part of addressParts) {
      // Skip very short parts
      if (part.length < 3) continue;
      
      const cleanPart = encodeURIComponent(`${part}, Nigeria`);
      const apiUrl = `https://nominatim.openstreetmap.org/search?q=${cleanPart}&format=json&countrycodes=ng&addressdetails=1&limit=1`;
      
      console.log('Trying address part:', part);
      
      // Add small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'NipexJQS/1.0',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) continue;
      
      const data = await response.json();
      console.log('API response for part:', part, data);
      
      if (data && data.length > 0 && data[0].address) {
        const result = data[0].address;
        
        // Check for all possible town/city indicators
        const town = result.city || 
                     result.town || 
                     result.municipality ||
                     result.state_district ||
                     result.suburb;
        
        if (town) {
          console.log('Found town:', town);
          const townResult = { 
            town: town.toUpperCase(), 
            display_name: data[0].display_name 
          };
          
          // Save to cache
          addressCache.set(address, townResult);
          return townResult;
        }
      }
    }
    
    // Default to LAGOS if no town found
    const defaultResult = { town: 'LAGOS', display_name: address };
    addressCache.set(address, defaultResult);
    return defaultResult;
    
  } catch (error) {
    console.error('Error parsing address:', error);
    return { town: 'LAGOS', display_name: address };
  }
};
// In your api.ts file

insertCompanies: async (companies: any[]) => {
  try {
    const response = await api.post('/companies/insert', companies);
    return response.data; // Return the full response with duplicate details
  } catch (error) {
    console.error('Error inserting companies:', error);
    throw error;
  }
}