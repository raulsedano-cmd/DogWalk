import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getNotifications = async (req, res) => {
    try {
        const notifications = await prisma.notification.findMany({
            where: { userId: req.user.userId },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });

        res.json(notifications);
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: 'Failed to get notifications' });
    }
};

export const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.notification.update({
            where: {
                id,
                userId: req.user.userId // Security check
            },
            data: { isRead: true },
        });

        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        console.error('Mark notification read error:', error);
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
};

export const markAllAsRead = async (req, res) => {
    try {
        await prisma.notification.updateMany({
            where: { userId: req.user.userId },
            data: { isRead: true },
        });

        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Mark all read error:', error);
        res.status(500).json({ error: 'Failed to mark all notifications as read' });
    }
};

// Internal service to create notifications
export const createNotification = async ({ userId, type, title, message, link }) => {
    try {
        return await prisma.notification.create({
            data: { userId, type, title, message, link },
        });
    } catch (error) {
        console.error('Create notification internal error:', error);
    }
};
