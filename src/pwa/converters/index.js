/* eslint-disable no-underscore-dangle */
import { decode } from 'he';

export const single = entity => ({
  id: entity.id,
  type: entity.type,
  creationDate: new Date(entity.date).getTime(),
  modificationDate: new Date(entity.modified).getTime(),
  title: entity.title.rendered,
  slug: entity.slug,
  link: entity.link,
  content: entity.content.rendered,
  excerpt: entity.excerpt.rendered,
  author: entity.author,
  featured: entity.featured_media,
  taxonomiesMap: entity.taxonomiesMap,
  target: entity['post-target'],
  meta: {
    title: decode(
      (entity.yoast_meta && entity.yoast_meta.yoast_wpseo_title) || entity.title.rendered,
    ),
    description: (entity.yoast_meta && entity.yoast_meta.yoast_wpseo_desc) || '',
    canonical: (entity.yoast_meta && entity.yoast_meta.yoast_wpseo_canonical) || '',
  },
  mst: 'single',
});

export const taxonomy = entity => ({
  id: entity.id,
  mst: 'taxonomy',
  name: entity.name,
  slug: entity.slug,
  link: entity.link,
  type: entity.taxonomy,
  target: entity['term-target'],
  meta: {
    title: (entity.yoast_meta && entity.yoast_meta.yoast_wpseo_title) || entity.name,
    description: (entity.yoast_meta && entity.yoast_meta.yoast_wpseo_desc) || '',
    canonical: (entity.yoast_meta && entity.yoast_meta.yoast_wpseo_canonical) || '',
  },
});

export const author = entity => ({
  id: entity.id,
  mst: 'author',
  name: entity.name,
  slug: entity.slug,
  description: entity.description,
  link: entity.link,
  avatar: entity.avatar_urls && Object.values(entity.avatar_urls)[0].replace(/\?.*$/, ''),
});

export const media = entity => ({
  id: entity.id,
  creationDate: new Date(entity.date).getTime(),
  slug: entity.slug,
  alt: entity.alt_text,
  mimeType: entity.mime_type,
  mediaType: entity.media_type,
  title: entity.title.rendered,
  author: entity.author,
  original: {
    height: entity.media_details.height,
    width: entity.media_details.width,
    filename: entity.media_details.file,
    url: entity.source_url,
  },
  sizes:
    entity.media_details.sizes &&
    Object.values(entity.media_details.sizes).map(image => ({
      height: image.height,
      width: image.width,
      filename: image.file,
      url: image.source_url,
    })),
  mst: 'media',
});

export default entity => {
  if (entity.mst === 'media') return media(entity);
  else if (entity.mst === 'taxonomy') return taxonomy(entity);
  else if (entity.mst === 'author') return author(entity);
  return single(entity);
};
