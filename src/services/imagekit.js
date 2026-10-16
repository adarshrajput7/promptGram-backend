import ImageKit from '@imagekit/nodejs';
import 'dotenv/config';

const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL
});

export const uploadToImageKit = async (fileBuffer, fileName, folder) => {

    const base64File = fileBuffer.toString('base64');

    try {
        const result = await imagekit.files.upload({
            file: base64File,
            fileName: fileName,
            folder: folder,
            useUniqueFileName: true
        });
        return result;

    } catch (error) {
        console.error("→ ImageKit error:", error);
        throw error;
    }
};

// ✅ Delete helper
export const deleteFromImageKit = async (fileId) => {
    if (!fileId) return null;

    try {
        const result = await imagekit.files.delete(fileId);
        console.log("✅ ImageKit delete success:", fileId);
        return result;
    } catch (error) {
        console.error("❌ ImageKit delete error:", error.message);
        // Delete fail ho jaye to bhi crash na ho
        return null;
    }
};