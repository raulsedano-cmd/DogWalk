import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = global.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

export const register = async (req, res) => {
    try {
        const { email, password, firstName, lastName, phone, role, city, zone, bio } = req.body;

        // Validation
        if (!email || !password || !firstName || !lastName || !phone || !role || !city || !zone) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (!['OWNER', 'WALKER'].includes(role)) {
            return res.status(400).json({ error: 'Role must be OWNER or WALKER' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
            select: { id: true, email: true } // Only need to check existence
        });

        if (existingUser) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                firstName,
                lastName,
                phone,
                roles: [role],
                activeRole: role,
                city,
                zone,
                bio: bio || '',
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                roles: true,
                activeRole: true,
                city: true,
                zone: true,
                bio: true,
                averageRating: true,
                termsAccepted: true,
                verificationStatus: true,
            },
        });

        // Generate JWT
        const token = jwt.sign(
            { userId: user.id, email: user.email, roles: user.roles, activeRole: user.activeRole },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user,
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Failed to register user' });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password, preferredRole } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user
        let user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                password: true,
                firstName: true,
                lastName: true,
                phone: true,
                roles: true,
                activeRole: true,
                termsAccepted: true,
                verificationStatus: true,
                city: true,
                zone: true
            }
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Handle preferredRole sync before token generation
        if (preferredRole && user.roles.includes(preferredRole) && user.activeRole !== preferredRole) {
            user = await prisma.user.update({
                where: { id: user.id },
                data: { activeRole: preferredRole },
                select: {
                    id: true,
                    email: true,
                    password: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                    roles: true,
                    activeRole: true,
                    termsAccepted: true,
                    verificationStatus: true,
                    city: true,
                    zone: true
                }
            });
        }

        // Generate JWT
        const token = jwt.sign(
            { userId: user.id, email: user.email, roles: user.roles, activeRole: user.activeRole },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        // Return user without password
        const { password: _, ...userWithoutPassword } = user;

        res.json({
            message: 'Login successful',
            token,
            user: userWithoutPassword,
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Failed to login' });
    }
};
