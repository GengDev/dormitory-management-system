import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate } from '../middleware/auth.middleware';
import { logger } from '../utils/logger';
import { StorageService } from '../services/storage.service';

const router = Router();

// Configure storage
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        const uploadDir = 'uploads/receipts';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    },
});

// File filter
const fileFilter = (_req: any, file: any, cb: any) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only images (jpg, jpeg, png) and PDFs are allowed'));
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: fileFilter,
});

/**
 * @route   POST /api/upload/receipt
 * @desc    Upload payment receipt slip
 * @access  Private
 */
(router as any).post('/receipt', authenticate, upload.single('receipt'), async (req: any, res: any) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload a file',
            });
        }

        // Upload to Supabase
        const publicUrl = await StorageService.uploadReceipt(req.file.path, req.file.filename);

        logger.info(`File uploaded to Supabase: ${req.file.filename} by user ${req.user?.userId}`);

        return res.status(200).json({
            success: true,
            data: {
                url: publicUrl,
                filename: req.file.filename,
                mimetype: req.file.mimetype,
                size: req.file.size,
            },
        });
    } catch (error: any) {
        logger.error('Upload error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Server error during upload',
        });
    }
});

export default router;
