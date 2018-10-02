import { autorun, _resetGlobalState, configure } from 'mobx';
import { types, getSnapshot } from 'mobx-state-tree';
import Connection from '../../';
import WpApi from '../../../env/wpapi';
import postsFromCategory7 from '../../../__tests__/posts-from-category-7.json';
import postsFromCategory7Page2 from '../../../__tests__/posts-from-category-7-page-2.json';
import post60 from '../../../__tests__/post-60.json';

jest.mock('../../../env/wpapi');

configure({ disableErrorBoundaries: true });

const Stores = types.model().props({
  connection: types.optional(Connection, {}),
  settings: types.frozen({
    connection: {},
    generalSite: { url: 'https://example.com' },
  }),
  build: types.frozen({ perPage: 10 }),
});

let connection = null;
let getEntity = null;
let getListPage = null;

beforeEach(() => {
  WpApi.mockClear();
  connection = Stores.create({}, { connection: { WpApi } }).connection; // eslint-disable-line
  connection.initApi();
  ({ getEntity, getListPage } = WpApi.mock.instances[0]); // eslint-disable-line
});

describe('Connection › Router', () => {
  test('Initializes contexts as empty array', () => {
    expect(connection.contexts).toMatchSnapshot();
    expect(connection.selectedContext).toBeUndefined();
  });

  test('Options should be populated', () => {
    connection.routeChangeSucceed({
      selectedItem: { type: 'post', id: 60 },
      context: {
        options: { someThemeOption: 123 },
        columns: [[{ type: 'post', id: 60 }]],
      },
    });
    expect(connection.contexts).toMatchSnapshot();
    expect(connection.selectedContext.options).toEqual({
      someThemeOption: 123,
    });
    expect(connection.contexts[0].options).toEqual({ someThemeOption: 123 });
  });

  test('Selected single', () => {
    connection.routeChangeSucceed({ selectedItem: { type: 'post', id: 60 } });
    expect(connection.contexts).toMatchSnapshot();
    expect(getSnapshot(connection).selectedContext).toBe(
      connection.contexts[0].index,
    );
    expect(connection.selectedItem.page).toBe(undefined);
    expect(connection.selectedItem.isSingle).toBe(true);
    expect(connection.selectedItem.isList).toBe(false);
  });

  test('Selected list', () => {
    connection.routeChangeSucceed({
      selectedItem: { type: 'category', id: 7, page: 2 },
    });
    expect(connection.contexts).toMatchSnapshot();
    expect(getSnapshot(connection).selectedContext).toBe(
      connection.contexts[0].index,
    );
    expect(connection.selectedItem.page).toBe(2);
    expect(connection.selectedItem.isSingle).toBe(false);
    expect(connection.selectedItem.isList).toBe(true);
  });

  test('Selected single with previous different context', () => {
    connection.routeChangeSucceed({ selectedItem: { type: 'post', id: 63 } });
    connection.routeChangeSucceed({ selectedItem: { type: 'post', id: 60 } });
    expect(connection.contexts).toMatchSnapshot();
    expect(getSnapshot(connection).selectedContext).toBe(
      connection.contexts[1].index,
    );
    expect(getSnapshot(connection.selectedContext).generator).toEqual({
      columns: [[{ type: 'post', id: 60, page: undefined }]],
    });
    expect(connection.selectedItem.id).toBe(60);
  });

  test('Selected list with previous different context', () => {
    connection.routeChangeSucceed({ selectedItem: { type: 'post', id: 60 } });
    connection.routeChangeSucceed({
      selectedItem: { type: 'category', id: 7, page: 1 },
    });
    expect(connection.contexts).toMatchSnapshot();
    expect(getSnapshot(connection).selectedContext).toBe(
      connection.contexts[1].index,
    );
    expect(connection.selectedItem.id).toBe(7);
  });

  test('Selected single and new context with selected', () => {
    connection.routeChangeSucceed({
      selectedItem: { type: 'post', id: 60 },
      context: {
        options: { someThemeOption: 123 },
        columns: [
          [{ type: 'post', id: 63 }],
          [{ type: 'post', id: 62 }, { type: 'post', id: 60 }],
        ],
      },
    });
    expect(connection.contexts).toMatchSnapshot();
    expect(connection.selectedColumn).toBe(connection.contexts[0].columns[1]);
    expect(connection.selectedItem).toBe(
      connection.contexts[0].columns[1].items[1],
    );
  });

  test('Selected single and new context without selected', () => {
    connection.routeChangeSucceed({
      selectedItem: { type: 'post', id: 60 },
      context: {
        options: { someThemeOption: 123 },
        columns: [
          [{ type: 'post', id: 63 }],
          [{ type: 'post', id: 62 }, { type: 'post', id: 64 }],
        ],
      },
    });
    expect(connection.contexts).toMatchSnapshot();
    expect(connection.contexts[0].columns[0].items[0].id).toBe(60);
    expect(connection.selectedItem.id).toBe(60);
  });

  test('Selected list and new context with selected', () => {
    connection.routeChangeSucceed({
      selectedItem: { type: 'category', id: 7, page: 1 },
      context: {
        options: { someThemeOption: 123 },
        columns: [
          [{ type: 'latest', id: 'post', page: 1 }],
          [{ type: 'category', id: 7, page: 1 }],
          [{ type: 'tag', id: 10, page: 1 }],
        ],
      },
    });
    expect(connection.contexts).toMatchSnapshot();
    expect(connection.selectedColumn).toBe(connection.contexts[0].columns[1]);
    expect(connection.selectedItem).toBe(
      connection.contexts[0].columns[1].items[0],
    );
  });

  test('Selected list and new context without selected', () => {
    connection.routeChangeSucceed({
      selectedItem: { type: 'category', id: 7, page: 1 },
      context: {
        options: { someThemeOption: 123 },
        columns: [
          [{ type: 'latest', id: 'post', page: 1 }],
          [{ type: 'category', id: 3, page: 1 }],
          [{ type: 'tag', id: 10, page: 1 }],
        ],
      },
    });
    expect(connection.contexts).toMatchSnapshot();
    expect(connection.contexts[0].columns[0].items[0].id).toBe(7);
    expect(connection.selectedColumn).toBe(connection.contexts[0].columns[0]);
    expect(connection.selectedItem.id).toBe(7);
  });

  test('Selected single with previous equal context', () => {
    connection.routeChangeSucceed({ selectedItem: { type: 'post', id: 60 } });
    connection.routeChangeSucceed({ selectedItem: { type: 'post', id: 60 } });
    expect(connection.contexts).toMatchSnapshot();
    expect(connection.selectedColumn).toBe(connection.contexts[0].columns[0]);
    expect(connection.selectedItem).toBe(
      connection.contexts[0].columns[0].items[0],
    );
  });

  test('Selected single and new context, with previous diff context', () => {
    connection.routeChangeSucceed({ selectedItem: { type: 'post', id: 60 } });
    connection.routeChangeSucceed({
      selectedItem: { type: 'post', id: 60 },
      context: {
        options: { someThemeOption: 123 },
        columns: [
          [{ type: 'post', id: 63 }],
          [{ type: 'post', id: 62 }, { type: 'post', id: 60 }],
        ],
      },
    });
    expect(connection.contexts).toMatchSnapshot();
    expect(connection.selectedColumn).toBe(connection.contexts[1].columns[1]);
    expect(connection.selectedItem).toBe(
      connection.contexts[1].columns[1].items[1],
    );
  });

  test('Selected single and previous context with selected', () => {
    connection.routeChangeSucceed({
      selectedItem: { type: 'post', id: 60 },
      context: {
        options: { someThemeOption: 123 },
        columns: [
          [{ type: 'post', id: 63 }],
          [{ type: 'post', id: 62 }, { type: 'post', id: 60 }],
        ],
      },
    });
    connection.routeChangeSucceed({ selectedItem: { type: 'post', id: 63 } });
    expect(connection.contexts).toMatchSnapshot();
    expect(connection.contexts).toHaveLength(1);
    expect(connection.selectedColumn).toBe(connection.contexts[0].columns[0]);
    expect(connection.selectedItem).toBe(
      connection.contexts[0].columns[0].items[0],
    );
  });

  test('First selected item should be visited', () => {
    connection.routeChangeSucceed({
      selectedItem: { type: 'category', id: 7, page: 1 },
    });
    expect(connection.selectedItem.hasBeenVisited).toBe(true);
  });

  test('Current selected item and previous ones should be visited', () => {
    connection.routeChangeSucceed({
      selectedItem: { type: 'post', id: 60 },
      context: {
        options: { someThemeOption: 123 },
        columns: [
          [{ type: 'post', id: 63 }],
          [{ type: 'post', id: 62 }, { type: 'post', id: 60 }],
        ],
      },
    });
    connection.routeChangeSucceed({ selectedItem: { type: 'post', id: 63 } });
    expect(
      connection.selectedContext.getItem({ item: { type: 'post', id: 60 } })
        .hasBeenVisited,
    ).toBe(true);
    expect(
      connection.selectedContext.getItem({ item: { type: 'post', id: 63 } })
        .hasBeenVisited,
    ).toBe(true);
    expect(
      connection.selectedContext.getItem({ item: { type: 'post', id: 62 } })
        .hasBeenVisited,
    ).toBe(false);
  });

  test('Move selected single', () => {
    connection.routeChangeSucceed({
      selectedItem: { type: 'post', id: 63 },
      context: {
        options: { someThemeOption: 123 },
        columns: [
          [{ type: 'post', id: 63 }],
          [{ type: 'post', id: 62 }, { type: 'post', id: 60 }],
        ],
      },
    });
    connection.moveItemToColumn({ item: { type: 'post', id: 62 } });
    expect(connection.contexts).toMatchSnapshot();
    expect(connection.contexts).toHaveLength(1);
    expect(connection.selectedColumn).toBe(connection.contexts[0].columns[0]);
    expect(connection.selectedItem).toBe(
      connection.contexts[0].columns[0].items[0],
    );
    expect(connection.selectedItem.id).toBe(63);
    expect(connection.selectedItem.nextItem.id).toBe(62);
    expect(connection.selectedItem.nextItem.hasBeenVisited).toBe(true);
    expect(connection.contexts[0].columns[1].items[0].id).toBe(60);
  });

  test('Move selected single from column with only that item', () => {
    connection.routeChangeSucceed({
      selectedItem: { type: 'post', id: 62 },
      context: {
        options: { someThemeOption: 123 },
        columns: [
          [{ type: 'post', id: 63 }],
          [{ type: 'post', id: 62 }],
          [{ type: 'post', id: 60 }],
        ],
      },
    });
    connection.moveItemToColumn({ item: { type: 'post', id: 60 } });
    expect(connection.contexts).toMatchSnapshot();
    expect(connection.contexts[0].columns).toHaveLength(2);
    expect(connection.selectedColumn).toBe(connection.contexts[0].columns[1]);
    expect(connection.selectedItem).toBe(
      connection.contexts[0].columns[1].items[0],
    );
    expect(connection.selectedItem.nextItem.id).toBe(60);
    expect(connection.selectedItem.nextItem.hasBeenVisited).toBe(true);
  });

  test('Move selected single with previous context without selected', () => {
    connection.routeChangeSucceed({
      selectedItem: { type: 'post', id: 62 },
      context: {
        options: { someThemeOption: 123 },
        columns: [
          [{ type: 'post', id: 63 }],
          [{ type: 'post', id: 62 }],
          [{ type: 'post', id: 61 }],
        ],
      },
    });
    expect(() =>
      connection.moveItemToColumn({ item: { type: 'post', id: 60 } }),
    ).toThrow("Can't move if selected doesn't exist in the previous context.");
  });

  test("Don't move item if it's in selected column", () => {
    connection.routeChangeSucceed({
      selectedItem: { type: 'post', id: 62 },
      context: {
        options: { someThemeOption: 123 },
        columns: [[{ type: 'post', id: 63 }, { type: 'post', id: 62 }]],
      },
    });
    connection.moveItemToColumn({ item: { type: 'post', id: 63 } });
    expect(connection.contexts).toMatchSnapshot();
    expect(connection.contexts).toHaveLength(1);
    expect(connection.selectedColumn).toBe(connection.contexts[0].columns[0]);
    expect(connection.selectedItem).toBe(
      connection.contexts[0].columns[0].items[1],
    );
    expect(connection.selectedItem.id).toBe(62);
  });

  test('Replace context with new one', () => {
    connection.routeChangeSucceed({
      selectedItem: { type: 'post', id: 63 },
      context: {
        columns: [
          [{ type: 'post', id: 63 }],
          [{ type: 'post', id: 62 }],
          [{ type: 'post', id: 61 }],
        ],
      },
    });
    connection.replaceContext({
      context: {
        columns: [
          [{ type: 'post', id: 63 }, { type: 'latest', id: 'post', page: 1 }],
          [{ type: 'category', id: 7, page: 1 }],
          [{ type: 'tag', id: 3, page: 1 }],
        ],
      },
    });
    expect(connection.contexts).toMatchSnapshot();
    expect(connection.contexts).toHaveLength(1);
    expect(connection.selectedColumn).toBe(connection.contexts[0].columns[0]);
    expect(connection.selectedItem).toBe(
      connection.contexts[0].columns[0].items[0],
    );
    expect(connection.selectedItem.type).toBe('post');
    expect(connection.contexts[0].columns[0].items[0].type).toBe('post');
    expect(connection.contexts[0].columns[0].items[1].type).toBe('latest');
    expect(connection.contexts[0].columns[1].items[0].type).toBe('category');
    expect(connection.contexts[0].columns[2].items[0].type).toBe('tag');
  });

  test('Subscribe to selectedItem when context is replaced', done => {
    getEntity.mockReturnValueOnce(Promise.resolve(post60));
    connection.routeChangeSucceed({
      selectedItem: { type: 'post', id: 60 },
      context: { columns: [[{ type: 'post', id: 60 }]] },
    });
    autorun(() => {
      if (connection.selectedItem.isReady) done();
    });
    connection.replaceContext({
      context: { columns: [[{ type: 'post', id: 60 }]] },
    });
    connection.fetchEntity({ type: 'post', id: 60 });
  });

  test('Select in previous context', () => {
    connection.routeChangeSucceed({
      selectedItem: { type: 'category', id: 7, page: 1 },
      context: {
        columns: [
          [
            { type: 'category', id: 7, page: 1 },
            { type: 'category', id: 7, page: 2 },
          ],
        ],
      },
    });
    connection.routeChangeSucceed({ selectedItem: { type: 'post', id: 62 } });
    connection.routeChangeSucceed({
      selectedItem: { type: 'category', id: 7, page: 2 },
      method: 'backward',
    });
    expect(connection.contexts).toMatchSnapshot();
    expect(connection.contexts).toHaveLength(2);
    expect(connection.selectedContext.index).toBe(0);
    expect(connection.selectedContext.columns[0].items[1].id).toBe(
      connection.selectedItem.id,
    );
    expect(connection.selectedItem.id).toBe(7);
  });

  test('Try to select in previous context where item doesnt exist', () => {
    connection.routeChangeSucceed({
      selectedItem: { type: 'category', id: 7, page: 1 },
      context: {
        columns: [
          [
            { type: 'category', id: 7, page: 1 },
            { type: 'category', id: 7, page: 2 },
          ],
        ],
      },
    });
    connection.routeChangeSucceed({ selectedItem: { type: 'post', id: 62 } });
    expect(() =>
      connection.routeChangeSucceed({
        selectedItem: { type: 'category', id: 7, page: 3 },
        method: 'backward',
      }),
    ).toThrow(
      "You are trying to select an item in a context where doesn't exist",
    );
  });

  test('Select in next context', () => {
    connection.routeChangeSucceed({
      selectedItem: { type: 'category', id: 7, page: 1 },
      context: {
        columns: [
          [
            { type: 'category', id: 7, page: 1 },
            { type: 'category', id: 7, page: 2 },
          ],
        ],
      },
    });
    connection.routeChangeSucceed({ selectedItem: { type: 'post', id: 62 } });
    connection.routeChangeSucceed({
      selectedItem: { type: 'category', id: 7, page: 2 },
      method: 'backward',
    });
    connection.routeChangeSucceed({
      selectedItem: { type: 'post', id: 62 },
      method: 'forward',
    });
    expect(connection.contexts).toMatchSnapshot();
    expect(connection.contexts).toHaveLength(2);
    expect(connection.selectedContext.index).toBe(1);
    expect(connection.selectedItem.id).toBe(62);
  });

  test('Try to select in next context where item doesnt exist', () => {
    connection.routeChangeSucceed({
      selectedItem: { type: 'category', id: 7, page: 1 },
      context: {
        columns: [
          [
            { type: 'category', id: 7, page: 1 },
            { type: 'category', id: 7, page: 2 },
          ],
        ],
      },
    });
    connection.routeChangeSucceed({ selectedItem: { type: 'post', id: 62 } });
    connection.routeChangeSucceed({
      selectedItem: { type: 'category', id: 7, page: 2 },
      method: 'backward',
    });
    expect(() =>
      connection.routeChangeSucceed({
        selectedItem: { type: 'post', id: 63 },
        method: 'forward',
      }),
    ).toThrow(
      "You are trying to select an item in a context where doesn't exist",
    );
  });

  test('Selected single and context object with extracted', () => {
    connection.routeChangeSucceed({
      selectedItem: { type: 'post', id: 60 },
      context: {
        columns: [
          [{ type: 'latest', id: 'post', page: 1, extract: 'horizontal' }],
        ],
      },
    });
    expect(connection.contexts).toMatchSnapshot();
    expect(connection.selectedContext.columns).toHaveLength(1);
  });

  test('Columns should not show next items if extracted after that item is not resolved', () => {
    connection.routeChangeSucceed({
      selectedItem: { type: 'post', id: 60 },
      context: {
        columns: [
          [{ type: 'post', id: 60 }],
          [{ type: 'latest', id: 'post', page: 1, extract: 'horizontal' }],
          [{ type: 'post', id: 63 }],
        ],
      },
    });
    expect(connection.contexts).toMatchSnapshot();
    expect(connection.selectedContext.columns).toHaveLength(1);
  });

  test('Columns should not show previous items if extracted before that item is not resolved', () => {
    connection.routeChangeSucceed({
      selectedItem: { type: 'post', id: 63 },
      context: {
        columns: [
          [{ type: 'post', id: 60 }],
          [{ type: 'latest', id: 'post', page: 1, extract: 'horizontal' }],
          [{ type: 'post', id: 63 }],
        ],
      },
    });
    expect(connection.contexts).toMatchSnapshot();
    expect(connection.selectedContext.columns).toHaveLength(1);
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
    connection.routeChangeSucceed({
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
          [
            { type: 'category', id: 19, page: 1, extract: 'vertical' },
            { type: 'post', id: 20 },
          ],
          [{ type: 'post', id: 21 }],
        ],
      },
    });
    expect(connection.contexts).toMatchSnapshot();
    expect(connection.selectedContext.columns).toHaveLength(7);
    expect(connection.selectedContext.columns[0].items).toHaveLength(1);
    expect(connection.selectedContext.columns[1].items).toHaveLength(2);
    expect(connection.selectedContext.columns[3].items).toHaveLength(2);
    expect(connection.selectedContext.columns[5].items).toHaveLength(2);
  });

  test('Add items from extracted once they are ready', async () => {
    getListPage.mockReturnValueOnce(Promise.resolve(postsFromCategory7));
    connection.routeChangeSucceed({
      selectedItem: { type: 'post', id: 60 },
      context: {
        columns: [
          [{ type: 'category', id: 7, page: 1, extract: 'horizontal' }],
        ],
      },
    });
    expect(connection.selectedContext.rawColumns).toHaveLength(2);
    expect(connection.selectedContext.columns).toHaveLength(1);
    await connection.fetchListPage({ type: 'category', id: 7, page: 1 });
    expect(connection.contexts).toMatchSnapshot();
    expect(connection.selectedContext.rawColumns).toHaveLength(6);
    expect(connection.selectedContext.columns).toHaveLength(6);
  });

  test('Add items from extracted once they are ready, which include an item in the context', async () => {
    getListPage.mockReturnValueOnce(Promise.resolve(postsFromCategory7));
    connection.routeChangeSucceed({
      selectedItem: { type: 'post', id: 54 },
      context: {
        columns: [
          [{ type: 'category', id: 7, page: 1, extract: 'horizontal' }],
        ],
      },
    });
    expect(connection.selectedContext.rawColumns).toHaveLength(2);
    expect(connection.selectedContext.columns).toHaveLength(1);
    await connection.fetchListPage({ type: 'category', id: 7, page: 1 });
    expect(connection.contexts).toMatchSnapshot();
    expect(connection.selectedContext.rawColumns).toHaveLength(5);
    expect(connection.selectedContext.columns).toHaveLength(5);
  });

  test('Add items from extracted if they are ready when accessing for the first time to colums', async () => {
    getListPage.mockReturnValueOnce(Promise.resolve(postsFromCategory7));
    connection.routeChangeSucceed({
      selectedItem: { type: 'post', id: 54 },
      context: {
        columns: [
          [{ type: 'category', id: 7, page: 1, extract: 'horizontal' }],
        ],
      },
    });
    await connection.fetchListPage({ type: 'category', id: 7, page: 1 });
    expect(connection.selectedColumn.nextColumn.items[0].type).toBe('post');
    expect(connection.selectedContext.columns).toHaveLength(5);
  });

  test('Add items from extracted once they are ready avoiding duplications', async () => {
    getListPage.mockReturnValueOnce(Promise.resolve(postsFromCategory7));
    connection.routeChangeSucceed({
      selectedItem: { type: 'post', id: 54 },
      context: {
        columns: [
          [{ type: 'category', id: 7, page: 1, extract: 'horizontal' }],
        ],
      },
    });
    expect(connection.selectedContext.rawColumns).toHaveLength(2);
    expect(connection.selectedContext.columns).toHaveLength(1);
    await connection.fetchListPage({ type: 'category', id: 7, page: 1 });
    expect(connection.contexts).toMatchSnapshot();
    expect(connection.selectedContext.rawColumns).toHaveLength(5);
    expect(connection.selectedContext.columns).toHaveLength(5);
  });

  test('`selectedItem` should be in its natural position inside horizontal extracted list', async () => {
    getListPage.mockReturnValueOnce(Promise.resolve(postsFromCategory7));
    await connection.fetchListPage({ type: 'category', id: 7, page: 1 });
    connection.routeChangeSucceed({
      selectedItem: { type: 'post', id: 54 },
      context: {
        columns: [
          [{ type: 'post', id: 1 }],
          [{ type: 'category', id: 7, page: 1, extract: 'horizontal' }],
          [{ type: 'post', id: 2 }],
        ],
      },
    });
    expect(connection.contexts).toMatchSnapshot();
    expect(connection.selectedContext.columns[0].items[0].id).toBe(1);
    expect(connection.selectedContext.columns[1].items[0].id).toBe(57);
    expect(connection.selectedContext.columns[2].items[0].id).toBe(54);
    expect(connection.selectedContext.columns[2].items[0].fromList.id).toBe(7);
    expect(connection.selectedContext.columns[6].items[0].id).toBe(2);
  });

  test('Extrated items should have the list they are extracted from as `fromList`', async () => {
    getListPage.mockReturnValueOnce(Promise.resolve(postsFromCategory7));
    connection.routeChangeSucceed({
      selectedItem: { type: 'post', id: 60 },
      context: {
        columns: [
          [{ type: 'category', id: 7, page: 1, extract: 'horizontal' }],
        ],
      },
    });
    expect(connection.selectedContext.rawColumns).toHaveLength(2);
    expect(connection.selectedContext.columns).toHaveLength(1);
    await connection.fetchListPage({ type: 'category', id: 7, page: 1 });
    expect(connection.contexts).toMatchSnapshot();
    expect(connection.selectedContext.columns[0].items[0].fromList).toEqual({
      type: 'latest',
      id: 'post',
      page: 1,
    });
    expect(connection.selectedContext.columns[1].items[0].fromList).toEqual({
      type: 'category',
      id: 7,
      page: 1,
    });
  });

  test('Items should have the `fromList` from `selectedItem` as their `fromList`', async () => {
    getListPage.mockReturnValueOnce(Promise.resolve(postsFromCategory7));
    connection.routeChangeSucceed({
      selectedItem: {
        type: 'post',
        id: 60,
        fromList: { type: 'tag', id: 20, page: 1 },
      },
      context: {
        columns: [
          [{ type: 'category', id: 7, page: 1, extract: 'horizontal' }],
        ],
      },
    });
    expect(connection.selectedContext.rawColumns).toHaveLength(2);
    expect(connection.selectedContext.columns).toHaveLength(1);
    await connection.fetchListPage({ type: 'category', id: 7, page: 1 });
    expect(connection.contexts).toMatchSnapshot();
    expect(connection.selectedContext.columns[0].items[0].fromList).toEqual({
      type: 'tag',
      id: 20,
      page: 1,
    });
    expect(connection.selectedContext.columns[1].items[0].fromList).toEqual({
      type: 'category',
      id: 7,
      page: 1,
    });
  });

  test("Don't throw if vertical extracted is added in a column with more stuff", () => {
    expect(() =>
      connection.routeChangeSucceed({
        selectedItem: { type: 'post', id: 60 },
        context: {
          columns: [
            [{ type: 'post', id: 60 }],
            [
              { type: 'post', id: 63 },
              { type: 'category', id: 7, page: 1, extract: 'vertical' },
            ],
          ],
        },
      }),
    ).not.toThrow();
  });

  test('Throw if one column is not an array', () => {
    expect(() =>
      connection.routeChangeSucceed({
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
    ).toThrow('Columns should be arrays and not single objects.');
  });

  test('Add new item to column', () => {
    connection.routeChangeSucceed({
      selectedItem: { type: 'post', id: 62 },
      context: {
        columns: [
          [{ type: 'post', id: 63 }],
          [{ type: 'post', id: 62 }],
          [{ type: 'post', id: 60 }],
        ],
      },
    });
    connection.addItemToColumn({ item: { type: 'post', id: 64 } });
    expect(connection.contexts).toMatchSnapshot();
    expect(connection.contexts[0].columns).toHaveLength(3);
    expect(connection.selectedColumn).toBe(connection.contexts[0].columns[1]);
    expect(connection.selectedItem).toBe(
      connection.contexts[0].columns[1].items[0],
    );
    expect(connection.contexts[0].columns[1].items[1].id).toBe(64);
  });

  test('Add both extracted list and normal list to context', async () => {
    getListPage.mockReturnValueOnce(Promise.resolve(postsFromCategory7));
    connection.routeChangeSucceed({
      selectedItem: { type: 'post', id: 60 },
      context: {
        columns: [
          [{ type: 'post', id: 60 }],
          [{ type: 'category', id: 7, page: 1 }],
          [{ type: 'category', id: 7, page: 1, extract: 'horizontal' }],
        ],
      },
    });
    expect(connection.contexts).toMatchSnapshot();
    expect(connection.contexts[0].columns).toHaveLength(2);
    await connection.fetchListPage({ type: 'category', id: 7, page: 1 });
    expect(connection.contexts).toMatchSnapshot();
    expect(connection.contexts[0].columns).toHaveLength(7);
  });

  test('Throw if horizontal extracted is added in a column with more items', () => {
    expect(() => {
      connection.routeChangeSucceed({
        selectedItem: { type: 'post', id: 60 },
        context: {
          columns: [
            [{ type: 'post', id: 60 }],
            [
              { type: 'post', id: 63 },
              { type: 'category', id: 7, page: 1, extract: 'horizontal' },
            ],
          ],
        },
      });
      // Initializes mst node
      connection.contexts[0].rawColumns[1]; // eslint-disable-line
    }).toThrow(
      "Don't add extracted lists with other items in the same column.",
    );
    // ).toThrow();
    _resetGlobalState();
  });

  test('Throw if new extracted list is added to column', () => {
    connection.routeChangeSucceed({
      selectedItem: { type: 'post', id: 62 },
      context: {
        columns: [
          [{ type: 'post', id: 63 }],
          [{ type: 'post', id: 62 }],
          [{ type: 'post', id: 60 }],
        ],
      },
    });
    expect(() =>
      connection.addItemToColumn({
        item: { type: 'category', id: 7, page: 1, extract: 'horizontal' },
      }),
    ).toThrow();
    _resetGlobalState();
  });

  test('Get next non visited item', () => {
    connection.routeChangeSucceed({
      selectedItem: { type: 'post', id: 62 },
      context: {
        columns: [
          [{ type: 'post', id: 61 }],
          [{ type: 'post', id: 62 }],
          [{ type: 'post', id: 63 }],
        ],
      },
    });
    expect(connection.contexts).toMatchSnapshot();
    expect(connection.selectedContext.nextNonVisited.id).toBe(63);
  });

  test('Get next non visited item after visiting two', () => {
    connection.routeChangeSucceed({
      selectedItem: { type: 'post', id: 62 },
      context: {
        columns: [
          [{ type: 'post', id: 61 }],
          [{ type: 'post', id: 62 }],
          [{ type: 'post', id: 63 }],
        ],
      },
    });
    connection.routeChangeSucceed({
      selectedItem: { type: 'post', id: 61 },
    });
    expect(connection.contexts).toMatchSnapshot();
    expect(connection.selectedContext.nextNonVisited.id).toBe(63);
  });

  test('Get false from hasNonVisited', () => {
    connection.routeChangeSucceed({
      selectedItem: { type: 'post', id: 62 },
      context: {
        columns: [[{ type: 'post', id: 62 }]],
      },
    });
    expect(connection.contexts).toMatchSnapshot();
    expect(connection.selectedColumn.hasNonVisited).toBe(false);
  });

  test('Get true from hasNonVisited', () => {
    connection.routeChangeSucceed({
      selectedItem: { type: 'post', id: 62 },
      context: {
        columns: [[{ type: 'post', id: 61 }, { type: 'post', id: 62 }]],
      },
    });
    expect(connection.contexts).toMatchSnapshot();
    expect(connection.selectedColumn.hasNonVisited).toBe(true);
  });

  test('Get false from hasPreviousColumn', () => {
    connection.routeChangeSucceed({
      selectedItem: { type: 'post', id: 60 },
      context: {
        columns: [
          [{ type: 'latest', id: 'post', page: 1, extract: 'horizontal' }],
        ],
      },
    });
    expect(connection.contexts).toMatchSnapshot();
    expect(connection.selectedColumn.hasPreviousColumn).toBe(false);
  });

  test('Get true from hasPreviousColumn', () => {
    connection.routeChangeSucceed({
      selectedItem: { type: 'category', id: 3, page: 1 },
      context: {
        columns: [
          [{ type: 'latest', id: 'post', page: 1 }],
          [{ type: 'category', id: 3, page: 1 }],
        ],
      },
    });
    expect(connection.contexts).toMatchSnapshot();
    expect(connection.selectedColumn.hasPreviousColumn).toBe(true);
  });

  test('Get previousColumn', () => {
    connection.routeChangeSucceed({
      selectedItem: { type: 'post', id: 32 },
      context: {
        columns: [[{ type: 'post', id: 60 }], [{ type: 'post', id: 32 }]],
      },
    });
    expect(connection.contexts).toMatchSnapshot();
    expect(connection.selectedColumn.previousColumn.items[0].id).toBe(60);
  });

  test('Get null from previousColumn', () => {
    connection.routeChangeSucceed({
      selectedItem: { type: 'post', id: 60 },
      context: {
        columns: [
          [{ type: 'latest', id: 'post', page: 1, extract: 'horizontal' }],
        ],
      },
    });
    expect(connection.contexts).toMatchSnapshot();
    expect(connection.selectedColumn.previousColumn).toBeNull();
  });

  test('Get false from hasNextColumn', () => {
    connection.routeChangeSucceed({
      selectedItem: { type: 'post', id: 60 },
      context: {
        columns: [
          [{ type: 'latest', id: 'post', page: 1, extract: 'horizontal' }],
        ],
      },
    });
    expect(connection.contexts).toMatchSnapshot();
    expect(connection.selectedColumn.hasNextColumn).toBe(false);
  });

  test('Get true from hasNextColumn', () => {
    connection.routeChangeSucceed({
      selectedItem: { type: 'latest', id: 'post', page: 1 },
      context: {
        columns: [
          [{ type: 'latest', id: 'post', page: 1 }],
          [{ type: 'category', id: 3, page: 1 }],
        ],
      },
    });
    expect(connection.contexts).toMatchSnapshot();
    expect(connection.selectedColumn.hasNextColumn).toBe(true);
  });

  test('Get nextColumn', () => {
    connection.routeChangeSucceed({
      selectedItem: { type: 'post', id: 60 },
      context: {
        columns: [[{ type: 'post', id: 60 }], [{ type: 'post', id: 32 }]],
      },
    });
    expect(connection.contexts).toMatchSnapshot();
    expect(connection.selectedColumn.nextColumn.items[0].id).toBe(32);
  });

  test('Get null from nextColumn', () => {
    connection.routeChangeSucceed({
      selectedItem: { type: 'post', id: 60 },
      context: {
        columns: [
          [{ type: 'latest', id: 'post', page: 1, extract: 'horizontal' }],
        ],
      },
    });
    expect(connection.contexts).toMatchSnapshot();
    expect(connection.selectedColumn.nextColumn).toBeNull();
  });

  test('Get the proper values from isSelected in context', () => {
    connection.routeChangeSucceed({
      selectedItem: { type: 'latest', id: 'post', page: 1 },
      context: {
        columns: [
          [{ type: 'latest', id: 'post', page: 1 }],
          [{ type: 'category', id: 1, page: 1 }],
          [{ type: 'category', id: 2, page: 1 }],
        ],
      },
    });
    expect(connection.contexts).toMatchSnapshot();
    expect(connection.contexts[0].isSelected).toBe(true);
    connection.routeChangeSucceed({
      selectedItem: { type: 'tag', id: '1', page: 1 },
      context: {
        columns: [
          [{ type: 'tag', id: 1, page: 1 }],
          [{ type: 'tag', id: 2, page: 1 }],
          [{ type: 'tag', id: 3, page: 1 }],
        ],
      },
    });
    expect(connection.contexts[0].isSelected).toBe(false);
    expect(connection.contexts[1].isSelected).toBe(true);
  });

  test('Get the proper values from isSelected in column', () => {
    connection.routeChangeSucceed({
      selectedItem: { type: 'latest', id: 'post', page: 1 },
      context: {
        columns: [
          [{ type: 'latest', id: 'post', page: 1 }],
          [{ type: 'category', id: 1, page: 1 }],
          [{ type: 'category', id: 2, page: 1 }],
        ],
      },
    });
    expect(connection.contexts).toMatchSnapshot();
    expect(connection.selectedContext.columns[0].isSelected).toBe(true);
    connection.routeChangeSucceed({
      selectedItem: { type: 'category', id: 1, page: 1 },
    });
    expect(connection.selectedContext.columns[0].isSelected).toBe(false);
    expect(connection.selectedContext.columns[1].isSelected).toBe(true);
  });

  test('Get the proper values from isSelected in item', () => {
    connection.routeChangeSucceed({
      selectedItem: { type: 'latest', id: 'post', page: 1 },
      context: {
        columns: [
          [{ type: 'latest', id: 'post', page: 1 }],
          [
            { type: 'category', id: 1, page: 1 },
            { type: 'category', id: 2, page: 1 },
          ],
        ],
      },
    });
    expect(connection.contexts).toMatchSnapshot();
    expect(connection.selectedColumn.items[0].isSelected).toBe(true);
    connection.routeChangeSucceed({
      selectedItem: { type: 'category', id: 2, page: 1 },
    });
    expect(connection.selectedContext.columns[0].items[0].isSelected).toBe(
      false,
    );
    expect(connection.selectedContext.columns[1].items[0].isSelected).toBe(
      false,
    );
    expect(connection.selectedContext.columns[1].items[1].isSelected).toBe(
      true,
    );
    expect(connection.selectedColumn.items[0].isSelected).toBe(false);
    expect(connection.selectedColumn.items[1].isSelected).toBe(true);
  });

  test('Get the proper values from nextItem in item', () => {
    connection.routeChangeSucceed({
      selectedItem: { type: 'latest', id: 'post', page: 1 },
      context: {
        columns: [
          [{ type: 'latest', id: 'post', page: 1 }],
          [
            { type: 'category', id: 1, page: 1 },
            { type: 'category', id: 2, page: 1 },
          ],
        ],
      },
    });
    const [item1] = connection.selectedContext.columns[0].items;
    const [item2, item3] = connection.selectedContext.columns[1].items;
    expect(item1.nextItem).toBe(item2);
    expect(item2.nextItem).toBe(item3);
    expect(item3.nextItem).toBeNull();
  });

  test('Add column to context', async () => {
    getListPage
      .mockReturnValueOnce(Promise.resolve(postsFromCategory7))
      .mockReturnValueOnce(Promise.resolve(postsFromCategory7Page2));
    connection.routeChangeSucceed({
      selectedItem: { type: 'post', id: 54 },
      context: {
        columns: [
          [{ type: 'category', id: 7, page: 1, extract: 'horizontal' }],
        ],
      },
    });
    expect(connection.selectedContext.columns).toHaveLength(1);
    await connection.fetchListPage({ type: 'category', id: 7, page: 1 });
    expect(connection.selectedContext.columns).toHaveLength(5);
    connection.addColumnToContext({
      column: [{ type: 'category', id: 7, page: 2, extract: 'horizontal' }],
    });
    expect(connection.selectedContext.columns).toHaveLength(5);
    expect(connection.contexts).toMatchSnapshot();
    await connection.fetchListPage({ type: 'category', id: 7, page: 2 });
    expect(connection.contexts).toMatchSnapshot();
    expect(connection.selectedContext.columns).toHaveLength(10);
  });
});
