import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const id = 'c498dec1-a674-46ea-b3ce-2d15abf4f76f'; // From debug output
    const user = await prisma.user.findUnique({ where: { id } });
    console.log('User c498... is:', user ? user.email : 'Unknown');

    // Also find Raul by email
    const raul = await prisma.user.findFirst({ where: { email: { contains: 'raul' } } });
    console.log('Raul is:', raul ? raul.id : 'Not Found');
}
main();
