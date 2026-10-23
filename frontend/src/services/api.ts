import type { Booking, Client, Dashboard } from '../types'
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) } })
  if (!response.ok) {
    let message = `Помилка запиту (${response.status})`
    try { const body = await response.json(); message = body.detail || message } catch { /* no JSON response */ }
    throw new Error(message)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}
export const api = {
  dashboard: () => request<Dashboard>('/dashboard'),
  clients: (q = '') => request<Client[]>(`/clients${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  createClient: (payload: Omit<Client, 'id' | 'created_at'>) => request<Client>('/clients', { method: 'POST', body: JSON.stringify(payload) }),
  updateClient: (id: number, payload: Omit<Client, 'id' | 'created_at'>) => request<Client>(`/clients/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteClient: (id: number) => request<void>(`/clients/${id}`, { method: 'DELETE' }),
  bookings: () => request<Booking[]>('/bookings'),
  createBooking: (payload: Omit<Booking, 'id' | 'client_name'>) => request<Booking>('/bookings', { method: 'POST', body: JSON.stringify(payload) }),
  updateBooking: (id: number, payload: Partial<Booking>) => request<Booking>(`/bookings/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteBooking: (id: number) => request<void>(`/bookings/${id}`, { method: 'DELETE' }),
}
