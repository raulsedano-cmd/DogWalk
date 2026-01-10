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
            select: { id: true, status: true, walkerId: true, walkerArrivedAt: true }
        });
        console.log('Assignments:', assignments);

        const requests = await prisma.walkRequest.findMany({
            where: { status: 'OPEN' },
            select: { id: true, zone: true, date: true, ownerId: true }
        });
        console.log('Open Requests:', requests);

        /*
        const users = await prisma.user.findMany({
            select: {
                id: true,
                firstName: true,
                email: true,
                roles: true,
                activeRole: true,
                isAvailable: true
            }
        });
        console.log('All Users:', users);
        */

    } catch (error) {
        console.error('Error connecting/querying:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
