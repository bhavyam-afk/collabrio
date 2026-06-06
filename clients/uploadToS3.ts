import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { s3 } from "./s3"

export async function uploadToS3(
  fileBuffer: Buffer,
  key: string,
  contentType: string
) {
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: key,
    Body: fileBuffer,
    ContentType: contentType,
  })

  await s3.send(command)

  // Return both the stored key and the object URL (not necessarily public)
  const url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
  return { url, key }
}

export async function getPresignedUrl(key: string, expiresIn = 60 * 60) {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: key,
  })

  return getSignedUrl(s3, command, { expiresIn })
}
