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
        where: { status: 'OPEN' },
        include: {
            dog: { select: { name: true, size: true } }
        }
    });

    console.log('\n--- OPEN WALK REQUESTS IN DB ---');
    if (openRequests.length === 0) {
        console.log('No OPEN requests found in the entire database.');
    } else {
        console.table(openRequests.map(r => ({
            id: r.id.substring(0, 8),
            dog: r.dog.name,
            size: r.dog.size,
            zone: r.zone,
            lat: r.latitude,
            lng: r.longitude,
            date: r.date.toISOString().split('T')[0]
        })));
    }

    // 2. Check the specific user state
    const walker = await prisma.user.findFirst({
        where: {
            OR: [
                { lastName: 'Sedano' },
                { activeRole: 'WALKER' }
            ]
        },
        orderBy: { updatedAt: 'desc' }
    });

    if (walker) {
        console.log('\n--- WALKER DATA (Most Recent Active) ---');
        console.table([{
            name: `${walker.firstName} ${walker.lastName}`,
            activeRole: walker.activeRole,
            isAvailable: walker.isAvailable,
            baseCity: walker.baseCity,
            baseZone: walker.baseZone,
            lat: walker.latitude,
            lng: walker.longitude,
            radius: walker.serviceRadiusKm
        }]);

        // 3. Attempt to simulate the exact query logic
        const radius = walker.serviceRadiusKm || 5;
        const latDelta = radius / 111;
        const lngDelta = radius / (111 * Math.cos(walker.latitude * Math.PI / 180));

        const matches = await prisma.walkRequest.findMany({
            where: {
                status: 'OPEN',
                OR: [
                    {
                        latitude: {
                            gte: walker.latitude - latDelta,
                            lte: walker.latitude + latDelta,
                        },
                        longitude: {
                            gte: walker.longitude - lngDelta,
                            lte: walker.longitude + lngDelta,
                        }
                    },
                    {
                        zone: {
                            contains: walker.baseZone || walker.baseCity || '___NONE___',
                            mode: 'insensitive'
                        }
                    }
                ]
            }
        });

        console.log('\n--- SIMULATED QUERY RESULTS ---');
        console.log(`Matching requests found: ${matches.length}`);
        if (matches.length > 0) {
            console.table(matches.map(m => ({ id: m.id.substring(0, 8), zone: m.zone })));
        }
    } else {
        console.log('No user found matching criteria.');
    }
}

main().catch(err => {
    console.error('Error executing debug script:', err);
}).finally(() => prisma.$disconnect());
