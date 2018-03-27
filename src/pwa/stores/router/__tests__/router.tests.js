import { autorun, onReactionError } from 'mobx';
import { getSnapshot } from 'mobx-state-tree';
import { normalize } from 'normalizr';
import { entity, list } from '../../../schemas';
import Connection from '../../';
import * as actionTypes from '../../../actionTypes';
import * as actions from '../../../actions';
import postsFromCategory7 from '../../../__tests__/posts-from-category-7.json';
import post60 from '../../../__tests__/post-60.json';

const { result: resultFromCategory7, entities: entitiesFromCategory } = normalize(
  postsFromCategory7,
  list,
);

const { entities: entitiesFromPost60 } = normalize(post60, entity);

let connection;
beforeEach(() => {
  connection = Connection.create({});
});

describe('Connection › Router', () => {
  test('Initializes contexts as empty array', () => {
    expect(connection.contexts).toMatchSnapshot();
    expect(connection.selectedContext).toBe(null);
  });

  test('Options should be populated', () => {
    connection[actionTypes.ROUTE_CHANGE_SUCCEED](
      actions.routeChangeSucceed({
        selectedItem: { type: 'post', id: 60 },
        context: {
          options: { someThemeOption: 123 },
          columns: [[{ type: 'post', id: 60 }]],
        },
      }),
    );
    expect(connection.contexts).toMatchSnapshot();
    expect(connection.selectedContext.options).toEqual({ someThemeOption: 123 });
    expect(connection.contexts[0].options).toEqual({ someThemeOption: 123 });
  });

  test('Selected single', () => {
    connection[actionTypes.ROUTE_CHANGE_SUCCEED](
      actions.routeChangeSucceed({ selectedItem: { type: 'post', id: 60 } }),
    );
    expect(connection.contexts).toMatchSnapshot();
    expect(getSnapshot(connection).selectedContext).toBe(connection.contexts[0].index);
    expect(connection.selectedItem.page).toBe(undefined);
    expect(connection.selectedItem.isSingle).toBe(true);
    expect(connection.selectedItem.isList).toBe(false);
  });

  test('Selected list', () => {
    connection[actionTypes.ROUTE_CHANGE_SUCCEED](
      actions.routeChangeSucceed({ selectedItem: { type: 'category', id: 7, page: 2 } }),
    );
    expect(connection.contexts).toMatchSnapshot();
    expect(getSnapshot(connection).selectedContext).toBe(connection.contexts[0].index);
    expect(connection.selectedItem.page).toBe(2);
    expect(connection.selectedItem.isSingle).toBe(false);
    expect(connection.selectedItem.isList).toBe(true);
  });

  test('Selected single with previous different context', () => {
    connection[actionTypes.ROUTE_CHANGE_SUCCEED](
      actions.routeChangeSucceed({ selectedItem: { type: 'post', id: 63 } }),
    );
    connection[actionTypes.ROUTE_CHANGE_SUCCEED](
      actions.routeChangeSucceed({ selectedItem: { type: 'post', id: 60 } }),
    );
    expect(connection.contexts).toMatchSnapshot();
    expect(getSnapshot(connection).selectedContext).toBe(connection.contexts[1].index);
    expect(getSnapshot(connection.selectedContext).generator).toEqual({
      columns: [[{ type: 'post', id: 60, page: undefined }]],
    });
    expect(connection.selectedItem.id).toBe(60);
  });

  test('Selected list with previous different context', () => {
    connection[actionTypes.ROUTE_CHANGE_SUCCEED](
      actions.routeChangeSucceed({ selectedItem: { type: 'post', id: 60 } }),
    );
    connection[actionTypes.ROUTE_CHANGE_SUCCEED](
      actions.routeChangeSucceed({ selectedItem: { type: 'category', id: 7, page: 1 } }),
    );
    expect(connection.contexts).toMatchSnapshot();
    expect(getSnapshot(connection).selectedContext).toBe(connection.contexts[1].index);
    expect(connection.selectedItem.id).toBe(7);
  });

  test('Selected single and new context with selected', () => {
    connection[actionTypes.ROUTE_CHANGE_SUCCEED](
      actions.routeChangeSucceed({
        selectedItem: { type: 'post', id: 60 },
        context: {
          options: { someThemeOption: 123 },
          columns: [
            [{ type: 'post', id: 63 }],
            [{ type: 'post', id: 62 }, { type: 'post', id: 60 }],
          ],
        },
      }),
    );
    expect(connection.contexts).toMatchSnapshot();
    expect(connection.selectedColumn).toBe(connection.contexts[0].columns[1]);
    expect(connection.selectedItem).toBe(connection.contexts[0].columns[1].items[1]);
  });

  test('Selected single and new context without selected', () => {
    connection[actionTypes.ROUTE_CHANGE_SUCCEED](
      actions.routeChangeSucceed({
        selectedItem: { type: 'post', id: 60 },
        context: {
          options: { someThemeOption: 123 },
          columns: [
            [{ type: 'post', id: 63 }],
            [{ type: 'post', id: 62 }, { type: 'post', id: 64 }],
          ],
        },
      }),
    );
    expect(connection.contexts).toMatchSnapshot();
    expect(connection.contexts[0].columns[0].items[0].id).toBe(60);
    expect(connection.selectedItem.id).toBe(60);
  });

  test('Selected list and new context with selected', () => {
    connection[actionTypes.ROUTE_CHANGE_SUCCEED](
      actions.routeChangeSucceed({
        selectedItem: { type: 'category', id: 7, page: 1 },
        context: {
          options: { someThemeOption: 123 },
          columns: [
            [{ type: 'latest', id: 'post', page: 1 }],
            [{ type: 'category', id: 7, page: 1 }],
            [{ type: 'tag', id: 10, page: 1 }],
          ],
        },
      }),
    );
    expect(connection.contexts).toMatchSnapshot();
    expect(connection.selectedColumn).toBe(connection.contexts[0].columns[1]);
    expect(connection.selectedItem).toBe(connection.contexts[0].columns[1].items[0]);
  });

  test('Selected list and new context without selected', () => {
    connection[actionTypes.ROUTE_CHANGE_SUCCEED](
      actions.routeChangeSucceed({
        selectedItem: { type: 'category', id: 7, page: 1 },
        context: {
          options: { someThemeOption: 123 },
          columns: [
            [{ type: 'latest', id: 'post', page: 1 }],
            [{ type: 'category', id: 3, page: 1 }],
            [{ type: 'tag', id: 10, page: 1 }],
          ],
        },
      }),
    );
    expect(connection.contexts).toMatchSnapshot();
    expect(connection.contexts[0].columns[0].items[0].id).toBe(7);
    expect(connection.selectedColumn).toBe(connection.contexts[0].columns[0]);
    expect(connection.selectedItem.id).toBe(7);
  });

  test('Selected single with previous equal context', () => {
    connection[actionTypes.ROUTE_CHANGE_SUCCEED](
      actions.routeChangeSucceed({ selectedItem: { type: 'post', id: 60 } }),
    );
    connection[actionTypes.ROUTE_CHANGE_SUCCEED](
      actions.routeChangeSucceed({ selectedItem: { type: 'post', id: 60 } }),
    );
    expect(connection.contexts).toMatchSnapshot();
    expect(connection.selectedColumn).toBe(connection.contexts[0].columns[0]);
    expect(connection.selectedItem).toBe(connection.contexts[0].columns[0].items[0]);
  });

  test('Selected single and new context, with previous diff context', () => {
    connection[actionTypes.ROUTE_CHANGE_SUCCEED](
      actions.routeChangeSucceed({ selectedItem: { type: 'post', id: 60 } }),
    );
    connection[actionTypes.ROUTE_CHANGE_SUCCEED](
      actions.routeChangeSucceed({
        selectedItem: { type: 'post', id: 60 },
        context: {
          options: { someThemeOption: 123 },
          columns: [
            [{ type: 'post', id: 63 }],
            [{ type: 'post', id: 62 }, { type: 'post', id: 60 }],
          ],
        },
      }),
    );
    expect(connection.contexts).toMatchSnapshot();
    expect(connection.selectedColumn).toBe(connection.contexts[1].columns[1]);
    expect(connection.selectedItem).toBe(connection.contexts[1].columns[1].items[1]);
  });

  test('Selected single and previous context with selected', () => {
    connection[actionTypes.ROUTE_CHANGE_SUCCEED](
      actions.routeChangeSucceed({
        selectedItem: { type: 'post', id: 60 },
        context: {
          options: { someThemeOption: 123 },
          columns: [
            [{ type: 'post', id: 63 }],
            [{ type: 'post', id: 62 }, { type: 'post', id: 60 }],
          ],
        },
      }),
    );
    connection[actionTypes.ROUTE_CHANGE_SUCCEED](
      actions.routeChangeSucceed({ selectedItem: { type: 'post', id: 63 } }),
    );
    expect(connection.contexts).toMatchSnapshot();
    expect(connection.contexts.length).toBe(1);
    expect(connection.selectedColumn).toBe(connection.contexts[0].columns[0]);
    expect(connection.selectedItem).toBe(connection.contexts[0].columns[0].items[0]);
  });

  test('First selected item should be visited', () => {
    connection[actionTypes.ROUTE_CHANGE_SUCCEED](
      actions.routeChangeSucceed({ selectedItem: { type: 'category', id: 7, page: 1 } }),
    );
    expect(connection.selectedItem.visited).toBe(true);
  });

  test('Current selected item and previous ones should be visited', () => {
    connection[actionTypes.ROUTE_CHANGE_SUCCEED](
      actions.routeChangeSucceed({
        selectedItem: { type: 'post', id: 60 },
        context: {
          options: { someThemeOption: 123 },
          columns: [
            [{ type: 'post', id: 63 }],
            [{ type: 'post', id: 62 }, { type: 'post', id: 60 }],
          ],
        },
      }),
    );
    connection[actionTypes.ROUTE_CHANGE_SUCCEED](
      actions.routeChangeSucceed({ selectedItem: { type: 'post', id: 63 } }),
    );
    expect(connection.selectedContext.getItem({ item: { type: 'post', id: 60 } }).visited).toBe(
      true,
    );
    expect(connection.selectedContext.getItem({ item: { type: 'post', id: 63 } }).visited).toBe(
      true,
    );
    expect(connection.selectedContext.getItem({ item: { type: 'post', id: 62 } }).visited).toBe(
      false,
    );
  });

  test('Move selected single', () => {
    connection[actionTypes.ROUTE_CHANGE_SUCCEED](
      actions.routeChangeSucceed({
        selectedItem: { type: 'post', id: 63 },
        context: {
          options: { someThemeOption: 123 },
          columns: [
            [{ type: 'post', id: 63 }],
            [{ type: 'post', id: 62 }, { type: 'post', id: 60 }],
          ],
        },
      }),
    );
    connection[actionTypes.MOVE_ITEM_TO_COLUMN](
      actions.moveItemToColumn({ item: { type: 'post', id: 62 } }),
    );
    expect(connection.contexts).toMatchSnapshot();
    expect(connection.contexts.length).toBe(1);
    expect(connection.selectedColumn).toBe(connection.contexts[0].columns[0]);
    expect(connection.selectedItem).toBe(connection.contexts[0].columns[0].items[0]);
    expect(connection.selectedItem.id).toBe(63);
    expect(connection.selectedItem.nextItem.id).toBe(62);
    expect(connection.contexts[0].columns[1].items[0].id).toBe(60);
  });

  test('Move selected single from column with only that item', () => {
    connection[actionTypes.ROUTE_CHANGE_SUCCEED](
      actions.routeChangeSucceed({
        selectedItem: { type: 'post', id: 62 },
        context: {
          options: { someThemeOption: 123 },
          columns: [
            [{ type: 'post', id: 63 }],
            [{ type: 'post', id: 62 }],
            [{ type: 'post', id: 60 }],
          ],
        },
      }),
    );
    connection[actionTypes.MOVE_ITEM_TO_COLUMN](
      actions.moveItemToColumn({ item: { type: 'post', id: 60 } }),
    );
    expect(connection.contexts).toMatchSnapshot();
    expect(connection.contexts[0].columns.length).toBe(2);
    expect(connection.selectedColumn).toBe(connection.contexts[0].columns[1]);
    expect(connection.selectedItem).toBe(connection.contexts[0].columns[1].items[0]);
    expect(connection.selectedItem.nextItem.id).toBe(60);
  });

  test('Move selected single with previous context without selected', () => {
    connection[actionTypes.ROUTE_CHANGE_SUCCEED](
      actions.routeChangeSucceed({
        selectedItem: { type: 'post', id: 62 },
        context: {
          options: { someThemeOption: 123 },
          columns: [
            [{ type: 'post', id: 63 }],
            [{ type: 'post', id: 62 }],
            [{ type: 'post', id: 61 }],
          ],
        },
      }),
    );
    expect(() =>
      connection[actionTypes.MOVE_ITEM_TO_COLUMN](
        actions.moveItemToColumn({ item: { type: 'post', id: 60 } }),
      ),
    ).toThrow("Can't move if selected doesn't exist in the previous context.");
  });

  test('Replace context with new one', () => {
    connection[actionTypes.ROUTE_CHANGE_SUCCEED](
      actions.routeChangeSucceed({
        selectedItem: { type: 'post', id: 63 },
        context: {
          columns: [
            [{ type: 'post', id: 63 }],
            [{ type: 'post', id: 62 }],
            [{ type: 'post', id: 61 }],
          ],
        },
      }),
    );
    connection[actionTypes.REPLACE_CONTEXT](
      actions.replaceContext({
        context: {
          columns: [
            [{ type: 'post', id: 63 }, { type: 'latest', id: 'post', page: 1 }],
            [{ type: 'category', id: 7, page: 1 }],
            [{ type: 'tag', id: 3, page: 1 }],
          ],
        },
      }),
    );
    expect(connection.contexts).toMatchSnapshot();
    expect(connection.contexts.length).toBe(1);
    expect(connection.selectedColumn).toBe(connection.contexts[0].columns[0]);
    expect(connection.selectedItem).toBe(connection.contexts[0].columns[0].items[0]);
    expect(connection.selectedItem.type).toBe('post');
    expect(connection.contexts[0].columns[0].items[0].type).toBe('post');
    expect(connection.contexts[0].columns[0].items[1].type).toBe('latest');
    expect(connection.contexts[0].columns[1].items[0].type).toBe('category');
    expect(connection.contexts[0].columns[2].items[0].type).toBe('tag');
  });

  test('Subscribe to selectedItem when context is replaced', done => {
    connection[actionTypes.ROUTE_CHANGE_SUCCEED](
      actions.routeChangeSucceed({
        selectedItem: { type: 'post', id: 60 },
        context: { columns: [[{ type: 'post', id: 60 }]] },
      }),
    );
    autorun(() => {
      if (connection.selectedItem.ready) done();
    });
    connection[actionTypes.REPLACE_CONTEXT](
      actions.replaceContext({ context: { columns: [[{ type: 'post', id: 60 }]] } }),
    );
    connection[actionTypes.ENTITY_SUCCEED](
      actions.entitySucceed({
        entity: {
          type: 'post',
          id: 60,
        },
        entities: entitiesFromPost60,
      }),
    );
  });

  test('Select in previous context', () => {
    connection[actionTypes.ROUTE_CHANGE_SUCCEED](
      actions.routeChangeSucceed({
        selectedItem: { type: 'category', id: 7, page: 1 },
        context: {
          columns: [[{ type: 'category', id: 7, page: 1 }, { type: 'category', id: 7, page: 2 }]],
        },
      }),
    );
    connection[actionTypes.ROUTE_CHANGE_SUCCEED](
      actions.routeChangeSucceed({ selectedItem: { type: 'post', id: 62 } }),
    );
    connection[actionTypes.ROUTE_CHANGE_SUCCEED](
      actions.routeChangeSucceed({
        selectedItem: { type: 'category', id: 7, page: 2 },
        method: 'backward',
      }),
    );
    expect(connection.contexts).toMatchSnapshot();
    expect(connection.contexts.length).toBe(2);
    expect(connection.selectedContext.index).toBe(0);
    expect(connection.selectedContext.columns[0].items[1].id).toBe(connection.selectedItem.id);
    expect(connection.selectedItem.id).toBe(7);
  });

  test('Try to select in previous context where item doesnt exist', () => {
    connection[actionTypes.ROUTE_CHANGE_SUCCEED](
      actions.routeChangeSucceed({
        selectedItem: { type: 'category', id: 7, page: 1 },
        context: {
          columns: [[{ type: 'category', id: 7, page: 1 }, { type: 'category', id: 7, page: 2 }]],
        },
      }),
    );
    connection[actionTypes.ROUTE_CHANGE_SUCCEED](
      actions.routeChangeSucceed({ selectedItem: { type: 'post', id: 62 } }),
    );
    expect(() =>
      connection[actionTypes.ROUTE_CHANGE_SUCCEED](
        actions.routeChangeSucceed({
          selectedItem: { type: 'category', id: 7, page: 3 },
          method: 'backward',
        }),
      ),
    ).toThrow("You are trying to select an item in a context where doesn't exist");
  });

  test('Select in next context', () => {
    connection[actionTypes.ROUTE_CHANGE_SUCCEED](
      actions.routeChangeSucceed({
        selectedItem: { type: 'category', id: 7, page: 1 },
        context: {
          columns: [[{ type: 'category', id: 7, page: 1 }, { type: 'category', id: 7, page: 2 }]],
        },
      }),
    );
    connection[actionTypes.ROUTE_CHANGE_SUCCEED](
      actions.routeChangeSucceed({ selectedItem: { type: 'post', id: 62 } }),
    );
    connection[actionTypes.ROUTE_CHANGE_SUCCEED](
      actions.routeChangeSucceed({
        selectedItem: { type: 'category', id: 7, page: 2 },
        method: 'backward',
      }),
    );
    connection[actionTypes.ROUTE_CHANGE_SUCCEED](
      actions.routeChangeSucceed({
        selectedItem: { type: 'post', id: 62 },
        method: 'forward',
      }),
    );
    expect(connection.contexts).toMatchSnapshot();
    expect(connection.contexts.length).toBe(2);
    expect(connection.selectedContext.index).toBe(1);
    expect(connection.selectedItem.id).toBe(62);
  });

  test('Try to select in next context where item doesnt exist', () => {
    connection[actionTypes.ROUTE_CHANGE_SUCCEED](
      actions.routeChangeSucceed({
        selectedItem: { type: 'category', id: 7, page: 1 },
        context: {
          columns: [[{ type: 'category', id: 7, page: 1 }, { type: 'category', id: 7, page: 2 }]],
        },
      }),
    );
    connection[actionTypes.ROUTE_CHANGE_SUCCEED](
      actions.routeChangeSucceed({ selectedItem: { type: 'post', id: 62 } }),
    );
    connection[actionTypes.ROUTE_CHANGE_SUCCEED](
      actions.routeChangeSucceed({
        selectedItem: { type: 'category', id: 7, page: 2 },
        method: 'backward',
      }),
    );
    expect(() =>
      connection[actionTypes.ROUTE_CHANGE_SUCCEED](
        actions.routeChangeSucceed({
          selectedItem: { type: 'post', id: 63 },
          method: 'forward',
        }),
      ),
    ).toThrow("You are trying to select an item in a context where doesn't exist");
  });

  test('Selected single and context object with extracted', () => {
    connection[actionTypes.ROUTE_CHANGE_SUCCEED](
      actions.routeChangeSucceed({
        selectedItem: { type: 'post', id: 60 },
        context: { columns: [[{ type: 'latest', id: 'post', page: 1, extract: 'horizontal' }]] },
      }),
    );
    expect(connection.contexts).toMatchSnapshot();
    expect(connection.selectedContext.columns.length).toBe(1);
  });

  test('Columns should not show next items if extracted after that item is not resolved', () => {
    connection[actionTypes.ROUTE_CHANGE_SUCCEED](
      actions.routeChangeSucceed({
        selectedItem: { type: 'post', id: 60 },
        context: {
          columns: [
            [{ type: 'post', id: 60 }],
            [{ type: 'latest', id: 'post', page: 1, extract: 'horizontal' }],
            [{ type: 'post', id: 63 }],
          ],
        },
      }),
    );
    expect(connection.contexts).toMatchSnapshot();
    expect(connection.selectedContext.columns.length).toBe(1);
  });

  test('Columns should not show previous items if extracted before that item is not resolved', () => {
    connection[actionTypes.ROUTE_CHANGE_SUCCEED](
      actions.routeChangeSucceed({
        selectedItem: { type: 'post', id: 63 },
        context: {
          columns: [
            [{ type: 'post', id: 60 }],
            [{ type: 'latest', id: 'post', page: 1, extract: 'horizontal' }],
            [{ type: 'post', id: 63 }],
          ],
        },
      }),
    );
    expect(connection.contexts).toMatchSnapshot();
    expect(connection.selectedContext.columns.length).toBe(1);
  });

  test('Columns should not below items if extracted before that item is not resolved', () => {
    // +-++-++-++-++-++-++-++-++-++-++-+
    // |P  E  P  P  P  P  P  P  P  E  P|
    // +-++-++-++-++-++-++-++-++-++-++-+
    //          |P|  >|P|<  |P|   |P|
    //          +-+   +-+   +-+   +-+
    //          |E|   |E|   |E|
    //          +-+   +-+   +-+
    //          |P|   |P|   |P|
    //          +-+   +-+   +-+
    connection[actionTypes.ROUTE_CHANGE_SUCCEED](
      actions.routeChangeSucceed({
        selectedItem: { type: 'post', id: 10 },
        context: {
          columns: [
            [{ type: 'post', id: 1 }],
            [{ type: 'category', id: 2, page: 1, extract: 'horizontal' }],
            [{ type: 'post', id: 3 }],
            [
              { type: 'post', id: 4 },
              { type: 'post', id: 5 },
              { type: 'category', id: 6, page: 1, extract: 'vertical' },
              { type: 'post', id: 7 },
            ],
            [{ type: 'post', id: 8 }],
            [
              { type: 'post', id: 9 },
              { type: 'post', id: 10 },
              { type: 'category', id: 11, page: 1, extract: 'vertical' },
              { type: 'post', id: 12 },
            ],
            [{ type: 'post', id: 13 }],
            [
              { type: 'post', id: 14 },
              { type: 'post', id: 15 },
              { type: 'category', id: 16, page: 1, extract: 'vertical' },
              { type: 'post', id: 17 },
            ],
            [{ type: 'post', id: 18 }],
            [{ type: 'category', id: 19, page: 1, extract: 'vertical' }, { type: 'post', id: 20 }],
            [{ type: 'post', id: 21 }],
          ],
        },
      }),
    );
    expect(connection.contexts).toMatchSnapshot();
    expect(connection.selectedContext.columns.length).toBe(7);
    expect(connection.selectedContext.columns[0].items.length).toBe(1);
    expect(connection.selectedContext.columns[1].items.length).toBe(2);
    expect(connection.selectedContext.columns[3].items.length).toBe(2);
    expect(connection.selectedContext.columns[5].items.length).toBe(2);
  });

  test('Add items from extracted once they are ready', () => {
    connection[actionTypes.ROUTE_CHANGE_SUCCEED](
      actions.routeChangeSucceed({
        selectedItem: { type: 'post', id: 60 },
        context: { columns: [[{ type: 'category', id: 7, page: 1, extract: 'horizontal' }]] },
      }),
    );
    expect(connection.selectedContext.rawColumns.length).toBe(2);
    expect(connection.selectedContext.columns.length).toBe(1);
    connection[actionTypes.LIST_SUCCEED](
      actions.listSucceed({
        list: {
          type: 'category',
          id: 7,
          page: 1,
        },
        result: resultFromCategory7,
        entities: entitiesFromCategory,
      }),
    );
    expect(connection.contexts).toMatchSnapshot();
    expect(resultFromCategory7.length).toBe(5);
    expect(connection.selectedContext.rawColumns.length).toBe(6);
    expect(connection.selectedContext.columns.length).toBe(6);
  });

  test("Don't throw if vertical extracted is added in a column with more stuff", () => {
    expect(() =>
      connection[actionTypes.ROUTE_CHANGE_SUCCEED](
        actions.routeChangeSucceed({
          selectedItem: { type: 'post', id: 60 },
          context: {
            columns: [
              [{ type: 'post', id: 60 }],
              [{ type: 'post', id: 63 }, { type: 'category', id: 7, page: 1, extract: 'vertical' }],
            ],
          },
        }),
      ),
    ).not.toThrow();
  });

  test('Throw if one column is not an array', () => {
    expect(() =>
      connection[actionTypes.ROUTE_CHANGE_SUCCEED](
        actions.routeChangeSucceed({
          selectedItem: { type: 'post', id: 60 },
          context: {
            columns: [
              { type: 'post', id: 60 },
              [
                { type: 'post', id: 63 },
                { type: 'category', id: 7, page: 1, extract: 'horizontal' },
              ],
            ],
          },
        }),
      ),
    ).toThrow('Columns should be arrays and not single objects.');
  });

  test('Add new item to column', () => {
    connection[actionTypes.ROUTE_CHANGE_SUCCEED](
      actions.routeChangeSucceed({
        selectedItem: { type: 'post', id: 62 },
        context: {
          columns: [
            [{ type: 'post', id: 63 }],
            [{ type: 'post', id: 62 }],
            [{ type: 'post', id: 60 }],
          ],
        },
      }),
    );
    connection[actionTypes.ADD_ITEM_TO_COLUMN](
      actions.addItemToColumn({ item: { type: 'post', id: 64 } }),
    );
    expect(connection.contexts).toMatchSnapshot();
    expect(connection.contexts[0].columns.length).toBe(3);
    expect(connection.selectedColumn).toBe(connection.contexts[0].columns[1]);
    expect(connection.selectedItem).toBe(connection.contexts[0].columns[1].items[0]);
    expect(connection.contexts[0].columns[1].items[1].id).toBe(64);
  });

  test('Add both extracted list and normal list to context', () => {
    connection[actionTypes.ROUTE_CHANGE_SUCCEED](
      actions.routeChangeSucceed({
        selectedItem: { type: 'post', id: 60 },
        context: {
          columns: [
            [{ type: 'post', id: 60 }],
            [{ type: 'category', id: 7, page: 1 }],
            [{ type: 'category', id: 7, page: 1, extract: 'horizontal' }],
          ],
        },
      }),
    );
    expect(connection.contexts).toMatchSnapshot();
    expect(connection.contexts[0].columns.length).toBe(2);
    connection[actionTypes.LIST_SUCCEED](
      actions.listSucceed({
        list: {
          type: 'category',
          id: 7,
          page: 1,
        },
        result: resultFromCategory7,
        entities: entitiesFromCategory,
      }),
    );
    expect(connection.contexts).toMatchSnapshot();
    expect(connection.contexts[0].columns.length).toBe(7);
  });

  // Test passes but it throws anyway. Skipping until we figure it out.
  test.skip('Throw if horizontal extracted is added in a column with more stuff', () => {
    const mockCallback = jest.fn();
    onReactionError(mockCallback);
    connection[actionTypes.ROUTE_CHANGE_SUCCEED](
      actions.routeChangeSucceed({
        selectedItem: { type: 'post', id: 60 },
        context: {
          columns: [
            [{ type: 'post', id: 60 }],
            [{ type: 'post', id: 63 }, { type: 'category', id: 7, page: 1, extract: 'horizontal' }],
          ],
        },
      }),
    );
    expect(mockCallback).toBeCalled();
  });

  // Test passes but it throws anyway. Skipping until we figure it out.
  test.skip('Throw if new extracted list is added to column', () => {
    const mockCallback = jest.fn();
    onReactionError(mockCallback);
    connection[actionTypes.ROUTE_CHANGE_SUCCEED](
      actions.routeChangeSucceed({
        selectedItem: { type: 'post', id: 62 },
        context: {
          columns: [
            [{ type: 'post', id: 63 }],
            [{ type: 'post', id: 62 }],
            [{ type: 'post', id: 60 }],
          ],
        },
      }),
    );
    connection[actionTypes.ADD_ITEM_TO_COLUMN](
      actions.addItemToColumn({
        item: { type: 'category', id: 7, page: 1, extract: 'horizontal' },
      }),
    );
    expect(mockCallback).toBeCalled();
  });

  test('Throw if trying to preview an extracted item', () => {
    connection[actionTypes.ROUTE_CHANGE_SUCCEED](
      actions.routeChangeSucceed({
        selectedItem: { type: 'post', id: 62 },
        context: {
          columns: [
            [{ type: 'post', id: 63 }],
            [{ type: 'post', id: 62 }],
            [{ type: 'post', id: 60 }],
          ],
        },
      }),
    );
    expect(() =>
      connection[actionTypes.PREVIEW_ITEM_IN_COLUMN](
        actions.previewItemInColumn({
          item: { type: 'category', id: 7, page: 1, extract: 'horizontal' },
        }),
      ),
    ).toThrow("Can't preview an extracted item");
  });

  test.skip('Preview item in column', () => {
    connection[actionTypes.ROUTE_CHANGE_SUCCEED](
      actions.routeChangeSucceed({
        selectedItem: { type: 'post', id: 62 },
        context: {
          columns: [
            [{ type: 'post', id: 63 }],
            [{ type: 'post', id: 62 }],
            [{ type: 'post', id: 60 }],
          ],
        },
      }),
    );
    connection[actionTypes.PREVIEW_ITEM_IN_COLUMN](
      actions.previewItemInColumn({ item: { type: 'post', id: 60 } }),
    );
    expect(connection.contexts).toMatchSnapshot();
    expect(connection.contexts[0].columns.length).toBe(3);
    expect(connection.selectedColumn).toBe(connection.contexts[0].columns[1]);
    expect(connection.selectedItem).toBe(connection.contexts[0].columns[1].items[0]);
    expect(connection.contexts[0].columns[1].items[1].id).toBe(64);
  });
});
