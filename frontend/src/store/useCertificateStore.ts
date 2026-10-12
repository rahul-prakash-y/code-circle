import { create } from 'zustand';
import api from '../lib/axios';
import { toast } from 'react-hot-toast';

export interface CertificateTemplate {
  _id: string;
  title: string;
  subtitle: string;
  description: string;
  type: 'EVENT' | 'COURSE' | 'ASSESSMENT' | 'CUSTOM' | 'HACKATHON';
  theme: 'modern-blue' | 'executive-gold' | 'cyber-dark' | 'emerald-minimal' | 'ruby-elegance';
  orientation: 'landscape' | 'portrait';
  bgImageUrl?: string;
  badgeUrl?: string;
  signatureUrl?: string;
  signatoryName: string;
  signatoryTitle: string;
  signatoryOrganization: string;
  secondarySignatoryName?: string;
  secondarySignatoryTitle?: string;
  primaryColor: string;
  accentColor: string;
  associatedEventId?: any;
  associatedDomainId?: any;
  isActive: boolean;
  issuedCount: number;
  createdAt: string;
}

export interface IssuedCertificate {
  _id: string;
  certificateId: string;
  verificationCode: string;
  templateId?: any;
  recipientUser: any;
  recipientName: string;
  recipientEmail: string;
  recipientRollNo?: string;
  title: string;
  subtitle: string;
  description: string;
  type: string;
  issuerOrganization: string;
  signatoryName: string;
  signatoryTitle: string;
  issueDate: string;
  status: 'ACTIVE' | 'REVOKED';
  revocationReason?: string;
  createdAt: string;
}

interface CertificateState {
  templates: CertificateTemplate[];
  issuedCertificates: IssuedCertificate[];
  myCertificates: IssuedCertificate[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  loading: boolean;
  issuing: boolean;
  error: string | null;

  fetchTemplates: () => Promise<void>;
  createTemplate: (data: Partial<CertificateTemplate>) => Promise<boolean>;
  updateTemplate: (id: string, data: Partial<CertificateTemplate>) => Promise<boolean>;
  deleteTemplate: (id: string) => Promise<boolean>;
  previewTemplate: (data: Partial<CertificateTemplate>) => Promise<string | null>;

  issueCertificates: (payload: {
    templateId: string;
    targetType: 'EVENT' | 'COURSE' | 'USERS';
    targetId?: string;
    userIds?: string[];
    customTitle?: string;
    customDescription?: string;
    issueDate?: string;
  }) => Promise<{ success: boolean; count?: number }>;

  fetchIssuedCertificates: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    templateId?: string;
  }) => Promise<void>;

  revokeCertificate: (id: string, reason?: string) => Promise<boolean>;
  fetchMyCertificates: () => Promise<void>;
  downloadCertificatePdf: (id: string, filename?: string) => Promise<void>;
}

export const useCertificateStore = create<CertificateState>((set, get) => ({
  templates: [],
  issuedCertificates: [],
  myCertificates: [],
  pagination: {
    total: 0,
    page: 1,
    limit: 20,
    pages: 1,
  },
  loading: false,
  issuing: false,
  error: null,

  fetchTemplates: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.get('/certificates/templates');
      set({ templates: res.data.data || [], loading: false });
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to fetch certificate templates';
      set({ error: msg, loading: false });
    }
  },

  createTemplate: async (data) => {
    set({ loading: true });
    try {
      const res = await api.post('/certificates/templates', data);
      set((state) => ({
        templates: [res.data.data, ...state.templates],
        loading: false,
      }));
      toast.success('Certificate template created successfully!');
      return true;
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create template');
      set({ loading: false });
      return false;
    }
  },

  updateTemplate: async (id, data) => {
    set({ loading: true });
    try {
      const res = await api.put(`/certificates/templates/${id}`, data);
      set((state) => ({
        templates: state.templates.map((t) => (t._id === id ? res.data.data : t)),
        loading: false,
      }));
      toast.success('Certificate template updated!');
      return true;
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update template');
      set({ loading: false });
      return false;
    }
  },

  deleteTemplate: async (id) => {
    set({ loading: true });
    try {
      await api.delete(`/certificates/templates/${id}`);
      set((state) => ({
        templates: state.templates.filter((t) => t._id !== id),
        loading: false,
      }));
      toast.success('Template deleted successfully');
      return true;
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete template');
      set({ loading: false });
      return false;
    }
  },

  previewTemplate: async (data) => {
    try {
      const res = await api.post('/certificates/preview', data, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      return URL.createObjectURL(blob);
    } catch (err: any) {
      toast.error('Preview generation failed');
      return null;
    }
  },

  issueCertificates: async (payload) => {
    set({ issuing: true });
    try {
      const res = await api.post('/certificates/issue', payload);
      toast.success(res.data.message || 'Certificates issued successfully!');
      get().fetchTemplates();
      get().fetchIssuedCertificates();
      set({ issuing: false });
      return { success: true, count: res.data.issuedCount };
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to issue certificates';
      toast.error(msg);
      set({ issuing: false });
      return { success: false };
    }
  },

  fetchIssuedCertificates: async (params = {}) => {
    set({ loading: true });
    try {
      const res = await api.get('/certificates/issued', { params });
      set({
        issuedCertificates: res.data.data || [],
        pagination: res.data.pagination || get().pagination,
        loading: false,
      });
    } catch (err: any) {
      set({ loading: false, error: err.response?.data?.error || 'Failed to load ledger' });
    }
  },

  revokeCertificate: async (id, reason = 'Administrative revocation') => {
    try {
      const res = await api.patch(`/certificates/issued/${id}/revoke`, { reason });
      set((state) => ({
        issuedCertificates: state.issuedCertificates.map((c) =>
          c._id === id ? { ...c, status: 'REVOKED', revocationReason: reason } : c
        ),
      }));
      toast.success('Certificate marked as revoked');
      return true;
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Revocation failed');
      return false;
    }
  },

  fetchMyCertificates: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.get('/certificates/my-certificates');
      set({ myCertificates: res.data.data || [], loading: false });
    } catch (err: any) {
      set({ loading: false, error: err.response?.data?.error || 'Failed to load certificates' });
    }
  },

  downloadCertificatePdf: async (id, filename = 'certificate.pdf') => {
    try {
      const toastId = toast.loading('Generating high-resolution vector certificate...');
      const res = await api.get(`/certificates/download/${id}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Certificate downloaded successfully!', { id: toastId });
    } catch (err: any) {
      toast.error('Failed to download certificate PDF');
    }
  },
}));

export default useCertificateStore;
