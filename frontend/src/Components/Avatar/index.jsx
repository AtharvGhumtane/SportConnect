import React, { useState, useEffect } from 'react';
import styles from './Avatar.module.css';

// Preset palette for athlete initials background
const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #10b981 0%, #059669 100%)', // Emerald
  'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', // Amber
  'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', // Blue
  'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', // Purple
  'linear-gradient(135deg, #ec4899 0%, #be185d 100%)', // Pink
  'linear-gradient(135deg, #06b6d4 0%, #0e7490 100%)', // Cyan
  'linear-gradient(135deg, #f97316 0%, #c2410c 100%)', // Orange
];

/**
 * Deterministically pick a gradient based on the athlete name or id
 */
function getGradientForName(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[index];
}

/**
 * Extract 1-2 character initials from name
 */
function getInitials(name = '') {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Check if the provided src is a valid remote URL or data URL
 */
function isValidImageUrl(src) {
  if (!src || typeof src !== 'string') return false;
  const trimmed = src.trim();
  if (trimmed === '' || trimmed === 'default.jpg' || trimmed.endsWith('/default.jpg')) {
    return false;
  }
  // Must be an HTTP/HTTPS URL, Cloudinary URL, Google image URL, or base64 data URI
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('/uploads/') // Local uploads if any
  );
}

export default function Avatar({
  src,
  alt = 'Athlete',
  name = '',
  size = 40,
  className = '',
  style = {},
  onClick,
}) {
  const [hasError, setHasError] = useState(false);

  // Reset error state if the src prop changes
  useEffect(() => {
    setHasError(false);
  }, [src]);

  const displayName = name || alt || 'Athlete';
  const initials = getInitials(displayName);
  const background = getGradientForName(displayName);

  const dimensionStyle = {
    width: typeof size === 'number' ? `${size}px` : size,
    height: typeof size === 'number' ? `${size}px` : size,
    minWidth: typeof size === 'number' ? `${size}px` : size,
    minHeight: typeof size === 'number' ? `${size}px` : size,
    fontSize: typeof size === 'number' ? `${Math.max(10, Math.floor(size * 0.4))}px` : '1rem',
    ...style,
  };

  const showImage = isValidImageUrl(src) && !hasError;

  return (
    <div
      className={`${styles.avatarContainer} ${className}`}
      style={{
        ...dimensionStyle,
        background: !showImage ? background : 'transparent',
      }}
      onClick={onClick}
      title={displayName}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt}
          className={styles.avatarImage}
          onError={() => setHasError(true)}
          loading="lazy"
        />
      ) : (
        <div className={styles.avatarFallback}>
          {initials ? (
            <span>{initials}</span>
          ) : (
            <i
              className="fa-solid fa-user"
              style={{ fontSize: typeof size === 'number' ? `${Math.max(10, Math.floor(size * 0.45))}px` : '1rem' }}
            />
          )}
        </div>
      )}
    </div>
  );
}
