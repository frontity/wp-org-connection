import { types, getParent, getRoot } from 'mobx-state-tree';

const BaseItem = types
  .model('BaseItem')
  .props({
    mstId: types.identifier(types.string),
    type: types.string,
    id: types.union(types.string, types.number),
    extract: types.maybe(types.boolean),
    visited: false,
  })
  .views(self => ({
    get connection() {
      return getRoot(self);
    },
    get entity() {
      return self.connection.entity(self.type, self.id);
    },
    get ready() {
      return self.page.ready;
    },
    get isSingle() {
      return !self.page;
    },
    get isList() {
      return !!self.page;
    },
    get parentColumn() {
      return getParent(self, 2);
    },
    get nextItem() {
      const items = getParent(self);
      const index = items.indexOf(self);
      return index === items.length - 1
        ? self.column.nextColumn && self.column.nextColumn.items[0]
        : items[index + 1];
    },
  }));

export const List = BaseItem.named('List')
  .props({
    page: types.number,
  })
  .views(self => ({
    get list() {
      return self.connection.list(self.type, self.id);
    },
  }));

export const Single = BaseItem.named('List').props({
  fromList: types.optional(types.frozen, { type: 'latest', id: 'post', page: 1 }),
});

const Item = types.union(({ page }) => (page ? List : Single), List, Single);

export default Item;
