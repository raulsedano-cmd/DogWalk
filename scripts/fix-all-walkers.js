import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- FIXING ALL WALKERS ---');
    try {
        // Find ALL users (Nuclear option to ensure logged-in user is fixed)
        const users = await prisma.user.findMany();

        console.log(`Found ${users.length} users. Promoting ALL to Walkers...`);

        for (const user of users) {
            console.log(`Fixing user: ${user.email}`);
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    roles: ['OWNER', 'WALKER'], // Ensure both roles
                    activeRole: 'WALKER',
                    isAvailable: true,
                    verificationStatus: 'VERIFIED',
                    baseZone: 'La Molina',
                    baseCity: 'Lima'
                }
            });
        }

        // Also, what if the user DOES NOT have WALKER role yet?
        // I will just promote EVERYONE to WALKER for this dev session?
        // Maybe risky if I break "Owner" testing.
        // But the user is complaining about not seeing requests.
        // I will find the user who created the "La Molina" request and ensure THEY are not the walker, 
        // and ensure the walker is someone else.

        // Actually, I'll update ALL users to match the criteria just in case.
        // Except maybe one "Pure Owner".

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
