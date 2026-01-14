"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const logger_1 = require("../utils/logger");
const storage_service_1 = require("../services/storage.service");
const router = (0, express_1.Router)();
// Configure storage
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        const uploadDir = 'uploads/receipts';
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path_1.default.extname(file.originalname));
    },
});
// File filter
const fileFilter = (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path_1.default.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
        return cb(null, true);
    }
    else {
        cb(new Error('Only images (jpg, jpeg, png) and PDFs are allowed'));
    }
};
const upload = (0, multer_1.default)({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: fileFilter,
});
/**
 * @route   POST /api/upload/receipt
 * @desc    Upload payment receipt slip
 * @access  Private
 */
router.post('/receipt', auth_middleware_1.authenticate, upload.single('receipt'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload a file',
            });
        }
        // Upload to Supabase
        const publicUrl = await storage_service_1.StorageService.uploadReceipt(req.file.path, req.file.filename);
        logger_1.logger.info(`File uploaded to Supabase: ${req.file.filename} by user ${req.user?.userId}`);
        return res.status(200).json({
            success: true,
            data: {
                url: publicUrl,
                filename: req.file.filename,
                mimetype: req.file.mimetype,
                size: req.file.size,
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Upload error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Server error during upload',
        });
    }
});
exports.default = router;
//# sourceMappingURL=upload.routes.js.map