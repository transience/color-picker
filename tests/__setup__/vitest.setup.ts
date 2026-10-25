import '@testing-library/jest-dom';

import { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';
import * as matchers from 'jest-extended';

expect.extend(matchers);

// TODO(testing-library/jest-dom#738): jest-dom 7 augments vitest 4's `Assertion<T>`, which no longer
// merges with vitest 5's `Assertion<R, T>`. Remove once jest-dom ships vitest 5 types.
declare module 'vitest' {
  // Merged declarations must repeat vitest's type parameters.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, unused-imports/no-unused-vars
  interface Matchers<R, T> extends TestingLibraryMatchers<unknown, R> {}
}

process.on('unhandledRejection', (reason, promise) => {
  // eslint-disable-next-line no-console
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: query === '(hover: hover) and (pointer: fine)',
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver for HeroUI components
class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

global.ResizeObserver = ResizeObserverMock;

// jsdom does not implement Pointer Capture APIs
if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
  Element.prototype.hasPointerCapture = vi.fn().mockReturnValue(false);
}
