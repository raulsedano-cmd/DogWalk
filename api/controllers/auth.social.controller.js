import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { OAuth2Client } from 'google-auth-library';

const prisma = global.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (user) => {
    return jwt.sign(
        {
            userId: user.id,
            email: user.email,
            roles: [user.activeRole], // Maintain array format for frontend compatibility
            activeRole: user.activeRole
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

const handleSocialAuth = async (email, providerUserId, authProvider, firstName, lastName, preferredRole) => {
    // 1. Try to find user by provider specific ID
    let user = await prisma.user.findUnique({
        where: {
            authProvider_providerUserId: {
                authProvider,
                providerUserId
            }
        },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            // roles: true, // Field does not exist in DB
            activeRole: true,
            termsAccepted: true,
            verificationStatus: true,
            city: true,
            zone: true
        }
    });

    if (user) {
        // Since we only have one role column, switching role just updates that column.
        // If preferredRole is different from current activeRole, we update it.
        if (preferredRole && user.activeRole !== preferredRole) {
            user = await prisma.user.update({
                where: { id: user.id },
                data: { activeRole: preferredRole },
                select: {
                    id: true, email: true, firstName: true, lastName: true, phone: true,
                    activeRole: true, termsAccepted: true, verificationStatus: true,
                    city: true, zone: true
                }
            });
        }
        return user;
    }

    // 2. Try to find user by email (linked accounts)
    user = await prisma.user.findUnique({
        where: { email },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            // roles: true,
            activeRole: true,
            termsAccepted: true,
            verificationStatus: true,
            city: true,
            zone: true
        }
    });

    if (user) {
        // Link the account
        const updateData = {
            authProvider,
            providerUserId,
            emailVerified: true
        };

        if (preferredRole && user.activeRole !== preferredRole) {
            updateData.activeRole = preferredRole;
        }

        user = await prisma.user.update({
            where: { id: user.id },
            data: updateData,
            select: {
                id: true, email: true, firstName: true, lastName: true, phone: true,
                activeRole: true, termsAccepted: true, verificationStatus: true,
                city: true, zone: true
            }
        });
        return user;
    }

    // 3. Create new user
    // Note: We provide default values for mandatory fields. 
    // The frontend should check if profile is complete (e.g. phone, city, zone).
    return await prisma.user.create({
        data: {
            email,
            firstName,
            lastName,
            phone: '', // Placeholder, user will be prompted to complete
            city: '',  // Placeholder
            zone: '',  // Placeholder
            // roles: preferredRole === 'WALKER' ? ['OWNER', 'WALKER'] : ['OWNER'], // Removed
            activeRole: preferredRole || 'OWNER',
            authProvider,
            providerUserId,
            emailVerified: true
        },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            // roles: true,
            activeRole: true,
            termsAccepted: true,
            verificationStatus: true,
            city: true,
            zone: true
        }
    });
};

export const googleLogin = async (req, res) => {
    try {
        const { idToken, preferredRole } = req.body;
        if (!idToken) return res.status(400).json({ error: 'Token is required' });

        const ticket = await googleClient.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();

        const user = await handleSocialAuth(
            payload.email,
            payload.sub,
            'GOOGLE',
            payload.given_name || payload.name?.split(' ')[0] || 'User',
            payload.family_name || payload.name?.split(' ').slice(1).join(' ') || '',
            preferredRole
        );

        const token = generateToken(user);

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                roles: [user.activeRole],
                activeRole: user.activeRole,
                termsAccepted: user.termsAccepted,
                verificationStatus: user.verificationStatus,
                isProfileComplete: !!(user.phone && user.city && user.zone)
            }
        });
    } catch (error) {
        console.error('Google auth error:', error);
        res.status(401).json({ error: 'Invalid Google token' });
    }
};

export const facebookLogin = async (req, res) => {
    try {
        const { idToken, preferredRole } = req.body; // In Facebook, it's actually an access token usually
        if (!idToken) return res.status(400).json({ error: 'Token is required' });

        const response = await axios.get(`https://graph.facebook.com/me?fields=id,email,first_name,last_name&access_token=${idToken}`);
        const { id, email, first_name, last_name } = response.data;

        if (!email) return res.status(400).json({ error: 'Email not provided by Facebook' });

        const user = await handleSocialAuth(
            email,
            id,
            'FACEBOOK',
            first_name || 'User',
            last_name || '',
            preferredRole
        );

        const token = generateToken(user);

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                roles: [user.activeRole],
                activeRole: user.activeRole,
                termsAccepted: user.termsAccepted,
                verificationStatus: user.verificationStatus,
                isProfileComplete: !!(user.phone && user.city && user.zone)
            }
        });
    } catch (error) {
        console.error('Facebook auth error:', error);
        res.status(401).json({ error: 'Invalid Facebook token' });
    }
};

export const microsoftLogin = async (req, res) => {
    try {
        const { idToken, preferredRole } = req.body;
        if (!idToken) return res.status(400).json({ error: 'Token is required' });

        // Verify with Microsoft Graph
        const response = await axios.get('https://graph.microsoft.com/v1.0/me', {
            headers: { Authorization: `Bearer ${idToken}` }
        });
        const { id, mail, userPrincipalName, displayName, givenName, surname } = response.data;

        const email = mail || userPrincipalName;

        const user = await handleSocialAuth(
            email,
            id,
            'MICROSOFT',
            givenName || displayName?.split(' ')[0] || 'User',
            surname || displayName?.split(' ').slice(1).join(' ') || '',
            preferredRole
        );

        const token = generateToken(user);

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                roles: [user.activeRole],
                activeRole: user.activeRole,
                termsAccepted: user.termsAccepted,
                verificationStatus: user.verificationStatus,
                isProfileComplete: !!(user.phone && user.city && user.zone)
            }
        });
    } catch (error) {
        console.error('Microsoft auth error:', error);
        res.status(401).json({ error: 'Invalid Microsoft token' });
    }
};
