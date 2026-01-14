"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageService = void 0;
const supabase_1 = require("../utils/supabase");
const logger_1 = require("../utils/logger");
const fs_1 = __importDefault(require("fs"));
class StorageService {
    /**
     * Upload file to Supabase Storage
     * @param filePath Local path to the file
     * @param fileName Name to store in Supabase
     * @returns Public URL of the uploaded file
     */
    static async uploadReceipt(filePath, fileName) {
        try {
            const fileBuffer = fs_1.default.readFileSync(filePath);
            const { data, error } = await supabase_1.supabase.storage
                .from(this.BUCKET_NAME)
                .upload(fileName, fileBuffer, {
                contentType: 'image/jpeg', // Default, should ideally match file type
                upsert: true,
            });
            if (error) {
                throw error;
            }
            // Get public URL
            const { data: publicUrlData } = supabase_1.supabase.storage
                .from(this.BUCKET_NAME)
                .getPublicUrl(data.path);
            return publicUrlData.publicUrl;
        }
        catch (error) {
            logger_1.logger.error('Supabase Storage Upload Error:', error);
            throw new Error(`Failed to upload to Supabase: ${error.message}`);
        }
        finally {
            // Clean up local temporary file if it exists
            if (fs_1.default.existsSync(filePath)) {
                try {
                    fs_1.default.unlinkSync(filePath);
                }
                catch (unlinkError) {
                    logger_1.logger.warn(`Failed to delete local temp file ${filePath}:`, unlinkError);
                }
            }
        }
    }
}
exports.StorageService = StorageService;
StorageService.BUCKET_NAME = 'receipts';
//# sourceMappingURL=storage.service.js.map