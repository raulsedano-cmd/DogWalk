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

// ... (existing imports and functions)

// Get verification history (Verified or Rejected)
export const getVerificationHistory = async (req, res) => {
    try {
        const history = await prisma.user.findMany({
            where: {
                verificationStatus: { in: ['VERIFIED', 'REJECTED'] },
                roles: { has: 'WALKER' }
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                dniNumber: true,
                verificationStatus: true,
                isVerifiedWalker: true,
                dniFrontPhotoUrl: true,
                dniBackPhotoUrl: true,
                updatedAt: true
            },
            orderBy: { updatedAt: 'desc' },
            take: 50
        });
        res.json(history);
    } catch (error) {
        console.error('Admin history error:', error);
        res.status(500).json({ error: 'Failed to get history' });
    }
};

// Get all walkers
export const getAllWalkers = async (req, res) => {
    try {
        const walkers = await prisma.user.findMany({
            where: { roles: { has: 'WALKER' } },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                city: true,
                averageRating: true,
                isVerifiedWalker: true,
                verificationStatus: true,
                profilePhotoUrl: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(walkers);
    } catch (error) {
        console.error('Admin walkers error:', error);
        res.status(500).json({ error: 'Failed to get walkers' });
    }
};

// Get Support Tickets (Claims)
export const getSupportTickets = async (req, res) => {
    try {
        const { status } = req.query; // OPEN, CLOSED, or all
        const where = status ? { status } : {};

        const tickets = await prisma.supportTicket.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        activeRole: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(tickets);
    } catch (error) {
        console.error('Admin tickets error:', error);
        res.status(500).json({ error: 'Failed to get tickets' });
    }
};

// Update Ticket Status
export const updateTicketStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // OPEN, IN_PROGRESS, CLOSED

        const ticket = await prisma.supportTicket.update({
            where: { id },
            data: { status }
        });
        res.json(ticket);
    } catch (error) {
        console.error('Admin update ticket error:', error);
        res.status(500).json({ error: 'Failed to update ticket' });
    }
};
