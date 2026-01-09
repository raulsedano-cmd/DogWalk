import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env_server') });

const prisma = new PrismaClient();

async function main() {
    // 1. Check current walker state
    const walker = await prisma.user.findFirst({
        where: { activeRole: 'WALKER' },
        orderBy: { updatedAt: 'desc' }
    });

    if (walker) {
        console.log(`WALKER: ${walker.firstName} ${walker.lastName}`);
        console.log(`Base Zone: "${walker.baseZone}"`);
        console.log(`Base City: "${walker.baseCity}"`);

        // 2. Check for requests matching the walker's base zone
        const searchZone = walker.baseZone || walker.baseCity || '';
        const matches = await prisma.walkRequest.findMany({
            where: {
                status: 'OPEN',
                zone: { contains: searchZone, mode: 'insensitive' }
            }
        });

        console.log(`\nRequests matching "${searchZone}": ${matches.length}`);
        if (matches.length > 0) {
            console.table(matches.map(m => ({ id: m.id.substring(0, 8), zone: m.zone })));
        } else {
            console.log('No direct matches found for this zone.');
        }

        // 3. List ALL OPEN requests to see what IS available
        const allOpen = await prisma.walkRequest.findMany({
            where: { status: 'OPEN' },
            select: { id: true, zone: true }
        });

        console.log('\n--- ALL OPEN REQUESTS IN DB ---');
        if (allOpen.length > 0) {
            console.table(allOpen.map(r => ({ id: r.id.substring(0, 8), zone: r.zone })));
        } else {
            console.log('Zero OPEN requests found in the entire DB.');
        }
    } else {
        console.log('No active walker found.');
    }
}

main().catch(err => {
    console.error('Final validation failed:', err);
}).finally(() => prisma.$disconnect());
