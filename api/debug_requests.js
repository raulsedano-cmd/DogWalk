import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const requests = await prisma.walkRequest.findMany({
        where: { status: 'OPEN' },
        select: { id: true, zone: true, latitude: true, longitude: true }
    });
    console.log('--- OPEN WALK REQUESTS ---');
    console.table(requests);

    const users = await prisma.user.findMany({
        where: { activeRole: 'WALKER', lastName: 'Sedano' },
        select: { id: true, firstName: true, lastName: true, baseZone: true, latitude: true, longitude: true, serviceRadiusKm: true }
    });
    console.log('--- WALKER DATA ---');
    console.table(users);
}

main().catch(console.error).finally(() => prisma.$disconnect());
