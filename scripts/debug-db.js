import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- DB DEBUG ---');
    try {
        const userCount = await prisma.user.count();
        console.log(`Users: ${userCount}`);

        const requestCount = await prisma.walkRequest.count();
        console.log(`WalkRequests: ${requestCount}`);

        const assignmentCount = await prisma.walkAssignment.count();
        console.log(`WalkAssignments: ${assignmentCount}`);

        const assignments = await prisma.walkAssignment.findMany({
            take: 5,
            select: {
                id: true,
                status: true,
                walkerId: true,
                walkerArrivedAt: true
            }
        });
        console.log('Sample Assignments:', assignments);

        const requests = await prisma.walkRequest.findMany({
            take: 5,
            select: {
                id: true,
                status: true,
                zone: true,
                date: true // Check if date is in past
            }
        });
        console.log('Sample Requests:', requests);

        const users = await prisma.user.findMany({
            where: { roles: { has: 'WALKER' } },
            select: {
                id: true,
                firstName: true,
                isAvailable: true,
                activeRole: true
            }
        });
        console.log('Walkers:', users);

    } catch (error) {
        console.error('Error connecting/querying:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
