import React, { useEffect } from 'react';
import { Creator } from '../types/index.js';
import { updateDocumentSeo } from '../seo.js';

interface SeoMetadataProps {
  path: string;
  creators: Creator[];
}

export const SeoMetadata: React.FC<SeoMetadataProps> = ({ path, creators }) => {
  useEffect(() => {
    updateDocumentSeo(path, window.location.origin, creators);
  }, [path, creators]);

  return null;
};