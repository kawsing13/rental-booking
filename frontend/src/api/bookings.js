import { api } from './client';

export const bookingsApi = {
  create: (payload) => api.post('/bookings', payload).then((r) => r.data.booking),
  listMine: () => api.get('/bookings/mine').then((r) => r.data.bookings),
  listAll: (status) => api.get('/bookings', { params: { status } }).then((r) => r.data.bookings),
  getOne: (id) => api.get(`/bookings/${id}`).then((r) => r.data.booking),
  updateStatus: (id, status) => api.put(`/bookings/${id}/status`, { status }).then((r) => r.data.booking),
  cancel: (id) => api.put(`/bookings/${id}/cancel`).then((r) => r.data.booking),
};
