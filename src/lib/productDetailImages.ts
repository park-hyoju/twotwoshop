import { isPlaceholderProductImage } from './productImageStorage'

export function getDetailStackImages(images: string[]): string[] {
  return images.filter((url) => url.trim().length > 0 && !isPlaceholderProductImage(url))
}
