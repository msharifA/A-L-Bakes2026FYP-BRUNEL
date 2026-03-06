import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";

const s3 = new S3Client({
  region: process.env.AWS_REGION || "eu-west-2",
});

const BUCKET = process.env.S3_BUCKET || "albakescomingsoon2026";
const CDN_BASE = process.env.CDN_URL;

export async function uploadEnquiryImage(fileBuffer, originalName, mimeType) {
  const ext = originalName.split(".").pop()?.toLowerCase() || "jpg";
  const uniqueName = `${crypto.randomUUID()}.${ext}`;
  const key = `enquiry-images/${uniqueName}`;

  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: fileBuffer,
    ContentType: mimeType,
  }));

  if (CDN_BASE) {
    return `${CDN_BASE}/${key}`;
  }
  return `https://${BUCKET}.s3.amazonaws.com/${key}`;
}
