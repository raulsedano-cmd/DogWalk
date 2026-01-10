import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- FIXING DATES ---');
    try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        const updated = await prisma.walkRequest.updateMany({
            where: { status: 'OPEN' },
            data: { date: tomorrow }
        });

        console.log(`Updated ${updated.count} requests to date: ${tomorrow.toISOString()}`);

    } catch (error) {
        console.error('Error updating:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
