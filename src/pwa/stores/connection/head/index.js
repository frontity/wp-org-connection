import { types } from 'mobx-state-tree';

export default types.model('Head').props({
  title: types.optional(types.string, ''),
  content: types.frozen([]),
  hasFailed: false,
});
