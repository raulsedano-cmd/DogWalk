import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// Cloudinary Config
const useCloudinary = (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) || process.env.CLOUDINARY_URL;

if (useCloudinary) {
    if (process.env.CLOUDINARY_URL) {
        // Automatically uses CLOUDINARY_URL if present
        cloudinary.config(true);
    } else {
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET
        });
    }
}

// Helper to ensure directory exists (only for local dev, not Vercel)
const ensureDir = (dir) => {
    if (process.env.VERCEL) return; // Never try to mkdir on Vercel
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

const profileDir = 'uploads/profiles';
const verificationDir = 'uploads/verification';
const walkPhotosDir = 'uploads/walk-photos';
const dogPhotosDir = 'uploads/dog-photos';

// Only create directories in non-Vercel environments without Cloudinary
if (!useCloudinary && !process.env.VERCEL) {
    ensureDir(profileDir);
    ensureDir(verificationDir);
    ensureDir(walkPhotosDir);
    ensureDir(dogPhotosDir);
}

// Storage Configuration Creator
const getStorage = (folder, typePrefix) => {
    if (useCloudinary) {
        return new CloudinaryStorage({
            cloudinary: cloudinary,
            params: {
                folder: `dogwalk/${folder}`,
                allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
                public_id: (req, file) => {
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                    return `${typePrefix}-${uniqueSuffix}`;
                }
            },
        });
    }

    return multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, `uploads/${folder}`);
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, `${typePrefix}-${uniqueSuffix}${path.extname(file.originalname)}`);
        }
    });
};

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Formato de archivo no válido. Solo se permiten imágenes.'), false);
    }
};

export const upload = multer({
    storage: getStorage('profiles', 'profile'),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: fileFilter
});

export const verificationUpload = multer({
    storage: getStorage('verification', 'dni'),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: fileFilter
});

export const walkPhotosUpload = multer({
    storage: getStorage('walk-photos', 'walk'),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: fileFilter
});

export const dogPhotoUpload = multer({
    storage: getStorage('dog-photos', 'dog'),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: fileFilter
});

