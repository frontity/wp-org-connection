/* eslint-disable no-use-before-define */
import { types } from 'mobx-state-tree';

export const Image = types.model('Image').props({
  height: types.number,
  width: types.number,
  filename: types.string,
  url: types.string,
});

export const Media = types.model('Media').props({
  id: types.identifier(types.number),
  creationDate: types.Date,
  slug: types.string,
  alt: types.string,
  mimeType: types.string,
  mediaType: types.string,
  title: types.string,
  author: types.reference(types.late(() => Author)),
  original: Image,
  sizes: types.array(Image),
});

export const Author = types.model('Author').props({
  id: types.identifier(types.number),
  name: types.string,
  slug: types.string,
  description: types.string,
  link: types.string,
  avatar: types.maybe(types.union(Media, types.string)),
});

export const Taxonomy = types.model('Taxonomy').props({
  id: types.identifier(types.number),
  name: types.string,
  slug: types.string,
  link: types.string,
  taxonomy: types.string,
});

export const Meta = types.model('Meta').props({
  description: types.maybe(types.string),
  canonical: types.maybe(types.string),
});

export const Post = types
  .model('Post')
  .props({
    id: types.identifier(types.number),
    fetching: types.optional(types.boolean, false),
    ready: types.optional(types.boolean, false),
    type: types.string,
    creationDate: types.maybe(types.Date),
    modificationDate: types.maybe(types.Date),
    title: types.maybe(types.string),
    slug: types.maybe(types.string),
    link: types.maybe(types.string),
    content: types.maybe(types.string),
    excerpt: types.maybe(types.string),
    author: types.maybe(types.reference(Author)),
    featured: types.maybe(types.reference(Media)),
    taxonomiesMap: types.optional(types.map(types.array(types.reference(Taxonomy))), {}),
    meta: types.maybe(Meta),
  })
  .views(self => {
    const taxonomies = {};
    return {
      get taxonomies() {
        self.taxonomiesMap.keys().forEach(taxonomy => {
          taxonomies[taxonomy] = self.taxonomiesMap.get(taxonomy);
        });
        return taxonomies;
      },
    };
  });

export const Any = types.union(snapshot => {
  if (snapshot.taxonomy) return Taxonomy;
  if (snapshot.name) return Author;
  if (snapshot.original) return Media;
  return Post;
}, Post, Taxonomy, Author, Media);