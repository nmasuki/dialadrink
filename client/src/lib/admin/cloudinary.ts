import { v2 as cloudinary } from "cloudinary";

// CLOUDINARY_URL env var auto-configures the SDK
cloudinary.config();

export async function uploadImage(
  buffer: Buffer,
  folder: string = "products"
): Promise<{
  public_id: string;
  version: number;
  signature: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  url: string;
  secure_url: string;
}> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder, resource_type: "image" }, (error, result) => {
        if (error || !result) return reject(error || new Error("Upload failed"));
        resolve({
          public_id: result.public_id,
          version: result.version,
          signature: result.signature,
          width: result.width,
          height: result.height,
          format: result.format,
          resource_type: result.resource_type,
          url: result.url,
          secure_url: result.secure_url,
        });
      })
      .end(buffer);
  });
}

export async function deleteImage(publicId: string) {
  return cloudinary.uploader.destroy(publicId);
}
