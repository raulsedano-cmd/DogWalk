import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- CHECKING MOLINA ---');
    try {
        // 1. Check for requests in 'Molina'
        const molinaRequests = await prisma.walkRequest.findMany({
            where: {
                zone: { contains: 'Molina', mode: 'insensitive' }
            }
        });

        console.log(`Found ${molinaRequests.length} requests in La Molina.`);
        if (molinaRequests.length > 0) {
            console.log('Sample:', molinaRequests[0].zone);

            // 2. Update Walker to be in La Molina
            const user = await prisma.user.findFirst({
                where: { activeRole: 'WALKER' }
            });

            if (user) {
                console.log(`Updating Walker ${user.email} to zone: 'La Molina'`);
                await prisma.user.update({
                    where: { id: user.id },
                    data: { baseZone: 'La Molina', baseCity: 'Lima' }
                });
                console.log('Walker updated.');
            }
        } else {
            console.log('No requests found. Creating one...');
            // Create a dummy request in La Molina
            const owner = await prisma.user.findFirst({
                where: { NOT: { roles: { has: 'WALKER' } } } // Find a pure owner if possible
            });

            // If no pure owner, just use the first user
            const targetOwner = owner || await prisma.user.findFirst();

            if (!targetOwner) return;

            // Find or create a dog
            let dog = await prisma.dog.findFirst({ where: { ownerId: targetOwner.id } });
            if (!dog) {
                dog = await prisma.dog.create({
                    data: {
                        name: 'Bobby Molina',
                        size: 'MEDIUM',
                        ownerId: targetOwner.id
                    }
                });
            }

            const newReq = await prisma.walkRequest.create({
                data: {
                    ownerId: targetOwner.id,
                    dogId: dog.id,
                    date: new Date(new Date().setDate(new Date().getDate() + 1)), // Tomorrow
                    startTime: '10:00',
                    durationMinutes: 60,
                    zone: 'La Molina, Camacho',
                    suggestedPrice: 35,
                    status: 'OPEN',
                    details: 'Paseo tranquilo por la Av. La Molina'
                }
            });
            console.log('Created new request:', newReq.id);

            // Also update walker to La Molina
            const walker = await prisma.user.findFirst({ where: { activeRole: 'WALKER' } });
            if (walker) {
                await prisma.user.update({
                    where: { id: walker.id },
                    data: { baseZone: 'La Molina' }
                });
                console.log('Walker zone updated to La Molina.');
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
