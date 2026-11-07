import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';
import * as dotenv from 'dotenv';

dotenv.config();

const region = process.env.AWS_REGION || 'us-east-1';
const bucketName = process.env.AWS_S3_BUCKET || process.env.AWS_S3_BUCKET_NAME || '';

// If explicit AWS credentials exist in .env (e.g. for local dev), use them.
// Otherwise, the AWS SDK automatically retrieves IAM Role credentials when hosted on AWS.
const clientConfig: any = { region };

if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  clientConfig.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  };
}

export const s3Client = new S3Client(clientConfig);

/**
 * Uploads a base64 image data URL to AWS S3 and returns the public object URL.
 * Preserves the exact same signature and behavior as the previous uploadImage utility.
 */
export const uploadImage = async (fileStr: string, folder: string = 'big_company_products'): Promise<string> => {
  try {
    // If it's already an uploaded URL or not a base64 data URI, return as-is
    if (!fileStr || !fileStr.startsWith('data:image')) {
      return fileStr;
    }

    if (!bucketName) {
      console.error('AWS_S3_BUCKET is not defined in environment variables');
      throw new Error('AWS_S3_BUCKET is not configured in .env');
    }

    const commaIndex = fileStr.indexOf(',');
    if (commaIndex === -1) {
      throw new Error('Invalid base64 image format: missing data comma');
    }

    const meta = fileStr.slice(0, commaIndex);
    const base64Data = fileStr.slice(commaIndex + 1);
    const mimeMatch = meta.match(/data:([^;]+)/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
    const buffer = Buffer.from(base64Data, 'base64');

    // Determine extension from MIME type
    let extension = 'png';
    if (mimeType.includes('jpeg') || mimeType.includes('jpg')) {
      extension = 'jpg';
    } else if (mimeType.includes('png')) {
      extension = 'png';
    } else if (mimeType.includes('webp')) {
      extension = 'webp';
    } else if (mimeType.includes('gif')) {
      extension = 'gif';
    } else if (mimeType.includes('svg')) {
      extension = 'svg';
    }

    const fileName = `${folder}/${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: buffer,
      ContentType: mimeType,
    });

    await s3Client.send(command);

    // Virtual-hosted style URL (AWS standard for all regions)
    const publicUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${fileName}`;
    return publicUrl;
  } catch (error: any) {
    console.error('Error uploading to AWS S3:', error);
    throw new Error(`Failed to upload image to AWS S3: ${error.message}`);
  }
};

export default s3Client;
