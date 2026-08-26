import { api } from './client';

export const notificationsApi = {
  listMine: () => api.get('/notifications/mine').then((r) => r.data.notifications),
  markRead: (id) => api.put(`/notifications/${id}/read`).then((r) => r.data.notification),
  markAllRead: () => api.put('/notifications/read-all').then((r) => r.data),
};
