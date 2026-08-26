import { api } from './client';

export const paymentsApi = {
  create: (payload) => api.post('/payments', payload).then((r) => r.data.payment),
  listForBooking: (bookingId) =>
    api.get(`/payments/booking/${bookingId}`).then((r) => r.data.payments),
  confirm: (id) => api.put(`/payments/${id}/confirm`).then((r) => r.data.payment),
  refund: (id) => api.post(`/payments/${id}/refund`).then((r) => r.data.refund),
};
