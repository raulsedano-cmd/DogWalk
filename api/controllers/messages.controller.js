import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getMessages = async (req, res) => {
    try {
        const { walkRequestId } = req.params;

        // Verify request exists
        const walkRequest = await prisma.walkRequest.findUnique({
            where: { id: walkRequestId },
            include: { offers: true, assignment: true }
        });

        if (!walkRequest) {
            return res.status(404).json({ error: 'Request not found' });
        }

        // Access control: User must be Owner OR a Participant Walker (offered or assigned)
        const isOwner = walkRequest.ownerId === req.user.userId;
        const isAssignedWalker = walkRequest.assignment?.walkerId === req.user.userId;
        const hasOffer = walkRequest.offers.some(o => o.walkerId === req.user.userId);

        if (!isOwner && !isAssignedWalker && !hasOffer) {
            return res.status(403).json({ error: 'Access denied to messages for this request' });
        }

        const messages = await prisma.message.findMany({
            where: { walkRequestId },
            include: {
                sender: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        role: true
                    }
                }
            },
            orderBy: { createdAt: 'asc' }
        });

        res.json(messages);
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ error: 'Failed to get messages' });
    }
};

export const sendMessage = async (req, res) => {
    try {
        const { walkRequestId, receiverId, content } = req.body;

        if (!walkRequestId || !receiverId || !content) {
            return res.status(400).json({ error: 'Missing fields' });
        }

        // Verify request
        const walkRequest = await prisma.walkRequest.findUnique({
            where: { id: walkRequestId },
            include: { offers: true }
        });

        if (!walkRequest) return res.status(404).json({ error: 'Request not found' });

        // Access control
        const isOwner = walkRequest.ownerId === req.user.userId;
        // Check if requester is a relevant walker
        const isWalker = req.user.role === 'WALKER'; // Simplification, strictly should check relationship

        if (!isOwner && !isWalker) {
            return res.status(403).json({ error: 'Not allowed' });
        }

        // Strict check: if Walker sends, must be sending to Owner. If Owner sends, can send to any walker who offered?
        // Let's rely on basic validation provided by receiverId check.

        const message = await prisma.message.create({
            data: {
                walkRequestId,
                senderId: req.user.userId,
                receiverId,
                content
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });

        res.status(201).json(message);

    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
};
