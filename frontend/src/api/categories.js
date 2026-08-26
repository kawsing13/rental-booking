import { api } from './client';

export const categoriesApi = {
  list: () => api.get('/categories').then((r) => r.data.categories),
  create: (payload) => api.post('/categories', payload).then((r) => r.data.category),
  update: (id, payload) => api.put(`/categories/${id}`, payload).then((r) => r.data.category),
  remove: (id) => api.delete(`/categories/${id}`),
};
