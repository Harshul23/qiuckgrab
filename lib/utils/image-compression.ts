/**
 * Client-side image compression utility
 * Compresses and resizes images before upload to reduce payload size
 */

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeMB?: number;
}

const DEFAULT_OPTIONS: Required<CompressionOptions> = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.8,
  maxSizeMB: 2,
};

/**
 * Compresses an image file and returns it as a data URL
 * @param file - The image file to compress
 * @param options - Compression options
 * @returns Promise resolving to compressed image as data URL
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Calculate new dimensions
        let width = img.width;
        let height = img.height;

        if (width > opts.maxWidth || height > opts.maxHeight) {
          const ratio = Math.min(
            opts.maxWidth / width,
            opts.maxHeight / height
          );
          width = width * ratio;
          height = height * ratio;
        }

        // Create canvas and draw resized image
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob with compression
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to compress image"));
              return;
            }

            // Check if we need further compression
            const sizeMB = blob.size / (1024 * 1024);
            if (sizeMB > opts.maxSizeMB) {
              // Recursively compress with lower quality
              const newQuality = Math.max(0.1, opts.quality - 0.2);
              compressImage(file, { ...opts, quality: newQuality })
                .then(resolve)
                .catch(reject);
              return;
            }

            // Convert blob to data URL
            const reader2 = new FileReader();
            reader2.onload = (e2) => {
              resolve(e2.target?.result as string);
            };
            reader2.onerror = reject;
            reader2.readAsDataURL(blob);
          },
          file.type || "image/jpeg",
          opts.quality
        );
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Gets the estimated size reduction after compression
 * @param originalSize - Original file size in bytes
 * @returns Estimated compressed size in bytes
 */
export function estimateCompressedSize(originalSize: number): number {
  // Rough estimate: 70-90% reduction for typical images
  return Math.round(originalSize * 0.2);
}

