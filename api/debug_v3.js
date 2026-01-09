import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root
dotenv.config({ path: path.join(__dirname, '..', '.env_server') });

const prisma = new PrismaClient();

async function main() {
    console.log('Database URL loaded:', process.env.DATABASE_URL ? 'YES' : 'NO');

    // 1. Check ALL OPEN requests
    const openRequests = await prisma.walkRequest.findMany({
        where: { status: 'OPEN' }
    });

    console.log('\n--- OPEN WALK REQUESTS (BASIC) ---');
    if (openRequests.length === 0) {
        console.log('No OPEN requests found in the entire database.');
    } else {
        console.table(openRequests.map(r => ({
            id: r.id.substring(0, 8),
            zone: r.zone,
            lat: r.latitude,
            lng: r.longitude,
            status: r.status
        })));
    }

    // 2. Check the specific walker
    const walker = await prisma.user.findFirst({
        where: {
            activeRole: 'WALKER',
            lastName: 'Sedano'
        },
        orderBy: { updatedAt: 'desc' }
    });

    if (walker) {
        console.log('\n--- WALKER DATA ---');
        console.table([{
            name: `${walker.firstName} ${walker.lastName}`,
            baseZone: walker.baseZone,
            baseCity: walker.baseCity,
            lat: walker.latitude,
            lng: walker.longitude,
            radius: walker.serviceRadiusKm
        }]);

        // 3. Test filtering
        const searchZone = walker.baseZone || walker.baseCity || '___NONE___';
        console.log(`\nTesting visibility for zone: "${searchZone}"`);

        const zoneMatches = await prisma.walkRequest.findMany({
            where: {
                status: 'OPEN',
                zone: {
                    contains: searchZone,
                    mode: 'insensitive'
                }
            }
        });
        console.log(`Found ${zoneMatches.length} requests matching by zone name.`);
    }
}

main().catch(err => {
    console.error('Error executing debug script:', err);
}).finally(() => prisma.$disconnect());
