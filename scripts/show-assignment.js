import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const assignment = await prisma.walkAssignment.findFirst({
        include: { walker: true, walkRequest: true }
    });

    if (assignment) {
        console.log('Assignment Status:', assignment.status);
        console.log('Walker:', assignment.walker.email, assignment.walker.id);
        console.log('Owner Request:', assignment.walkRequest.status, assignment.walkRequest.ownerId);
    } else {
        console.log('No assignments found.');
    }
}

main();
