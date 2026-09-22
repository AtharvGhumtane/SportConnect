/**
 * Resolves an avatar URL safely.
 * Returns the absolute HTTPS URL if valid (e.g. Cloudinary, Google, or remote CDN),
 * or null for legacy/broken local file references so <Avatar /> falls back to initials.
 */
export function resolveAvatarUrl(profilePicture) {
  if (!profilePicture || typeof profilePicture !== 'string') return null;
  const pic = profilePicture.trim();
  if (pic === '' || pic === 'default.jpg' || pic.endsWith('/default.jpg')) {
    return null;
  }
  if (pic.startsWith('http://') || pic.startsWith('https://') || pic.startsWith('data:image/')) {
    return pic;
  }
  // Legacy local file reference that no longer exists on ephemeral disk
  return null;
}

/**
 * Resolves post media URL safely.
 */
export function resolveMediaUrl(media, baseUrl = '') {
  if (!media || typeof media !== 'string') return null;
  const m = media.trim();
  if (m === '') return null;
  if (m.startsWith('http://') || m.startsWith('https://') || m.startsWith('data:')) {
    return m;
  }
  if (baseUrl) {
    return `${baseUrl}/uploads/${m}`;
  }
  return null;
}
