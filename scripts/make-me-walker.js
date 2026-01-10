import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- PROMOTING USER TO WALKER ---');
    try {
        // Find the first user (usually the one logged in for dev)
        const user = await prisma.user.findFirst();

        if (!user) {
            console.log('No users found.');
            return;
        }

        console.log(`Updating user: ${user.email} (${user.id})`);

        const updated = await prisma.user.update({
            where: { id: user.id },
            data: {
                roles: { push: 'WALKER' }, // Add WALKER if not present. Warning: push might duplicate if array. Set might be safer.
                // Better: set roles to overlap unique
                roles: ['OWNER', 'WALKER'],
                activeRole: 'WALKER',
                isAvailable: true,
                verificationStatus: 'VERIFIED', // Auto verify to skip barriers
                baseZone: 'Condesa' // valid zone for matching
            }
        });

        console.log('User updated:', updated);

    } catch (error) {
        console.error('Error updating:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
