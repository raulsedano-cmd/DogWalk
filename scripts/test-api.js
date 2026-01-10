import { getWalkRequests } from '../api/controllers/walk-requests.controller.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const maria = await prisma.user.findFirst({ where: { email: 'maria@example.com' } });
    if (!maria) { console.log('Maria not found'); return; }

    console.log(`Testing with User: ${maria.id} (${maria.email})`);

    const req = {
        user: { userId: maria.id, activeRole: 'WALKER' },
        query: { city: '', zone: '', limit: '10' }
    };

    const res = {
        json: (data) => console.log('Response DATA:', JSON.stringify(data.requests?.length, null, 2), 'requests found.'),
        status: (code) => {
            console.log(`Response STATUS: ${code}`);
            return { json: (err) => console.log('Response ERROR:', err) };
        }
    };

    try {
        await getWalkRequests(req, res);
    } catch (e) {
        console.error(e);
    }
}
main();
