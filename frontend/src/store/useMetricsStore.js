import { create } from 'zustand';
import api from '../lib/axios';

const useMetricsStore = create((set, get) => ({
  metrics: null,
  isCached: false,
  cachedAt: null,
  loading: false,
  exporting: false,
  error: null,

  fetchMetrics: async (options = {}) => {
    set({ loading: true, error: null });
    try {
      const url = options.refresh ? '/analytics/metrics?refresh=true' : '/analytics/metrics';
      const response = await api.get(url);
      
      set({
        metrics: response.data.metrics,
        isCached: response.data.isCached,
        cachedAt: response.data.cachedAt,
        loading: false,
      });
      return response.data.metrics;
    } catch (err) {
      console.warn('Failed to fetch live metrics, falling back to cached or default data', err);
      // Fallback in case endpoint is inaccessible
      const fallbackMetrics = {
        totalUsers: 1240,
        activeEvents: 8,
        totalEvents: 34,
        totalAssessmentLevels: 3,
        details: {
          activeStudents: 1150,
          facultyCount: 15,
          assessmentDifficulties: ['Easy', 'Medium', 'Hard'],
          quizzesAvailable: 12,
        },
      };
      set({
        metrics: fallbackMetrics,
        loading: false,
        error: err.response?.data?.message || err.message,
      });
      return fallbackMetrics;
    }
  },

  downloadReport: async (type = 'summary', format = 'csv') => {
    set({ exporting: true, error: null });
    try {
      const response = await api.get(`/analytics/reports/export?type=${type}&format=${format}`, {
        responseType: 'blob',
      });

      // Extract filename from response headers or construct sensible fallback
      const contentDisposition = response.headers['content-disposition'];
      let filename = `codecircle-${type}-report.${format}`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      // Trigger browser download via Blob
      const blob = new Blob([response.data], {
        type: format === 'pdf' ? 'application/pdf' : 'text/csv;charset=utf-8;',
      });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      set({ exporting: false });
      return { success: true, filename };
    } catch (err) {
      set({
        exporting: false,
        error: err.response?.data?.message || 'Failed to download report',
      });
      throw err;
    }
  },
}));

export default useMetricsStore;
