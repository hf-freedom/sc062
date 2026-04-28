import axios from 'axios';

const API_BASE_URL = 'http://localhost:8003/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

export const advertiserApi = {
  list: () => api.get('/advertisers'),
  get: (id) => api.get(`/advertisers/${id}`),
  create: (data) => api.post('/advertisers', data),
  update: (id, data) => api.put(`/advertisers/${id}`, data),
  recharge: (id, amount) => api.post(`/advertisers/${id}/recharge?amount=${amount}`),
  getBalanceSummary: () => api.get('/advertisers/balance-summary'),
};

export const planApi = {
  list: () => api.get('/plans'),
  get: (id) => api.get(`/plans/${id}`),
  create: (data) => api.post('/plans', data),
  update: (id, data) => api.put(`/plans/${id}`, data),
  start: (id) => api.post(`/plans/${id}/start`),
  pause: (id) => api.post(`/plans/${id}/pause`),
  getByAdvertiser: (advertiserId) => api.get(`/plans/advertiser/${advertiserId}`),
};

export const materialApi = {
  list: () => api.get('/materials'),
  get: (id) => api.get(`/materials/${id}`),
  create: (data) => api.post('/materials', data),
  submitReview: (id) => api.post(`/materials/${id}/submit-review`),
  approve: (id, comment) => api.post(`/materials/${id}/approve?comment=${encodeURIComponent(comment || '')}`),
  reject: (id, reason) => api.post(`/materials/${id}/reject?reason=${encodeURIComponent(reason)}`),
  getByPlan: (planId) => api.get(`/materials/plan/${planId}`),
};

export const deliveryApi = {
  requestAd: (data) => api.post('/delivery/request', data),
  recordClick: (data) => api.post('/delivery/click', data),
  recordConversion: (data) => api.post('/delivery/convert', data),
  recordBackfillConversion: (data) => api.post('/delivery/convert/backfill', data),
};

export const reportApi = {
  getDailySummary: (date) => api.get(`/reports/daily${date ? `?date=${date}` : ''}`),
  getPlanDailySummary: (planId, date) => api.get(`/reports/plan/${planId}/daily${date ? `?date=${date}` : ''}`),
  getBalanceSummary: () => api.get('/reports/balance'),
  generateDailyReport: (advertiserId, planId, date) => {
    let params = [];
    if (advertiserId) params.push(`advertiserId=${advertiserId}`);
    if (planId) params.push(`planId=${planId}`);
    if (date) params.push(`date=${date}`);
    return api.post(`/reports/generate${params.length > 0 ? '?' + params.join('&') : ''}`);
  },
};

export const settlementApi = {
  runSettlement: (date) => api.post(`/settlements/run${date ? `?date=${date}` : ''}`),
  createSettlement: (advertiserId, date) => api.post(`/settlements/advertiser/${advertiserId}${date ? `?date=${date}` : ''}`),
  confirmSettlement: (id) => api.post(`/settlements/${id}/confirm`),
  getByAdvertiser: (advertiserId) => api.get(`/settlements/advertiser/${advertiserId}`),
  createAdjustment: (settlementId, data) => api.post(`/settlements/${settlementId}/adjustments`, data),
  getAdjustments: (settlementId) => api.get(`/settlements/${settlementId}/adjustments`),
};

export const fraudApi = {
  runDetection: () => api.post('/fraud/run'),
  getFraudClicks: () => api.get('/fraud/clicks'),
};

export default api;
