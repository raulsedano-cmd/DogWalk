import prisma from '../services/prisma.js';
import { createNotification } from './notifications.controller.js';

export const getMyAssignments = async (req, res) => {
    try {
        const where = {};

        if (req.user.activeRole === 'WALKER') {
            where.walkerId = req.user.userId;
        } else {
            // For owners, get assignments for their walk requests
            where.walkRequest = {
                ownerId: req.user.userId,
            };
        }

        const assignments = await prisma.walkAssignment.findMany({
            where,
            include: {
                walkRequest: {
                    include: {
                        dog: true,
                        owner: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                phone: true,
                            },
                        },
                    },
                },
                walker: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                        averageRating: true,
                        latitude: true,
                        longitude: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json(assignments);
    } catch (error) {
        console.error('Get assignments error:', error);
        res.status(500).json({ error: 'Failed to get assignments' });
    }
};

export const getAssignmentById = async (req, res) => {
    try {
        const { id } = req.params;

        const assignment = await prisma.walkAssignment.findUnique({
            where: { id },
            include: {
                walkRequest: {
                    include: {
                        dog: true,
                        owner: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                phone: true,
                            },
                        },
                    },
                },
                walker: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                        averageRating: true,
                        latitude: true,
                        longitude: true,
                    },
                },
                review: true,
            },
        });

        if (!assignment) {
            return res.status(404).json({ error: 'Assignment not found' });
        }

        // Verify user is either the walker or the owner
        const isWalker = assignment.walkerId === req.user.userId;
        const isOwner = assignment.walkRequest.ownerId === req.user.userId;

        if (!isWalker && !isOwner) {
            return res.status(403).json({
                error: 'You can only view assignments you are involved in'
            });
        }

        res.json(assignment);
    } catch (error) {
        console.error('Get assignment error:', error);
        res.status(500).json({ error: 'Failed to get assignment' });
    }
};

export const startAssignment = async (req, res) => {
    try {
        const { id } = req.params;

        const assignment = await prisma.walkAssignment.findUnique({
            where: { id },
            include: { walkRequest: { include: { dog: true } } }
        });

        if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
        if (assignment.walkerId !== req.user.userId) return res.status(403).json({ error: 'Solo el paseador asignado puede iniciar el paseo' });
        if (assignment.status !== 'PENDING') return res.status(400).json({ error: 'El paseo ya ha sido iniciado o finalizado' });

        const updatedAssignment = await prisma.$transaction(async (tx) => {
            const assignmentUpdate = await tx.walkAssignment.update({
                where: { id },
                data: {
                    status: 'IN_PROGRESS',
                    actualStartTime: new Date()
                }
            });

            await tx.walkRequest.update({
                where: { id: assignment.walkRequestId },
                data: { status: 'IN_PROGRESS' }
            });

            return assignmentUpdate;
        });

        res.json({ message: 'Paseo iniciado', assignment: updatedAssignment });

        try {
            await createNotification({
                userId: assignment.walkRequest.ownerId,
                type: 'WALK_STARTED',
                title: '¡Paseo iniciado! 🚀',
                message: `El paseador ha iniciado el paseo con ${assignment.walkRequest.dog.name}.`,
                link: `/walk-assignments/${id}/in-progress`
            });
        } catch (nErr) { console.error(nErr); }

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to start walk' });
    }
};

export const cancelAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!reason || reason.trim() === '') {
            return res.status(400).json({ error: 'El motivo de cancelación es obligatorio' });
        }

        const assignment = await prisma.walkAssignment.findUnique({
            where: { id },
            include: { walkRequest: { include: { dog: true } } }
        });

        if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
        if (assignment.walkerId !== req.user.userId) return res.status(403).json({ error: 'No autorizado' });
        if (!['PENDING', 'IN_PROGRESS'].includes(assignment.status)) {
            return res.status(400).json({ error: 'No se puede cancelar un paseo ya finalizado' });
        }

        const updatedAssignment = await prisma.$transaction(async (tx) => {
            const update = await tx.walkAssignment.update({
                where: { id },
                data: {
                    status: 'CANCELLED',
                    cancelledBy: 'WALKER',
                    cancelReason: reason,
                    cancelledAt: new Date()
                }
            });

            await tx.walkRequest.update({
                where: { id: assignment.walkRequestId },
                data: { status: 'CANCELLED' }
            });

            return update;
        });

        res.json({ message: 'Paseo cancelado', assignment: updatedAssignment });

        try {
            await createNotification({
                userId: assignment.walkRequest.ownerId,
                type: 'WALK_CANCELLED',
                title: 'Paseo cancelado ⚠️',
                message: `El paseador ha cancelado el paseo. Motivo: ${reason}`,
                link: `/walk-requests/${assignment.walkRequestId}`
            });
        } catch (nErr) { console.error(nErr); }

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to cancel walk' });
    }
};

export const completeAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        const { didPee, didPoop, behaviorRating, reportNotes, earlyEndReason } = req.body;

        const assignment = await prisma.walkAssignment.findUnique({
            where: { id },
            include: { walkRequest: { include: { dog: true } } }
        });

        if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
        if (assignment.walkerId !== req.user.userId) return res.status(403).json({ error: 'No autorizado' });
        if (assignment.status !== 'IN_PROGRESS') return res.status(400).json({ error: 'El paseo debe estar en curso para finalizarlo' });

        const now = new Date();
        const start = assignment.actualStartTime || assignment.createdAt;
        const durationMinutes = Math.floor((now - start) / 60000);

        // Validation for early end
        if (durationMinutes < assignment.walkRequest.durationMinutes) {
            if (!earlyEndReason || earlyEndReason.trim() === '') {
                return res.status(400).json({
                    error: 'El tiempo transcurrido es menor al programado. Debes indicar un motivo de término anticipado.'
                });
            }
        }

        const updatedAssignment = await prisma.$transaction(async (tx) => {
            const update = await tx.walkAssignment.update({
                where: { id },
                data: {
                    status: 'COMPLETED',
                    actualEndTime: now,
                    actualDurationMinutes: durationMinutes,
                    didPee: didPee === true || didPee === 'true',
                    didPoop: didPoop === true || didPoop === 'true',
                    behaviorRating,
                    reportNotes,
                    earlyEndReason: durationMinutes < assignment.walkRequest.durationMinutes ? earlyEndReason : null,
                    // Commission calculation
                    platformFeeAmount: assignment.agreedPrice * assignment.platformFeeRate,
                    platformFeeStatus: 'DUE'
                }
            });

            await tx.walkRequest.update({
                where: { id: assignment.walkRequestId },
                data: { status: 'COMPLETED' }
            });

            return update;
        });

        res.json({ message: 'Paseo completado', assignment: updatedAssignment });

        try {
            await createNotification({
                userId: assignment.walkRequest.ownerId,
                type: 'WALK_COMPLETED',
                title: 'Paseo finalizado 🏁',
                message: `${assignment.walkRequest.dog.name} ha regresado. ¡Revisa el reporte del paseo!`,
                link: `/walk-requests/${assignment.walkRequestId}`
            });
        } catch (nErr) { console.error(nErr); }

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to complete walk' });
    }
};

export const updateAssignmentStatus = async (req, res) => {
    // Keep this for backward compatibility if needed, but route to specific functions
    const { status } = req.body;
    if (status === 'IN_PROGRESS') return startAssignment(req, res);
    if (status === 'CANCELLED') return cancelAssignment(req, res);
    if (status === 'COMPLETED') return completeAssignment(req, res);
    res.status(400).json({ error: 'Use specific endpoints for start/cancel/complete' });
};

export const uploadWalkPhotos = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No se han subido fotos' });
        }

        const assignment = await prisma.walkAssignment.findUnique({
            where: { id },
            include: { photos: true }
        });

        if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
        if (assignment.walkerId !== userId) return res.status(403).json({ error: 'No autorizado' });

        if (assignment.photos.length + req.files.length > 5) {
            return res.status(400).json({ error: 'Máximo 5 fotos por paseo' });
        }

        const photoData = req.files.map(file => ({
            walkAssignmentId: id,
            uploaderId: userId,
            url: (file.path && file.path.startsWith('http'))
                ? file.path
                : `/uploads/walk-photos/${file.filename}`
        }));

        await prisma.walkPhoto.createMany({
            data: photoData
        });

        res.status(201).json({ message: 'Fotos subidas con éxito' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al subir fotos' });
    }
};

export const getWalkPhotos = async (req, res) => {
    try {
        const { id } = req.params;

        const photos = await prisma.walkPhoto.findMany({
            where: { walkAssignmentId: id }
        });

        res.json(photos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener fotos' });
    }
};

export const markPaid = async (req, res) => {
    try {
        const { id } = req.params;

        const assignment = await prisma.walkAssignment.findUnique({
            where: { id },
            include: { walkRequest: true }
        });

        if (!assignment) return res.status(404).json({ error: 'Asignación no encontrada' });
        if (assignment.walkRequest.ownerId !== req.user.userId) return res.status(403).json({ error: 'No autorizado' });
        if (assignment.status !== 'COMPLETED') return res.status(400).json({ error: 'Solo se pueden pagar paseos finalizados' });
        if (assignment.paymentStatus === 'PAID') return res.status(400).json({ error: 'Este paseo ya figura como pagado' });

        const updated = await prisma.walkAssignment.update({
            where: { id },
            data: {
                paymentStatus: 'PAID',
                paidAt: new Date()
            }
        });

        res.json({ message: 'Pago registrado con éxito', assignment: updated });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al marcar como pagado' });
    }
};

export const getWalkerPayments = async (req, res) => {
    try {
        const { userId } = req.user;
        const { from, to, page = 1, limit = 20, onlyPending = 'false' } = req.query;

        const where = {
            walkerId: userId,
            status: 'COMPLETED'
        };

        if (from && to) {
            where.actualEndTime = {
                gte: new Date(from),
                lte: new Date(to)
            };
        }

        if (onlyPending === 'true') {
            where.OR = [
                { paymentStatus: 'UNPAID' },
                { platformFeeStatus: 'DUE' }
            ];
        }

        const [items, total] = await Promise.all([
            prisma.walkAssignment.findMany({
                where,
                include: {
                    walkRequest: {
                        include: {
                            dog: { select: { name: true } },
                            owner: { select: { firstName: true, lastName: true } }
                        }
                    }
                },
                orderBy: { actualEndTime: 'desc' },
                skip: (parseInt(page) - 1) * parseInt(limit),
                take: parseInt(limit)
            }),
            prisma.walkAssignment.count({ where })
        ]);

        // Summaries
        const allCompleted = await prisma.walkAssignment.findMany({
            where: { walkerId: userId, status: 'COMPLETED' }
        });

        const summary = allCompleted.reduce((acc, curr) => {
            acc.totalEarningsGross += curr.agreedPrice;
            if (curr.paymentStatus === 'PAID') acc.totalPaidByOwners += curr.agreedPrice;
            else acc.totalUnpaidByOwners += curr.agreedPrice;

            if (curr.platformFeeStatus === 'DUE') acc.totalPlatformFeesDue += curr.platformFeeAmount;
            else acc.totalPlatformFeesSettled += curr.platformFeeAmount;

            return acc;
        }, {
            totalEarningsGross: 0,
            totalPaidByOwners: 0,
            totalUnpaidByOwners: 0,
            totalPlatformFeesDue: 0,
            totalPlatformFeesSettled: 0
        });

        res.json({
            items,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            },
            summary
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener reporte de pagos' });
    }
};

// ... existing functions ...

export const markArrived = async (req, res) => {
    try {
        const { id } = req.params;
        const assignment = await prisma.walkAssignment.findUnique({
            where: { id },
            include: { walkRequest: { include: { owner: true } } }
        });

        if (!assignment) return res.status(404).json({ error: 'Asignación no encontrada' });
        if (assignment.walkerId !== req.user.userId) return res.status(403).json({ error: 'No autorizado' });

        // Update arrived timestamp
        await prisma.walkAssignment.update({
            where: { id },
            data: { walkerArrivedAt: new Date() }
        });

        // Notify Owner
        await createNotification({
            userId: assignment.walkRequest.ownerId,
            type: 'WALKER_ARRIVED',
            title: '¡El paseador ha llegado! 📍',
            message: `Tu paseador ya está en el punto de encuentro. Por favor, entrega a tu mascota.`,
            link: `/walk-assignments/${id}/track`
        });

        res.json({ message: 'Llegada notificada' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al marcar llegada' });
    }
};

export const checkWalkReminders = async (req, res) => {
    // This endpoint should be called by a CRON job every 5 minutes
    try {
        const now = new Date();
        const assignments = await prisma.walkAssignment.findMany({
            where: { status: 'PENDING' },
            include: { walkRequest: true }
        });

        let notificationsSent = 0;

        for (const assignment of assignments) {
            // Calculate start time
            const date = new Date(assignment.walkRequest.date);
            const [hours, minutes] = assignment.walkRequest.startTime.split(':');
            const startDateTime = new Date(date);
            startDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

            const diffMinutes = (startDateTime - now) / 60000;

            // 30 Minute Reminder (Window: 25-35 min)
            if (diffMinutes >= 25 && diffMinutes <= 35) {
                const alreadySent = await prisma.notification.findFirst({
                    where: {
                        userId: assignment.walkerId,
                        type: 'WALK_REMINDER',
                        message: { contains: '30 minutos' },
                        createdAt: { gte: new Date(now.getTime() - 20 * 60000) } // Check last 20 mins
                    }
                });

                if (!alreadySent) {
                    await createNotification({
                        userId: assignment.walkerId,
                        type: 'WALK_REMINDER',
                        title: '⏰ Tu paseo comienza en 30 min',
                        message: 'Recuerda que llegar tarde afecta tu calificación. ¡Prepárate!',
                        link: `/walker/dashboard`
                    });
                    notificationsSent++;
                }
            }

            // 10 Minute Reminder (Window: 5-15 min)
            if (diffMinutes >= 5 && diffMinutes <= 15) {
                const alreadySent = await prisma.notification.findFirst({
                    where: {
                        userId: assignment.walkerId,
                        type: 'WALK_REMINDER',
                        message: { contains: '10 minutos' },
                        createdAt: { gte: new Date(now.getTime() - 10 * 60000) }
                    }
                });

                if (!alreadySent) {
                    await createNotification({
                        userId: assignment.walkerId,
                        type: 'WALK_REMINDER',
                        title: '🚀 Tu paseo comienza en 10 min',
                        message: '¡Ya deberías estar cerca! Marca "Ya llegué" cuando estés en el punto.',
                        link: `/walker/dashboard`
                    });
                    notificationsSent++;
                }
            }
        }

        res.json({ message: `Checked assignments. Sent ${notificationsSent} reminders.` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error checking reminders' });
    }
};

export const settlePlatformFees = async (req, res) => {
    try {
        const { assignmentIds } = req.body;
        // This is a prepared service for admins
        if (!assignmentIds || !Array.isArray(assignmentIds)) {
            return res.status(400).json({ error: 'Se requiere lista de IDs de asignaciones' });
        }

        const updated = await prisma.walkAssignment.updateMany({
            where: { id: { in: assignmentIds } },
            data: {
                platformFeeStatus: 'SETTLED',
                platformFeeSettledAt: new Date()
            }
        });

        res.json({ message: `${updated.count} comisiones liquidadas con éxito` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al liquidar comisiones' });
    }
};

export const getWalkerStats = async (req, res) => {
    try {
        const walkerId = req.user.userId;

        const [totalWalks, earnings, user] = await Promise.all([
            prisma.walkAssignment.count({
                where: { walkerId, status: 'COMPLETED' }
            }),
            prisma.walkAssignment.aggregate({
                where: { walkerId, status: 'COMPLETED' },
                _sum: { agreedPrice: true }
            }),
            prisma.user.findUnique({
                where: { id: walkerId },
                select: { averageRating: true }
            })
        ]);

        res.json({
            totalWalks,
            rating: user?.averageRating || 5.0,
            earnings: earnings._sum.agreedPrice || 0
        });
    } catch (error) {
        console.error('Error getting walker stats:', error);
        res.status(500).json({ error: 'Error al obtener estadísticas', details: error.message });
    }
};
