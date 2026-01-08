import { PrismaClient } from '@prisma/client';
import { createNotification } from './notifications.controller.js';

const prisma = new PrismaClient();

export const getOffersForWalkRequest = async (req, res) => {
    try {
        const { walkRequestId } = req.params;

        // Verify the walk request belongs to the user (only owners can see offers)
        const walkRequest = await prisma.walkRequest.findUnique({
            where: { id: walkRequestId },
        });

        if (!walkRequest) {
            return res.status(404).json({ error: 'Walk request not found' });
        }

        if (walkRequest.ownerId !== req.user.userId) {
            return res.status(403).json({ error: 'You can only view offers for your own requests' });
        }

        const offers = await prisma.offer.findMany({
            where: { walkRequestId },
            include: {
                walker: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        averageRating: true,
                        bio: true,
                        phone: true,
                        profilePhotoUrl: true, // Enhanced
                        isVerifiedWalker: true, // Enhanced
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        // Add check for favorite/blocked status for UI highlighting?
        // This is complex for a list, simplified MVP might not do this here efficiently without iteration.
        // Frontend can fetch favorites and map them.

        res.json(offers);
    } catch (error) {
        console.error('Get offers error:', error);
        res.status(500).json({ error: 'Failed to get offers' });
    }
};

export const createOffer = async (req, res) => {
    try {
        const { walkRequestId, offeredPrice, message } = req.body;

        // Validation
        if (!walkRequestId || !offeredPrice) {
            return res.status(400).json({ error: 'Walk request ID and offered price are required' });
        }

        // LEGAL CHECK: Walker must be VERIFIED
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: { verificationStatus: true }
        });

        if (user.verificationStatus !== 'VERIFIED') {
            return res.status(403).json({
                error: 'Según los Términos y Condiciones, debes completar tu verificación de identidad (DNI) para ofrecer servicios de paseo.'
            });
        }

        // Verify walk request exists and is OPEN
        const walkRequest = await prisma.walkRequest.findUnique({
            where: { id: walkRequestId },
        });

        if (!walkRequest) {
            return res.status(404).json({ error: 'Walk request not found' });
        }

        if (walkRequest.status !== 'OPEN') {
            return res.status(400).json({
                error: 'Can only make offers on OPEN walk requests'
            });
        }

        // Check if Walker is BLOCKED by Owner
        const blocked = await prisma.blockedWalker.findUnique({
            where: {
                ownerId_walkerId: {
                    ownerId: walkRequest.ownerId,
                    walkerId: req.user.userId
                }
            }
        });

        if (blocked) {
            return res.status(403).json({ error: 'You cannot make offers to this owner.' });
        }

        // Check if walker already made an offer for this request
        const existingOffer = await prisma.offer.findUnique({
            where: {
                walkRequestId_walkerId: {
                    walkRequestId,
                    walkerId: req.user.userId,
                },
            },
        });

        if (existingOffer) {
            return res.status(400).json({ error: 'You already made an offer for this request' });
        }

        const offer = await prisma.offer.create({
            data: {
                walkRequestId,
                walkerId: req.user.userId,
                offeredPrice: parseFloat(offeredPrice),
                message: message || null,
                status: 'PENDING',
            },
            include: {
                walker: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        averageRating: true,
                    },
                },
            },
        });

        res.status(201).json({
            message: 'Offer created successfully',
            offer,
        });

        // NOTIFICATION: Notify the Owner
        try {
            await createNotification({
                userId: walkRequest.ownerId,
                type: 'OFFER_RECEIVED',
                title: 'Nueva oferta recibida',
                message: `${offer.walker.firstName} ha enviado una oferta para pasear a tu perro.`,
                link: `/walk-requests/${walkRequestId}`
            });
        } catch (notifierErr) {
            console.error('Notifier error (OFFER_RECEIVED):', notifierErr);
        }
    } catch (error) {
        console.error('Create offer error:', error);
        res.status(500).json({ error: 'Failed to create offer' });
    }
};

export const acceptOffer = async (req, res) => {
    try {
        const { id } = req.params;

        // Get offer with walk request
        const offer = await prisma.offer.findUnique({
            where: { id },
            include: {
                walkRequest: true,
            },
        });

        if (!offer) {
            return res.status(404).json({ error: 'Offer not found' });
        }

        // Verify user owns the walk request
        if (offer.walkRequest.ownerId !== req.user.userId) {
            return res.status(403).json({ error: 'You can only accept offers for your own requests' });
        }

        // Verify walk request is still OPEN
        if (offer.walkRequest.status !== 'OPEN') {
            return res.status(400).json({ error: 'Walk request is no longer available' });
        }

        // Use transaction to ensure data consistency
        const result = await prisma.$transaction(async (tx) => {
            // Accept this offer
            const acceptedOffer = await tx.offer.update({
                where: { id },
                data: { status: 'ACCEPTED' },
            });

            // Reject all other offers for this walk request
            await tx.offer.updateMany({
                where: {
                    walkRequestId: offer.walkRequestId,
                    id: { not: id },
                },
                data: { status: 'REJECTED' },
            });

            // Update walk request status to ASSIGNED
            await tx.walkRequest.update({
                where: { id: offer.walkRequestId },
                data: { status: 'ASSIGNED' },
            });

            // Create walk assignment
            const assignment = await tx.walkAssignment.create({
                data: {
                    walkRequestId: offer.walkRequestId,
                    walkerId: offer.walkerId,
                    status: 'PENDING',
                    agreedPrice: offer.offeredPrice,
                },
            });

            return { acceptedOffer, assignment };
        });

        res.json({
            message: 'Offer accepted successfully',
            offer: result.acceptedOffer,
            assignment: result.assignment,
        });

        // NOTIFICATION: Notify the Walker
        try {
            await createNotification({
                userId: offer.walkerId,
                type: 'OFFER_ACCEPTED',
                title: '¡Oferta aceptada!',
                message: `Tu oferta ha sido aceptada. Tienes un nuevo paseo asignado.`,
                link: `/walk-requests/${offer.walkRequestId}`
            });
        } catch (notifierErr) {
            console.error('Notifier error (OFFER_ACCEPTED):', notifierErr);
        }
    } catch (error) {
        console.error('Accept offer error:', error);
        res.status(500).json({ error: 'Failed to accept offer' });
    }
};

export const rejectOffer = async (req, res) => {
    try {
        const { id } = req.params;

        // Get offer with walk request
        const offer = await prisma.offer.findUnique({
            where: { id },
            include: {
                walkRequest: true,
            },
        });

        if (!offer) {
            return res.status(404).json({ error: 'Offer not found' });
        }

        // Verify user owns the walk request
        if (offer.walkRequest.ownerId !== req.user.userId) {
            return res.status(403).json({ error: 'You can only reject offers for your own requests' });
        }

        const rejectedOffer = await prisma.offer.update({
            where: { id },
            data: { status: 'REJECTED' },
        });

        res.json({
            message: 'Offer rejected successfully',
            offer: rejectedOffer,
        });
    } catch (error) {
        console.error('Reject offer error:', error);
        res.status(500).json({ error: 'Failed to reject offer' });
    }
};
