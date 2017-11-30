import { types, getParent } from 'mobx-state-tree';
import { Post } from './single';

export const Total = types
  .model('Total')
  .props({
    entities: types.maybe(types.number),
    pages: types.maybe(types.number),
  })
  .views(self => ({
    get fetched() {
      return {
        entities: getParent(self).entities.length || null,
        pages: getParent(self).page.length || null,
      };
    },
  }));

export const Page = types
  .model('Page')
  .props({
    entities: types.optional(types.array(types.reference(Post)), []),
    fetching: types.optional(types.boolean, false),
    ready: types.optional(types.boolean, false),
  })
  .views(self => ({
    get total() {
      return self.entities.length || null;
    },
  }));

export const List = types
  .model('List')
  .props({
    pageMap: types.optional(types.map(Page), {}),
    total: types.optional(Total, {}),
    fetching: types.optional(types.boolean, false),
    ready: types.optional(types.boolean, false),
  })
  .views(self => ({
    get page() {
      return self.pageMap
        .keys()
        .reduce((result, page) => result.concat(self.pageMap.get(page)), []);
    },
    get entities() {
      return self.pageMap
        .keys()
        .map(page => self.pageMap.get(page))
        .reduce((result, page) => result.concat(page.entities.map(entity => entity)), []);
    },
  }));
