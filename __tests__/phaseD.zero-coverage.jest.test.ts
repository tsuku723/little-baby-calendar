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

  test('App.js throws when delegated src/App module throws (abnormal path)', () => {
    jest.doMock('../src/App', () => {
      throw new Error('mock-src-app-load-failed');
    });

    expect(() => require('../App')).toThrow('mock-src-app-load-failed');
  });

  test('navigation type alias sample is a compile-time guard for RootStackParamList', () => {
    // このテストの主目的は RootStackParamList の型整合を維持すること。
    // sample が型チェックを通ることで、主要 route パラメータの契約崩れを検知する。
    const sample: RootStackParamList = {
      MainTabs: undefined,
      RecordInput: { recordId: 'r1', isoDate: '2025-01-01', from: 'today' },
      RecordDetail: { recordId: 'r2', from: 'list' },
    };

    expect(sample.RecordInput?.from).toBe('today');
    expect(sample.RecordDetail?.from).toBe('list');
  });
});
