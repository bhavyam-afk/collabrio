import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { s3 } from "./s3"

export async function uploadToS3(
  fileBuffer: Buffer,
  key: string,
  contentType: string,
  publicRead = false
) {
  const bucket = process.env.AWS_S3_BUCKET
  const region = process.env.AWS_REGION

  if (!bucket) {
    throw new Error("Missing AWS_S3_BUCKET environment variable")
  }

  // Note: ACLs are not included as many S3 buckets have ACLs disabled
  // Public access can be configured via bucket policies instead
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: fileBuffer,
    ContentType: contentType,
  })

  await s3.send(command)

  const url = region
    ? `https://${bucket}.s3.${region}.amazonaws.com/${key}`
    : `https://${bucket}.s3.amazonaws.com/${key}`
  return { url, key }
}

export async function getPresignedUrl(key: string, expiresIn = 60 * 60) {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: key,
  })

  return getSignedUrl(s3, command, { expiresIn })
}
