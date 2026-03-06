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

  // RootStackParamList 等の型整合は runtime(Jest) ではなく
  // `npm run typecheck` (tsc --noEmit) で担保する。
});
