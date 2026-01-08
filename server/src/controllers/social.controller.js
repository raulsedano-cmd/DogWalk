import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Favorites
export const getFavorites = async (req, res) => {
    try {
        if (req.user.role !== 'OWNER') {
            return res.status(403).json({ error: 'Only owners can manage favorites' });
        }

        const favorites = await prisma.favoriteWalker.findMany({
            where: { ownerId: req.user.userId },
            include: {
                walker: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        averageRating: true,
                        profilePhotoUrl: true,
                        isVerifiedWalker: true,
                        bio: true,
                        baseCity: true,
                        baseZone: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json(favorites);
    } catch (error) {
        console.error('Get favorites error:', error);
        res.status(500).json({ error: 'Failed to get favorites' });
    }
};

export const addFavorite = async (req, res) => {
    try {
        const { walkerId } = req.params;

        if (req.user.role !== 'OWNER') {
            return res.status(403).json({ error: 'Only owners can manage favorites' });
        }

        // Verify walker exists
        const walker = await prisma.user.findUnique({
            where: { id: walkerId },
        });

        if (!walker || walker.role !== 'WALKER') {
            return res.status(404).json({ error: 'Walker not found' });
        }

        // Check if already favorite
        const existing = await prisma.favoriteWalker.findUnique({
            where: {
                ownerId_walkerId: {
                    ownerId: req.user.userId,
                    walkerId,
                },
            },
        });

        if (existing) {
            return res.status(400).json({ error: 'Walker already in favorites' });
        }

        const favorite = await prisma.favoriteWalker.create({
            data: {
                ownerId: req.user.userId,
                walkerId,
            },
        });

        res.status(201).json({ message: 'Added to favorites', favorite });
    } catch (error) {
        console.error('Add favorite error:', error);
        res.status(500).json({ error: 'Failed to add favorite' });
    }
};

export const removeFavorite = async (req, res) => {
    try {
        const { walkerId } = req.params;

        if (req.user.role !== 'OWNER') {
            return res.status(403).json({ error: 'Only owners can manage favorites' });
        }

        await prisma.favoriteWalker.delete({
            where: {
                ownerId_walkerId: {
                    ownerId: req.user.userId,
                    walkerId,
                },
            },
        });

        res.json({ message: 'Removed from favorites' });
    } catch (error) {
        // If not found, it's fine, consider it removed or handle P2025
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Favorite not found' });
        }
        console.error('Remove favorite error:', error);
        res.status(500).json({ error: 'Failed to remove favorite' });
    }
};

// Blocking
export const getBlockedWalkers = async (req, res) => {
    try {
        if (req.user.role !== 'OWNER') {
            return res.status(403).json({ error: 'Only owners can manage blocks' });
        }

        const blocked = await prisma.blockedWalker.findMany({
            where: { ownerId: req.user.userId },
            include: {
                walker: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });

        res.json(blocked);
    } catch (error) {
        console.error('Get blocked walkers error:', error);
        res.status(500).json({ error: 'Failed to get blocked walkers' });
    }
};

export const blockWalker = async (req, res) => {
    try {
        const { walkerId } = req.params;

        if (req.user.role !== 'OWNER') {
            return res.status(403).json({ error: 'Only owners can manage blocks' });
        }

        // Verify walker exists
        const walker = await prisma.user.findUnique({
            where: { id: walkerId },
        });

        if (!walker || walker.role !== 'WALKER') {
            return res.status(404).json({ error: 'Walker not found' });
        }

        // Check if already blocked
        const existing = await prisma.blockedWalker.findUnique({
            where: {
                ownerId_walkerId: {
                    ownerId: req.user.userId,
                    walkerId,
                },
            },
        });

        if (existing) {
            return res.status(400).json({ error: 'Walker already blocked' });
        }

        const block = await prisma.blockedWalker.create({
            data: {
                ownerId: req.user.userId,
                walkerId,
            },
        });

        // Optionally remove from favorites if blocked
        await prisma.favoriteWalker.deleteMany({
            where: {
                ownerId: req.user.userId,
                walkerId,
            },
        });

        res.status(201).json({ message: 'Walker blocked', block });
    } catch (error) {
        console.error('Block walker error:', error);
        res.status(500).json({ error: 'Failed to block walker' });
    }
};

export const unblockWalker = async (req, res) => {
    try {
        const { walkerId } = req.params;

        if (req.user.role !== 'OWNER') {
            return res.status(403).json({ error: 'Only owners can manage blocks' });
        }

        await prisma.blockedWalker.delete({
            where: {
                ownerId_walkerId: {
                    ownerId: req.user.userId,
                    walkerId,
                },
            },
        });

        res.json({ message: 'Walker unblocked' });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Block not found' });
        }
        console.error('Unblock walker error:', error);
        res.status(500).json({ error: 'Failed to unblock walker' });
    }
};
