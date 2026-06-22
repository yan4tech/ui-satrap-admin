import { useEffect, useState } from 'react';

function isImageValue(value) {
  if (value instanceof File) return value.type.startsWith('image/');
  if (typeof value === 'string') {
    return /\.(jpe?g|png|gif|webp|bmp|svg)(\?|$)/i.test(value);
  }
  return false;
}

function isPdfValue(value) {
  if (value instanceof File) return value.type === 'application/pdf';
  if (typeof value === 'string') return /\.pdf(\?|$)/i.test(value);
  return false;
}

function getFileName(value) {
  if (value instanceof File) return value.name;
  if (typeof value === 'string') {
    const segment = value.split('/').pop() || value;
    try {
      return decodeURIComponent(segment.split('?')[0]);
    } catch {
      return segment.split('?')[0];
    }
  }
  return '';
}

export function useFilePreview(value) {
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (!value) {
      setPreviewUrl(null);
      return undefined;
    }

    if (value instanceof File) {
      if (value.type.startsWith('image/')) {
        const objectUrl = URL.createObjectURL(value);
        setPreviewUrl(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
      }
      setPreviewUrl(null);
      return undefined;
    }

    if (typeof value === 'string' && isImageValue(value)) {
      setPreviewUrl(value);
      return undefined;
    }

    setPreviewUrl(null);
    return undefined;
  }, [value]);

  return {
    previewUrl,
    fileName: getFileName(value),
    isImage: isImageValue(value),
    isPdf: isPdfValue(value),
  };
}
