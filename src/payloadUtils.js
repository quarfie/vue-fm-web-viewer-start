import { toRaw } from 'vue'

/**
 * Sanitize model payload for persistence to FileMaker.
 * Removes transient fields that should not be stored:
 * - base64 signature image data
 * - presigned image URLs
 * - runtime-only state
 *
 * @param {Object} model - reactive model
 * @returns {Object} sanitized clone safe for persisting
 */
export function sanitizeForPersist(model) {
  const clone = JSON.parse(JSON.stringify(toRaw(model)))

  // Remove URLs from image entries
  if (clone.content?.images && typeof clone.content.images === 'object') {
    for (const imageEntry of Object.values(clone.content.images)) {
      if (imageEntry && typeof imageEntry === 'object') {
        delete imageEntry.url
      }

      if (imageEntry?.image && typeof imageEntry.image === 'object') {
        delete imageEntry.image.url
      }
    }
  }

  // Remove signature base64 data
  if (Array.isArray(clone.content?.signatures)) {
    for (const signature of clone.content.signatures) {
      if (signature?.user && typeof signature.user === 'object') {
        delete signature.user.signature
      }
    }
  }

  // Remove URLs from exhibit images
  if (Array.isArray(clone.content?.exhibits)) {
    for (const exhibit of clone.content.exhibits) {
      if (!exhibit?.images || typeof exhibit.images !== 'object') {
        continue
      }

      for (const image of Object.values(exhibit.images)) {
        if (image && typeof image === 'object') {
          delete image.url
        }
      }
    }
  }

  // Remove runtime state
  delete clone.runtime

  return clone
}
