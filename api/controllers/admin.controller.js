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

// Reject a walker
export const rejectWalker = async (req, res) => {
    try {
        const { userId } = req.params;
        await prisma.user.update({
            where: { id: userId },
            data: {
                verificationStatus: 'REJECTED',
                isVerifiedWalker: false
            }
        });
        res.json({ message: 'Walker verification rejected' });
    } catch (error) {
        console.error('Admin reject error:', error);
        res.status(500).json({ error: 'Failed to reject walker' });
    }
};
