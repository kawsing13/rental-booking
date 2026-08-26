import { api } from './client';

export const adminApi = {
  dashboard: () => api.get('/admin/dashboard').then((r) => r.data),
  listCustomers: () => api.get('/admin/customers').then((r) => r.data.customers),
  getCustomer: (id) => api.get(`/admin/customers/${id}`).then((r) => r.data),
  calendar: (month) => api.get('/admin/calendar', { params: { month } }).then((r) => r.data),

  listDeliveries: (date) => api.get('/admin/deliveries', { params: { date } }).then((r) => r.data.deliveries),
  createDelivery: (payload) => api.post('/admin/deliveries', payload).then((r) => r.data.delivery),
  updateDelivery: (id, payload) => api.put(`/admin/deliveries/${id}`, payload).then((r) => r.data.delivery),

  // JSON preview (used to render an in-page table before the user commits
  // to downloading a specific file format).
  reportPreview: (report, params) =>
    api.get(`/admin/reports/${report}`, { params: { ...params, format: 'json' } }).then((r) => r.data),

  // Downloads a report as a real file. We fetch as a blob (so the auth
  // header from the axios interceptor is actually sent - a plain <a href>
  // to the API URL would hit an unauthenticated request) then trigger a
  // browser download via a temporary object URL.
  downloadReport: async (report, format, params) => {
    const response = await api.get(`/admin/reports/${report}`, {
      params: { ...params, format },
      responseType: 'blob',
    });
    const extension = format === 'excel' ? 'xlsx' : format;
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${report}.${extension}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
