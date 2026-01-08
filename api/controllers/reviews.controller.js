import { PrismaClient } from '@prisma/client';
import { createNotification } from './notifications.controller.js';

const prisma = new PrismaClient();

export const createReview = async (req, res) => {
    try {
        const { walkAssignmentId, rating, comment } = req.body;

        // Validation
        if (!walkAssignmentId || !rating) {
            return res.status(400).json({ error: 'Walk assignment ID and rating are required' });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Rating must be between 1 and 5' });
        }

        // Get assignment
        const assignment = await prisma.walkAssignment.findUnique({
            where: { id: walkAssignmentId },
            include: {
                walkRequest: true,
                review: true,
            },
        });

        if (!assignment) {
            return res.status(404).json({ error: 'Walk assignment not found' });
        }

        // Verify user is the owner of the walk request
        if (assignment.walkRequest.ownerId !== req.user.userId) {
            return res.status(403).json({
                error: 'Only the walk owner can leave a review'
            });
        }

        // Verify assignment is COMPLETED
        if (assignment.status !== 'COMPLETED') {
            return res.status(400).json({
                error: 'Can only review completed walk assignments'
            });
        }

        // Check if review already exists (one review per assignment)
        if (assignment.review) {
            return res.status(400).json({
                error: 'A review already exists for this assignment'
            });
        }

        // Create review and update walker's average rating in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create review
            const review = await tx.review.create({
                data: {
                    walkAssignmentId,
                    authorId: req.user.userId,
                    rating: parseInt(rating),
                    comment: comment || null,
                },
            });

            // Recalculate walker's average rating
            const allReviews = await tx.review.findMany({
                where: {
                    walkAssignment: {
                        walkerId: assignment.walkerId,
                    },
                },
                select: {
                    rating: true,
                },
            });

            const averageRating =
                allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

            // Update walker's average rating
            await tx.user.update({
                where: { id: assignment.walkerId },
                data: { averageRating },
            });

            return review;
        });

        res.status(201).json({
            message: 'Review created successfully',
            review: result,
        });

        // NOTIFICATION: Notify the Walker
        try {
            await createNotification({
                userId: assignment.walkerId,
                type: 'REVIEW_RECEIVED',
                title: 'Nueva reseña recibida',
                message: `Has recibido una reseña de ${rating} estrellas por tu paseo.`,
                link: `/profile` // Or a more specific link if needed
            });
        } catch (notifierErr) {
            console.error('Notifier error (REVIEW_RECEIVED):', notifierErr);
        }
    } catch (error) {
        console.error('Create review error:', error);
        res.status(500).json({ error: 'Failed to create review' });
    }
};

export const getWalkerReviews = async (req, res) => {
    try {
        const { walkerId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        const [reviews, total] = await Promise.all([
            prisma.review.findMany({
                where: {
                    walkAssignment: {
                        walkerId,
                    },
                },
                include: {
                    author: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                    walkAssignment: {
                        select: {
                            createdAt: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take,
            }),
            prisma.review.count({
                where: {
                    walkAssignment: {
                        walkerId,
                    },
                },
            }),
        ]);

        res.json({
            reviews,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (error) {
        console.error('Get walker reviews error:', error);
        res.status(500).json({ error: 'Failed to get reviews' });
    }
};
