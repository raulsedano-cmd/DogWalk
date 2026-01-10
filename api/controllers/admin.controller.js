import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get lists of pending verifications
export const getPendingVerifications = async (req, res) => {
    try {
        const pendingWalkers = await prisma.user.findMany({
            where: {
                verificationStatus: 'PENDING',
                dniNumber: { not: null } // Ensure they actually submitted something
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                dniNumber: true,
                dniFrontPhotoUrl: true,
                dniBackPhotoUrl: true,
                createdAt: true
            }
        });
        res.json(pendingWalkers);
    } catch (error) {
        console.error('Admin get pending error:', error);
        res.status(500).json({ error: 'Failed to get pending verifications' });
    }
};

// Approve a walker
export const approveWalker = async (req, res) => {
    try {
        const { userId } = req.params;
        await prisma.user.update({
            where: { id: userId },
            data: {
                verificationStatus: 'VERIFIED',
                isVerifiedWalker: true
            }
        });
        res.json({ message: 'Walker verified successfully' });
    } catch (error) {
        console.error('Admin approve error:', error);
        res.status(500).json({ error: 'Failed to verify walker' });
    }
};

import { createNotification } from './notifications.controller.js';

// ... (existing code for getPendingVerifications and approveWalker)

// Reject a walker
export const rejectWalker = async (req, res) => {
    try {
        const { userId } = req.params;
        const { reason } = req.body; // Expect reason in body

        if (!reason) {
            return res.status(400).json({ error: 'Debes indicar un motivo de rechazo' });
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                verificationStatus: 'REJECTED',
                isVerifiedWalker: false
            }
        });

        // Send notification to the walker
        // Using WALK_CANCELLED as proxy for "Rejection" (X icon) since we can't easily add enum values in prod
        try {
            await createNotification({
                userId: userId,
                type: 'WALK_CANCELLED',
                title: 'Verificación Rechazada ❌',
                message: `Tu solicitud ha sido rechazada. Motivo: ${reason}. Por favor, vuelve a intentar subiendo documentos válidos.`,
                link: '/verificar-paseador' // Link to retry
            });
        } catch (nError) {
            console.error('Failed to send rejection notification', nError);
        }

        res.json({ message: 'Walker verification rejected and notified' });
    } catch (error) {
        console.error('Admin reject error:', error);
        res.status(500).json({ error: 'Failed to reject walker' });
    }
};
