import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getMyProfile = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                role: true,
                city: true,
                zone: true,
                latitude: true,
                longitude: true,
                bio: true,
                averageRating: true,
                // Enhanced profile
                profilePhotoUrl: true,
                isVerifiedWalker: true,
                isAvailable: true,
                baseCity: true,
                baseZone: true,
                addressType: true,
                addressReference: true,
                serviceRadiusKm: true,
                experienceText: true,
                acceptsSmall: true,
                acceptsMedium: true,
                acceptsLarge: true,
                maxDogsAtOnce: true,
                createdAt: true,
                updatedAt: true,
                termsAccepted: true,
                verificationStatus: true,
            },
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to get profile' });
    }
};

export const updateMyProfile = async (req, res) => {
    try {
        const {
            firstName, lastName, phone, city, zone, bio, role,
            // Enhanced fields
            profilePhotoUrl, isAvailable, baseCity, baseZone, serviceRadiusKm,
            experienceText, acceptsSmall, acceptsMedium, acceptsLarge, maxDogsAtOnce,
            addressType, addressReference
        } = req.body;

        const updateData = {};
        if (firstName) updateData.firstName = firstName;
        if (lastName) updateData.lastName = lastName;
        if (phone) updateData.phone = phone;
        if (city) updateData.city = city;
        if (zone) updateData.zone = zone;
        if (req.body.latitude !== undefined) updateData.latitude = parseFloat(req.body.latitude);
        if (req.body.longitude !== undefined) updateData.longitude = parseFloat(req.body.longitude);
        if (bio !== undefined) updateData.bio = bio;
        if (addressType !== undefined) updateData.addressType = addressType;
        if (addressReference !== undefined) updateData.addressReference = addressReference;

        // Handle Profile Photo Upload
        if (req.file) {
            updateData.profilePhotoUrl = `/uploads/profiles/${req.file.filename}`;
        } else if (profilePhotoUrl !== undefined) {
            updateData.profilePhotoUrl = profilePhotoUrl;
        }

        if (role && ['OWNER', 'WALKER'].includes(role)) {
            updateData.role = role;
        }

        // Enhanced walker fields
        if (req.user.role === 'WALKER' || role === 'WALKER') {
            if (isAvailable !== undefined) updateData.isAvailable = isAvailable === 'true' || isAvailable === true;
            if (baseCity !== undefined) updateData.baseCity = baseCity;
            if (baseZone !== undefined) updateData.baseZone = baseZone;
            if (serviceRadiusKm !== undefined) updateData.serviceRadiusKm = parseInt(serviceRadiusKm);
            if (experienceText !== undefined) updateData.experienceText = experienceText;
            if (acceptsSmall !== undefined) updateData.acceptsSmall = acceptsSmall === 'true' || acceptsSmall === true;
            if (acceptsMedium !== undefined) updateData.acceptsMedium = acceptsMedium === 'true' || acceptsMedium === true;
            if (acceptsLarge !== undefined) updateData.acceptsLarge = acceptsLarge === 'true' || acceptsLarge === true;
            if (maxDogsAtOnce !== undefined) updateData.maxDogsAtOnce = parseInt(maxDogsAtOnce);
        }

        const user = await prisma.user.update({
            where: { id: req.user.userId },
            data: updateData,
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                role: true,
                city: true,
                zone: true,
                latitude: true,
                longitude: true,
                bio: true,
                averageRating: true,
                // Enhanced profile
                profilePhotoUrl: true,
                isVerifiedWalker: true,
                isAvailable: true,
                baseCity: true,
                baseZone: true,
                addressType: true,
                addressReference: true,
                serviceRadiusKm: true,
                experienceText: true,
                acceptsSmall: true,
                acceptsMedium: true,
                acceptsLarge: true,
                maxDogsAtOnce: true,
                termsAccepted: true,
                verificationStatus: true,
            },
        });

        res.json({
            message: 'Profile updated successfully',
            user,
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
};

export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
                city: true,
                zone: true,
                latitude: true,
                longitude: true,
                bio: true,
                averageRating: true,
                // Enhanced profile (public)
                profilePhotoUrl: true,
                isVerifiedWalker: true,
                isAvailable: true,
                baseCity: true,
                baseZone: true,
                experienceText: true,
                acceptsSmall: true,
                acceptsMedium: true,
                acceptsLarge: true,
                maxDogsAtOnce: true,
                addressType: true,
                addressReference: true,
                createdAt: true,
            },
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user' });
    }
};
