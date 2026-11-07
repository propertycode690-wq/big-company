"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImage = exports.s3Client = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const crypto_1 = __importDefault(require("crypto"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const region = process.env.AWS_REGION || 'us-east-1';
const bucketName = process.env.AWS_S3_BUCKET || process.env.AWS_S3_BUCKET_NAME || '';
// If explicit AWS credentials exist in .env (e.g. for local dev), use them.
// Otherwise, the AWS SDK automatically retrieves IAM Role credentials when hosted on AWS.
const clientConfig = { region };
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    clientConfig.credentials = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    };
}
exports.s3Client = new client_s3_1.S3Client(clientConfig);
/**
 * Uploads a base64 image data URL to AWS S3 and returns the public object URL.
 * Preserves the exact same signature and behavior as the previous uploadImage utility.
 */
const uploadImage = (fileStr_1, ...args_1) => __awaiter(void 0, [fileStr_1, ...args_1], void 0, function* (fileStr, folder = 'big_company_products') {
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
        }
        else if (mimeType.includes('png')) {
            extension = 'png';
        }
        else if (mimeType.includes('webp')) {
            extension = 'webp';
        }
        else if (mimeType.includes('gif')) {
            extension = 'gif';
        }
        else if (mimeType.includes('svg')) {
            extension = 'svg';
        }
        const fileName = `${folder}/${Date.now()}-${crypto_1.default.randomBytes(8).toString('hex')}.${extension}`;
        const command = new client_s3_1.PutObjectCommand({
            Bucket: bucketName,
            Key: fileName,
            Body: buffer,
            ContentType: mimeType,
        });
        yield exports.s3Client.send(command);
        // Virtual-hosted style URL (AWS standard for all regions)
        const publicUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${fileName}`;
        return publicUrl;
    }
    catch (error) {
        console.error('Error uploading to AWS S3:', error);
        throw new Error(`Failed to upload image to AWS S3: ${error.message}`);
    }
});
exports.uploadImage = uploadImage;
exports.default = exports.s3Client;
