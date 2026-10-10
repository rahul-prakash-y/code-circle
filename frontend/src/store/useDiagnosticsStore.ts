import { create } from 'zustand';
import api from '../lib/axios';
import { toast } from 'react-hot-toast';

export interface SystemHealthData {
  status: 'OPTIMAL' | 'DEGRADED';
  timestamp: string;
  uptimeSeconds: number;
  eventLoopLagMs: number;
  nodeVersion: string;
  platform: string;
  cpuCount: number;
  cpuModel: string;
  loadAvg: number[];
  memory: {
    heapUsedMB: number;
    heapTotalMB: number;
    rssMB: number;
    externalMB: number;
    systemFreeMB: number;
    systemTotalMB: number;
    memoryUsagePercent: number;
  };
  database: {
    status: string;
    host: string;
    name: string;
    readyState: number;
    modelsRegistered: number;
  };
  services: {
    mongodb: string;
    cloudinary: string;
    firebaseAuth: string;
    pistonRce: string;
  };
}

export interface CollectionStat {
  name: string;
  count: number;
  indexesCount: number;
  modelName: string | null;
}

interface DiagnosticsState {
  healthData: SystemHealthData | null;
  databaseStats: CollectionStat[];
  totalCollections: number;
  totalDocuments: number;
  selectedCollection: string | null;
  collectionDocs: any[];
  collectionPagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  loadingHealth: boolean;
  loadingDb: boolean;
  loadingDocs: boolean;
  syncing: boolean;

  fetchHealth: () => Promise<void>;
  syncCache: () => Promise<void>;
  fetchDatabaseStats: () => Promise<void>;
  fetchCollectionDocuments: (collection: string, page?: number, limit?: number, search?: string) => Promise<void>;
  createDocument: (collection: string, data: any) => Promise<boolean>;
  updateDocument: (collection: string, id: string, data: any) => Promise<boolean>;
  deleteDocument: (collection: string, id: string) => Promise<boolean>;
  batchDeleteDocuments: (collection: string, ids: string[]) => Promise<boolean>;
}

export const useDiagnosticsStore = create<DiagnosticsState>((set, get) => ({
  healthData: null,
  databaseStats: [],
  totalCollections: 0,
  totalDocuments: 0,
  selectedCollection: null,
  collectionDocs: [],
  collectionPagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 1,
  },
  loadingHealth: false,
  loadingDb: false,
  loadingDocs: false,
  syncing: false,

  fetchHealth: async () => {
    set({ loadingHealth: true });
    try {
      const res = await api.get('/admin/diagnostics/health');
      set({ healthData: res.data.data, loadingHealth: false });
    } catch (err: any) {
      set({ loadingHealth: false });
    }
  },

  syncCache: async () => {
    set({ syncing: true });
    try {
      const res = await api.post('/admin/diagnostics/sync-cache');
      toast.success(res.data.message || 'System cache & memory buffers synchronized!');
      get().fetchHealth();
      set({ syncing: false });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to sync cache');
      set({ syncing: false });
    }
  },

  fetchDatabaseStats: async () => {
    set({ loadingDb: true });
    try {
      const res = await api.get('/admin/diagnostics/database/stats');
      set({
        databaseStats: res.data.collections || [],
        totalCollections: res.data.totalCollections || 0,
        totalDocuments: res.data.totalDocuments || 0,
        loadingDb: false,
      });
    } catch (err: any) {
      set({ loadingDb: false });
    }
  },

  fetchCollectionDocuments: async (collection, page = 1, limit = 20, search = '') => {
    set({ loadingDocs: true, selectedCollection: collection });
    try {
      const res = await api.get(`/admin/diagnostics/database/collections/${collection}`, {
        params: { page, limit, search },
      });
      set({
        collectionDocs: res.data.documents || [],
        collectionPagination: {
          page: res.data.page || page,
          limit: res.data.limit || limit,
          total: res.data.total || 0,
          pages: res.data.pages || 1,
        },
        loadingDocs: false,
      });
    } catch (err: any) {
      toast.error(err.response?.data?.error || `Failed to fetch documents from ${collection}`);
      set({ loadingDocs: false });
    }
  },

  createDocument: async (collection, data) => {
    try {
      await api.post(`/admin/diagnostics/database/collections/${collection}`, data);
      toast.success('Document inserted successfully');
      get().fetchCollectionDocuments(collection, get().collectionPagination.page);
      get().fetchDatabaseStats();
      return true;
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to insert document');
      return false;
    }
  },

  updateDocument: async (collection, id, data) => {
    try {
      await api.put(`/admin/diagnostics/database/collections/${collection}/${id}`, data);
      toast.success('Document updated successfully');
      get().fetchCollectionDocuments(collection, get().collectionPagination.page);
      return true;
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update document');
      return false;
    }
  },

  deleteDocument: async (collection, id) => {
    try {
      await api.delete(`/admin/diagnostics/database/collections/${collection}/${id}`);
      toast.success('Document deleted');
      get().fetchCollectionDocuments(collection, get().collectionPagination.page);
      get().fetchDatabaseStats();
      return true;
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete document');
      return false;
    }
  },

  batchDeleteDocuments: async (collection, ids) => {
    try {
      await api.post(`/admin/diagnostics/database/collections/${collection}/batch-delete`, { ids });
      toast.success(`Deleted ${ids.length} document(s)`);
      get().fetchCollectionDocuments(collection, 1);
      get().fetchDatabaseStats();
      return true;
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Batch deletion failed');
      return false;
    }
  },
}));

export default useDiagnosticsStore;
