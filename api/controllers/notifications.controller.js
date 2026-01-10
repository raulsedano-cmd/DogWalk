import { PrismaClient } from '@prisma/client';

const prisma = global.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

export const getNotifications = async (req, res) => {
    try {
        const notifications = await prisma.notification.findMany({
            where: { userId: req.user.userId },
            orderBy: { createdAt: 'desc' },
            take: 50,
            select: {
                id: true,
                userId: true,
                type: true,
                title: true,
                message: true,
                isRead: true,
                createdAt: true
                // Note: 'link' column excluded as it doesn't exist in DB
            }
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
        // Workaround: Append link to message since 'link' column is missing in DB
        const finalMessage = link ? `${message}|LINK:${link}` : message;

        return await prisma.notification.create({
            data: {
                userId,
                type,
                title,
                message: finalMessage
            },
        });
    } catch (error) {
        console.error('Create notification internal error:', error);
    }
};
