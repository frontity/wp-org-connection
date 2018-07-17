import { schema } from 'normalizr';

export const taxonomy = new schema.Entity(
  'taxonomy',
  {},
  {
    processStrategy(entity) {
      const result = { ...entity };
      result.taxonomy =
        result.taxonomy === 'post_tag' ? 'tag' : result.taxonomy;
      result.type = result.taxonomy;
      result.mst = 'taxonomy';
      return result;
    },
  },
);
export const taxonomies = new schema.Array(taxonomy);
