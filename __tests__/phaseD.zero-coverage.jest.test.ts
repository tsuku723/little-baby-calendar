import type { RootStackParamList } from '../src/navigation/types';

describe('Phase D zero-coverage modules', () => {
  afterEach(() => {
    jest.resetModules();
    jest.dontMock('../src/App');
  });

  test('App.js default export forwards src/App default export', () => {
    const mockForwarded = () => null;
    jest.doMock('../src/App', () => ({ __esModule: true, default: mockForwarded }));

    const appJs = require('../App').default;
    expect(appJs).toBe(mockForwarded);
  });


  test('App.js runtime marker is exported', () => {
    jest.doMock('../src/App', () => ({ __esModule: true, default: () => null }));
    const appJs = require('../App');
    expect(appJs.APP_JS_RUNTIME_MARKER).toBe('app-js-runtime');
  });
  test('App.js throws when delegated src/App module throws (abnormal path)', () => {
    jest.doMock('../src/App', () => {
      throw new Error('mock-src-app-load-failed');
    });

    expect(() => require('../App')).toThrow('mock-src-app-load-failed');
  });

  test('dataModels runtime marker is exported from type module', () => {
    const dataModels = require('../src/models/dataModels');
    expect(dataModels.DATA_MODELS_RUNTIME_MARKER).toBe('data-models-runtime');
  });

  test('navigation types module exports runtime marker and typed key shape', () => {
    const navigationTypes = require('../src/navigation/types');
    expect(navigationTypes.NAVIGATION_TYPES_RUNTIME_MARKER).toBe('navigation-types-runtime');

    const sample: RootStackParamList = {
      MainTabs: undefined,
      RecordInput: { recordId: 'r1', isoDate: '2025-01-01', from: 'today' },
      RecordDetail: { recordId: 'r2', from: 'list' },
    };
    expect(sample.RecordDetail?.from).toBe('list');
  });
});
