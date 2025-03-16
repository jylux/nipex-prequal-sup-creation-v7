// frontend/src/utils/api.ts
import axios from 'axios';

/**
 * A preconfigured Axios instance for the Express backend.
 * Adjust `baseURL` if your API runs on a different host or port.
 */
export const api = axios.create({
  baseURL: 'http://localhost:4000/api',
  withCredentials: true // allows sending/receiving HTTP-only cookies
});

// Optional: attach request/response interceptors if you want to handle errors or tokens globally
/*
api.interceptors.request.use(
  (config) => {
    // e.g., attach authorization headers if needed
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // e.g., handle common error scenarios
    return Promise.reject(error);
  }
);
*/
