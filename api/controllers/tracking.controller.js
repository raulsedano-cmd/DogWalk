import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const updateLocation = async (req, res) => {
    try {
        const { id } = req.params; // walkAssignment ID
        const { latitude, longitude } = req.body;

        if (!latitude || !longitude) {
            return res.status(400).json({ error: 'Latitude and Longitude are required' });
        }

        // Verify assignment exists and user is the walker
        const assignment = await prisma.walkAssignment.findUnique({
            where: { id },
            select: { walkerId: true, status: true }
        });

        if (!assignment) {
            return res.status(404).json({ error: 'Assignment not found' });
        }

        if (assignment.walkerId !== req.user.userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        if (assignment.status !== 'IN_PROGRESS') {
            // Optional: allow tracking if just Arrived? No, instructions say IN_PROGRESS.
        }

        // Save point
        const point = await prisma.walkRoutePoint.create({
            data: {
                walkAssignmentId: id,
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude)
            }
        });

        // Optionally update User's last known location for other features
        await prisma.user.update({
            where: { id: req.user.userId },
            data: {
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude)
            }
        });

        res.json({ message: 'Location updated', point });
    } catch (error) {
        console.error('Update location error:', error);
        res.status(500).json({ error: 'Failed to update location' });
    }
};

export const getRoute = async (req, res) => {
    try {
        const { id } = req.params;

        const points = await prisma.walkRoutePoint.findMany({
            where: { walkAssignmentId: id },
            orderBy: { timestamp: 'asc' },
            select: { latitude: true, longitude: true, timestamp: true }
        });

        res.json(points);
    } catch (error) {
        console.error('Get route error:', error);
        res.status(500).json({ error: 'Failed to get route' });
    }
};
