import { PrismaClient } from '@prisma/client';
import { createNotification } from './notifications.controller.js';

const prisma = new PrismaClient();

export const getWalkRequests = async (req, res) => {
    try {
        const { page = 1, limit = 10, city, zone, size, status } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        const where = {};

        // For walkers: show only OPEN requests that are in the future or today
        if (req.user.activeRole === 'WALKER') {
            where.status = 'OPEN';

            // Filter out past requests
            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);
            where.date = { gte: startOfToday };

            const walker = await prisma.user.findUnique({
                where: { id: req.user.userId },
                select: { isAvailable: true, latitude: true, longitude: true, serviceRadiusKm: true, baseCity: true, baseZone: true }
            });

            // Removed strict isAvailable check to allow browsing the market while offline

            // PRECISION FILTERING: Priority logic
            if (city || zone) {
                // If the walker explicitly searches, prioritize 'zone' field mapping
                // Since city column doesn't exist on WalkRequest table yet, we search within 'zone'
                const searchString = zone || city;
                if (searchString) {
                    where.zone = { contains: searchString, mode: 'insensitive' };
                }
            } else if (walker.latitude && walker.longitude) {
                // Default: Hybrid GPS + Zone matching
                const radius = walker.serviceRadiusKm || 5;
                const latDelta = radius / 111;
                const lngDelta = radius / (111 * Math.cos(walker.latitude * Math.PI / 180));

                where.OR = [
                    {
                        // Match by precise coordinates
                        latitude: {
                            gte: walker.latitude - latDelta,
                            lte: walker.latitude + latDelta,
                        },
                        longitude: {
                            gte: walker.longitude - lngDelta,
                            lte: walker.longitude + lngDelta,
                        }
                    },
                    {
                        // OR match by Zone name (District) as backup
                        zone: {
                            contains: walker.baseZone || walker.baseCity,
                            mode: 'insensitive'
                        }
                    }
                ];
            } else if (walker.baseZone || walker.baseCity) {
                // Fallback to zone string matching if no coordinates and no manual filter
                where.zone = {
                    contains: walker.baseZone || walker.baseCity,
                    mode: 'insensitive'
                };
            }

        } else if (req.user.activeRole === 'OWNER') {
            where.ownerId = req.user.userId;
            if (status) where.status = status;
        }

        // Filter by dog size if provided
        if (size && ['SMALL', 'MEDIUM', 'LARGE'].includes(size)) {
            where.dog = { size };
        }

        const [requests, total] = await Promise.all([
            prisma.walkRequest.findMany({
                where,
                include: {
                    dog: true,
                    owner: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            city: true,
                            zone: true,
                            phone: true,
                        },
                    },
                },
                orderBy: { date: 'asc' },
                skip,
                take,
            }),
            prisma.walkRequest.count({ where }),
        ]);

        res.json({
            requests,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (error) {
        console.error('Get walk requests error:', error);
        res.status(500).json({ error: 'Failed to get walk requests' });
    }
};

export const getWalkRequestById = async (req, res) => {
    try {
        const { id } = req.params;

        const request = await prisma.walkRequest.findUnique({
            where: { id },
            include: {
                dog: true,
                owner: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                        city: true,
                        zone: true,
                        profilePhotoUrl: true,
                    },
                },
                offers: {
                    include: {
                        walker: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                averageRating: true,
                                bio: true,
                                profilePhotoUrl: true,
                                isVerifiedWalker: true,
                            },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                },
                assignment: {
                    include: {
                        walker: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                phone: true,
                                averageRating: true,
                                profilePhotoUrl: true,
                            },
                        },
                    },
                },
            },
        });

        if (!request) {
            return res.status(404).json({ error: 'Walk request not found' });
        }

        res.json(request);
    } catch (error) {
        console.error('Get walk request error:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            meta: error.meta
        });
        res.status(500).json({
            error: 'Failed to get walk request',
            details: process.env.NODE_ENV === 'production' ? undefined : error.message
        });
    }
};

export const createWalkRequest = async (req, res) => {
    try {
        const {
            dogId,
            date,
            startTime,
            durationMinutes,
            zone,
            suggestedPrice,
            details,
            latitude,
            longitude
        } = req.body;

        // Validation
        if (!dogId || !date || !startTime || !durationMinutes || !zone || !suggestedPrice) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Verify dog belongs to user
        const dog = await prisma.dog.findUnique({
            where: { id: dogId },
        });

        if (!dog) {
            return res.status(404).json({ error: 'Dog not found' });
        }

        if (dog.ownerId !== req.user.userId) {
            return res.status(403).json({ error: 'You can only create requests for your own dogs' });
        }

        const request = await prisma.walkRequest.create({
            data: {
                ownerId: req.user.userId,
                dogId,
                date: new Date(date),
                startTime,
                durationMinutes: parseInt(durationMinutes),
                zone,
                suggestedPrice: parseFloat(suggestedPrice),
                details: details || null,
                status: 'OPEN',
                latitude: latitude ? parseFloat(latitude) : null,
                longitude: longitude ? parseFloat(longitude) : null,
                // country: req.body.country || null,  
                // city: req.body.city || null,        
                addressType: req.body.addressType || null,
                addressReference: req.body.addressReference || null,
            },
            include: {
                dog: true,
            },
        });

        res.status(201).json({
            message: 'Walk request created successfully',
            request,
        });

        // NOTIFICATION: Notify available walkers in the same zone
        try {
            const availableWalkers = await prisma.user.findMany({
                where: {
                    activeRole: 'WALKER',
                    isAvailable: true,
                    baseZone: request.zone || undefined,  // Use zone instead of city
                },
                select: { id: true }
            });

            for (const walker of availableWalkers) {
                await createNotification({
                    userId: walker.id,
                    type: 'WALK_REQUEST_CREATED',
                    title: '¡Nuevo paseo disponible!',
                    message: `Hay un nuevo paseo para ${request.dog.name} en tu zona.`,
                    link: `/walk-requests/${request.id}`
                });
            }
        } catch (notifierErr) {
            console.error('Notifier error (WALK_REQUEST_CREATED):', notifierErr);
        }
    } catch (error) {
        console.error('Create walk request detailed error:', error);
        // Log inputs for debugging
        console.error('Inputs:', {
            body: req.body,
            user: req.user.userId
        });
        if (error.code) console.error('Prisma Error Code:', error.code);
        if (error.meta) console.error('Prisma Error Meta:', error.meta);

        res.status(500).json({
            error: 'Failed to create walk request',
            details: error.message, // Temporary for debugging
            prismaCode: error.code
        });
    }
};

export const updateWalkRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            date, startTime, durationMinutes, zone, suggestedPrice, details,
            latitude, longitude, country, city, addressType, addressReference
        } = req.body;

        // Check if request exists and belongs to user
        const existingRequest = await prisma.walkRequest.findUnique({
            where: { id },
        });

        if (!existingRequest) {
            return res.status(404).json({ error: 'Walk request not found' });
        }

        if (existingRequest.ownerId !== req.user.userId) {
            return res.status(403).json({ error: 'You can only update your own requests' });
        }

        if (existingRequest.status === 'ASSIGNED' || existingRequest.status === 'COMPLETED') {
            return res.status(400).json({
                error: 'Cannot update request that is already assigned or completed'
            });
        }

        const updateData = {};
        if (date) updateData.date = new Date(date);
        if (startTime) updateData.startTime = startTime;
        if (durationMinutes) updateData.durationMinutes = parseInt(durationMinutes);
        if (zone) updateData.zone = zone;
        if (suggestedPrice) updateData.suggestedPrice = parseFloat(suggestedPrice);
        if (details !== undefined) updateData.details = details || null;
        if (latitude !== undefined) updateData.latitude = latitude ? parseFloat(latitude) : null;
        if (longitude !== undefined) updateData.longitude = longitude ? parseFloat(longitude) : null;
        // if (country !== undefined) updateData.country = country;  // PENDING: DB migration blocked
        // if (city !== undefined) updateData.city = city;            // PENDING: DB migration blocked
        if (addressType !== undefined) updateData.addressType = addressType;
        if (addressReference !== undefined) updateData.addressReference = addressReference;

        const request = await prisma.walkRequest.update({
            where: { id },
            data: updateData,
            include: {
                dog: true,
            },
        });

        res.json({
            message: 'Walk request updated successfully',
            request,
        });
    } catch (error) {
        console.error('Update walk request error:', error);
        res.status(500).json({ error: 'Failed to update walk request' });
    }
};

export const cancelWalkRequest = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if request exists and belongs to user
        const existingRequest = await prisma.walkRequest.findUnique({
            where: { id },
        });

        if (!existingRequest) {
            return res.status(404).json({ error: 'Walk request not found' });
        }

        if (existingRequest.ownerId !== req.user.userId) {
            return res.status(403).json({ error: 'You can only cancel your own requests' });
        }

        if (existingRequest.status === 'COMPLETED') {
            return res.status(400).json({ error: 'Cannot cancel completed request' });
        }

        const request = await prisma.walkRequest.update({
            where: { id },
            data: { status: 'CANCELLED' },
        });

        res.json({
            message: 'Walk request cancelled successfully',
            request,
        });

        // NOTIFICATION: Notify walkers who made offers
        try {
            const offers = await prisma.offer.findMany({
                where: { walkRequestId: id },
                select: { walkerId: true }
            });

            for (const offer of offers) {
                await createNotification({
                    userId: offer.walkerId,
                    type: 'WALK_CANCELLED',
                    title: 'Paseo cancelado',
                    message: `El dueño ha cancelado la solicitud de paseo.`,
                    link: `/walk-requests/${id}`
                });
            }
        } catch (notifierErr) {
            console.error('Notifier error (WALK_CANCELLED - cancel):', notifierErr);
        }
    } catch (error) {
        console.error('Cancel walk request error:', error);
        res.status(500).json({ error: 'Failed to cancel walk request' });
    }
};
export const deleteWalkRequest = async (req, res) => {
    try {
        const { id } = req.params;

        const existingRequest = await prisma.walkRequest.findUnique({
            where: { id },
        });

        if (!existingRequest) {
            return res.status(404).json({ error: 'Walk request not found' });
        }

        if (existingRequest.ownerId !== req.user.userId) {
            return res.status(403).json({ error: 'You can only delete your own requests' });
        }

        // Optional: restriction to only delete OPEN or CANCELLED requests
        if (existingRequest.status === 'ASSIGNED' || existingRequest.status === 'COMPLETED') {
            return res.status(400).json({ error: 'Cannot delete an assigned or completed request' });
        }

        await prisma.walkRequest.delete({
            where: { id },
        });

        res.json({ message: 'Walk request deleted successfully' });

        // NOTIFICATION: Notify walkers who made offers
        try {
            const offers = await prisma.offer.findMany({
                where: { walkRequestId: id },
                select: { walkerId: true }
            });

            for (const offer of offers) {
                await createNotification({
                    userId: offer.walkerId,
                    type: 'WALK_CANCELLED',
                    title: 'Paseo eliminado',
                    message: `La solicitud de paseo a la que enviaste oferta ha sido eliminada.`,
                    link: `/walker-dashboard`
                });
            }
        } catch (notifierErr) {
            console.error('Notifier error (WALK_CANCELLED - delete):', notifierErr);
        }
    } catch (error) {
        console.error('Delete walk request error:', error);
        res.status(500).json({ error: 'Failed to delete walk request' });
    }
};
