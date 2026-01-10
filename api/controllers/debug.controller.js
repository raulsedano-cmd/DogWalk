import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const debugWalkerView = async (req, res) => {
    try {
        const userId = req.user.userId;
        const activeRole = req.user.activeRole;

        // Get user info
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                email: true,
                roles: true,
                activeRole: true,
                isAvailable: true,
                baseZone: true,
                baseCity: true,
                verificationStatus: true
            }
        });

        // Get open requests
        const openRequests = await prisma.walkRequest.findMany({
            where: { status: 'OPEN' },
            select: {
                id: true,
                zone: true,
                date: true,
                ownerId: true
            },
            take: 10
        });

        // Check today's date
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        res.json({
            debug: {
                user: user,
                activeRole: activeRole,
                openRequestsCount: openRequests.length,
                openRequests: openRequests,
                serverDate: new Date().toISOString(),
                todayStart: today.toISOString(),
                message: 'Si openRequestsCount > 0 pero no los ves, verifica que: 1) isAvailable=true, 2) roles incluye WALKER, 3) date >= hoy, 4) zone coincide con baseZone'
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
