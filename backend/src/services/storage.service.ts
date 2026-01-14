import { supabase } from '../utils/supabase';
import { logger } from '../utils/logger';
import fs from 'fs';

export class StorageService {
    private static BUCKET_NAME = 'receipts';

    /**
     * Upload file to Supabase Storage
     * @param filePath Local path to the file
     * @param fileName Name to store in Supabase
     * @returns Public URL of the uploaded file
     */
    static async uploadReceipt(filePath: string, fileName: string): Promise<string> {
        try {
            const fileBuffer = fs.readFileSync(filePath);

            const { data, error } = await supabase.storage
                .from(this.BUCKET_NAME)
                .upload(fileName, fileBuffer, {
                    contentType: 'image/jpeg', // Default, should ideally match file type
                    upsert: true,
                });

            if (error) {
                throw error;
            }

            // Get public URL
            const { data: publicUrlData } = supabase.storage
                .from(this.BUCKET_NAME)
                .getPublicUrl(data.path);

            return publicUrlData.publicUrl;
        } catch (error: any) {
            logger.error('Supabase Storage Upload Error:', error);
            throw new Error(`Failed to upload to Supabase: ${error.message}`);
        } finally {
            // Clean up local temporary file if it exists
            if (fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                } catch (unlinkError) {
                    logger.warn(`Failed to delete local temp file ${filePath}:`, unlinkError);
                }
            }
        }
    }
}
