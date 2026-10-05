import { create } from 'zustand';
import api from '../lib/axios';
import toast from 'react-hot-toast';

export type NotificationType = 'info' | 'success' | 'warning' | 'urgent';
export type NotificationTargetRole = 'All' | 'Student' | 'Faculty' | 'Admin';

export interface NotificationItem {
  id: string;
  _id: string;
  title: string;
  message: string;
  type: NotificationType;
  targetRole: NotificationTargetRole;
  link?: string;
  createdAt: string;
  createdBy?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  unread: boolean;
}

export interface CreateNotificationPayload {
  title: string;
  message: string;
  type: NotificationType;
  targetRole: NotificationTargetRole;
  link?: string;
}

interface NotificationStore {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  actionLoading: boolean;
  error: string | null;

  fetchNotifications: () => Promise<void>;
  createNotification: (data: CreateNotificationPayload) => Promise<boolean>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<boolean>;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  actionLoading: false,
  error: null,

  fetchNotifications: async () => {
    try {
      set({ loading: true, error: null });
      const res = await api.get('/notifications');
      if (res.data?.success) {
        const notifications: NotificationItem[] = res.data.notifications || [];
        const unreadCount = notifications.filter((n) => n.unread).length;
        set({
          notifications,
          unreadCount,
          loading: false,
        });
      } else {
        set({ loading: false });
      }
    } catch (err: any) {
      set({
        loading: false,
        error: err.response?.data?.error || 'Failed to fetch notifications',
      });
    }
  },

  createNotification: async (data: CreateNotificationPayload) => {
    try {
      set({ actionLoading: true, error: null });
      const res = await api.post('/notifications', data);
      if (res.data?.success && res.data.notification) {
        const newNotif: NotificationItem = res.data.notification;
        set((state) => ({
          notifications: [newNotif, ...state.notifications],
          unreadCount: state.unreadCount + 1,
          actionLoading: false,
        }));
        toast.success('Notification broadcasted to members!');
        return true;
      }
      set({ actionLoading: false });
      return false;
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to broadcast notification';
      toast.error(msg);
      set({ actionLoading: false, error: msg });
      return false;
    }
  },

  markAsRead: async (id: string) => {
    try {
      // Optimistic update
      set((state) => {
        const updated = state.notifications.map((n) =>
          n.id === id || n._id === id ? { ...n, unread: false } : n
        );
        return {
          notifications: updated,
          unreadCount: updated.filter((n) => n.unread).length,
        };
      });
      await api.patch(`/notifications/${id}/read`);
    } catch (err) {
      console.warn('Failed to mark notification as read:', err);
    }
  },

  markAllAsRead: async () => {
    try {
      // Optimistic update
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, unread: false })),
        unreadCount: 0,
      }));
      await api.post('/notifications/read-all');
    } catch (err) {
      console.warn('Failed to mark all notifications as read:', err);
    }
  },

  deleteNotification: async (id: string) => {
    try {
      set({ actionLoading: true });
      await api.delete(`/notifications/${id}`);
      set((state) => {
        const filtered = state.notifications.filter((n) => n.id !== id && n._id !== id);
        return {
          notifications: filtered,
          unreadCount: filtered.filter((n) => n.unread).length,
          actionLoading: false,
        };
      });
      toast.success('Notification deleted');
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to delete notification';
      toast.error(msg);
      set({ actionLoading: false });
      return false;
    }
  },
}));

export default useNotificationStore;
