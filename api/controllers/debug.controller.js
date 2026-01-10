import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const debugDatabase = async (req, res) => {
    try {
        const [userCount, requestCount, assignmentCount] = await Promise.all([
            prisma.user.count(),
            prisma.walkRequest.count(),
            prisma.walkAssignment.count()
        ]);

        res.json({
            users: userCount,
            walkRequests: requestCount,
            walkAssignments: assignmentCount
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
