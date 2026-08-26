import { api } from './client';

export const itemsApi = {
  list: (params) => api.get('/items', { params }).then((r) => r.data),
  getOne: (id) => api.get(`/items/${id}`).then((r) => r.data.item),
  checkAvailability: (id, eventDate, returnDate) =>
    api.get(`/items/${id}/availability`, { params: { eventDate, returnDate } }).then((r) => r.data),
  create: (payload) => api.post('/items', payload).then((r) => r.data.item),
  update: (id, payload) => api.put(`/items/${id}`, payload).then((r) => r.data.item),
  remove: (id) => api.delete(`/items/${id}`),
};
