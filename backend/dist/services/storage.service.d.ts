export declare class StorageService {
    private static BUCKET_NAME;
    /**
     * Upload file to Supabase Storage
     * @param filePath Local path to the file
     * @param fileName Name to store in Supabase
     * @returns Public URL of the uploaded file
     */
    static uploadReceipt(filePath: string, fileName: string): Promise<string>;
}
//# sourceMappingURL=storage.service.d.ts.map