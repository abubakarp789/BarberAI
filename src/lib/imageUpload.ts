export const MAX_UPLOAD_FILE_SIZE = 10 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 1200;
const JPEG_QUALITY = 0.86;

export async function fileToCompressedJpegDataUrl(file: File) {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please upload an image file.');
  }

  if (file.size > MAX_UPLOAD_FILE_SIZE) {
    throw new Error('Image must be smaller than 10MB.');
  }

  const sourceDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to process image.'));
    img.src = sourceDataUrl;
  });

  const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(image.width, image.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Image processing is unavailable in this browser.');
  }

  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
}
