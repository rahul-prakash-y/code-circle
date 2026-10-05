import { FastifyRequest, FastifyReply } from 'fastify';
import Notification, { NotificationType, NotificationTargetRole } from '../models/notificationModel';

export const getNotifications = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user;
    if (!user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    // Role filtering: Admins and SuperAdmins can see all broadcast notifications.
    // Students/Faculty see 'All' or notifications matching their specific role.
    const isElevated = user.role === 'Admin' || user.role === 'SuperAdmin';
    const filter = isElevated
      ? {}
      : {
          $or: [
            { targetRole: 'All' },
            { targetRole: user.role },
          ],
        };

    const docs = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(40)
      .populate('createdBy', 'name email role')
      .lean();

    const notifications = docs.map((doc: any) => {
      const readList = Array.isArray(doc.readBy) ? doc.readBy : [];
      const hasRead = readList.some((uId: any) => uId.toString() === user.id);
      return {
        id: doc._id.toString(),
        _id: doc._id.toString(),
        title: doc.title,
        message: doc.message,
        type: doc.type || 'info',
        targetRole: doc.targetRole || 'All',
        link: doc.link || '',
        createdAt: doc.createdAt,
        createdBy: doc.createdBy,
        unread: !hasRead,
      };
    });

    return reply.status(200).send({
      success: true,
      notifications,
      unreadCount: notifications.filter((n) => n.unread).length,
    });
  } catch (err: any) {
    return reply.status(500).send({
      success: false,
      error: err.message || 'Failed to fetch notifications',
    });
  }
};

export const createNotification = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user;
    if (!user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    const { title, message, type, targetRole, link } = request.body as {
      title?: string;
      message?: string;
      type?: NotificationType;
      targetRole?: NotificationTargetRole;
      link?: string;
    };

    if (!title || !title.trim()) {
      return reply.status(400).send({ success: false, error: 'Title is required' });
    }

    if (!message || !message.trim()) {
      return reply.status(400).send({ success: false, error: 'Message is required' });
    }

    const validTypes: NotificationType[] = ['info', 'success', 'warning', 'urgent'];
    const validType = validTypes.includes(type as any) ? type : 'info';

    const validTargets: NotificationTargetRole[] = ['All', 'Student', 'Faculty', 'Admin'];
    const validTarget = validTargets.includes(targetRole as any) ? targetRole : 'All';

    const notification = await Notification.create({
      title: title.trim(),
      message: message.trim(),
      type: validType,
      targetRole: validTarget,
      link: link ? link.trim() : '',
      createdBy: user.id,
      readBy: [],
    });

    const populated = await Notification.findById(notification._id)
      .populate('createdBy', 'name email role')
      .lean();

    return reply.status(201).send({
      success: true,
      notification: {
        id: populated._id.toString(),
        _id: populated._id.toString(),
        title: populated.title,
        message: populated.message,
        type: populated.type,
        targetRole: populated.targetRole,
        link: populated.link,
        createdAt: populated.createdAt,
        createdBy: populated.createdBy,
        unread: true,
      },
    });
  } catch (err: any) {
    return reply.status(500).send({
      success: false,
      error: err.message || 'Failed to create notification',
    });
  }
};

export const markAsRead = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user;
    const { id } = request.params as { id: string };

    if (!user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    await Notification.findByIdAndUpdate(id, {
      $addToSet: { readBy: user.id },
    });

    return reply.status(200).send({ success: true, message: 'Notification marked as read' });
  } catch (err: any) {
    return reply.status(500).send({
      success: false,
      error: err.message || 'Failed to mark notification as read',
    });
  }
};

export const markAllAsRead = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user;
    if (!user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    const isElevated = user.role === 'Admin' || user.role === 'SuperAdmin';
    const filter = isElevated
      ? {}
      : {
          $or: [
            { targetRole: 'All' },
            { targetRole: user.role },
          ],
        };

    await Notification.updateMany(filter, {
      $addToSet: { readBy: user.id },
    });

    return reply.status(200).send({ success: true, message: 'All notifications marked as read' });
  } catch (err: any) {
    return reply.status(500).send({
      success: false,
      error: err.message || 'Failed to mark all as read',
    });
  }
};

export const deleteNotification = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user;
    if (!user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    const { id } = request.params as { id: string };
    const doc = await Notification.findByIdAndDelete(id);

    if (!doc) {
      return reply.status(404).send({ success: false, error: 'Notification not found' });
    }

    return reply.status(200).send({ success: true, message: 'Notification removed successfully' });
  } catch (err: any) {
    return reply.status(500).send({
      success: false,
      error: err.message || 'Failed to delete notification',
    });
  }
};
