// src/api.js
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export async function loginRequest(username, password) {
  const data = new URLSearchParams();
  data.append('username', username);
  data.append('password', password);
  const res = await api.post('/auth/login', data);
  return res.data;
}

export function setToken(token) {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
}

// Users
export const getUsers = (params = {}) =>
  api.get('/users', { params }).then((r) => {
    const data = r.data;

    // If backend returns plain array
    if (Array.isArray(data)) {
      
      return {
        data,
        total: data.length,
      };
    }

    // If backend returns { users: [...], total: number }
    return {
      data: data.users || [],
      total: data.total || (data.users?.length ?? 0),
    };
  });

export const getUserById = (userId) => api.get(`/users/${userId}`).then((r) => r.data);
export const createUser = (userData) => api.post('/users', userData).then((r) => r.data);
export const updateUser = (userId, userData) => api.put(`/users/${userId}`, userData).then((r) => r.data);
export const deleteUser = (userId) => api.delete(`/users/${userId}`).then((r) => r.data);

// Roles
export const getRoles = () =>
  api.get('/users/roles').then((r) => r.data);

export const createRole = (roleData) => api.post('/users/roles', roleData).then((r) => r.data);
export const updateRole = (roleId, roleData) => api.put(`/users/roles/${roleId}`, roleData).then((r) => r.data);
export const deleteRole = (roleId) => api.delete(`/users/roles/${roleId}`).then((r) => r.data);

// Apartments
export const getApartments = (params = {}) => api.get('/apartments', { params }).then((r) => r.data);
export const getApartmentById = (id) => api.get(`/apartments/${id}`).then((r) => r.data);
export const createApartment = (data) => api.post('/apartments', data).then((r) => r.data);
export const updateApartment = (id, data) => api.put(`/apartments/${id}`, data).then((r) => r.data);
export const deleteApartment = (id) => api.delete(`/apartments/${id}`).then((r) => r.data);

// Tenants
export const getTenants = (params = {}) => api.get('/tenants', { params }).then((r) => r.data);
export const getTenantById = (id) => api.get(`/tenants/${id}`).then((r) => r.data);
export const createTenant = (data) => api.post('/tenants', data).then((r) => r.data);
export const updateTenant = (id, data) => api.put(`/tenants/${id}`, data).then((r) => r.data);
export const deleteTenant = (id) => api.delete(`/tenants/${id}`).then((r) => r.data);

// Rentals
export const getRentals = (params = {}) => api.get('/rentals', { params }).then((r) => r.data);
export const getRentalById = (id) => api.get(`/rentals/${id}`).then((r) => r.data);
export const createRental = (data) => api.post('/rentals', data).then((r) => r.data);
export const updateRental = (id, data) => api.put(`/rentals/${id}`, data).then((r) => r.data);
export const deleteRental = (id) => api.delete(`/rentals/${id}`).then((r) => r.data);

// Payments
export const getPayments = () => api.get('/payments').then(r => r.data);
export const createPayment = (data) => api.post('/payments', data).then(r => r.data);
export const updatePayment = (id, data) => api.put(`/payments/${id}`, data).then(r => r.data);
export const deletePayment = (id) => api.delete(`/payments/${id}`).then(r => r.data);


// Maintenance
export const getMaintenanceRequests = () =>
  api.get('/maintenance').then(r => r.data);

export const createMaintenanceRequest = (data) =>
  api.post('/maintenance', data).then(r => r.data);

export const updateMaintenanceRequest = (id, data) =>
  api.put(`/maintenance/${id}`, data).then(r => r.data);

export const deleteMaintenanceRequest = (id) =>
  api.delete(`/maintenance/${id}`).then(r => r.data);


export default api;