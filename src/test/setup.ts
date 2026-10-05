import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Browser APIs jsdom lacks. The observer never reports an intersection, so
// anything gated on "scrolled into view" stays dormant unless a test says so.
class InertObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
// Assigned directly (not `vi.stubGlobal`) so per-test unstubbing leaves them be.
Object.assign(globalThis, {
  IntersectionObserver: InertObserver,
  ResizeObserver: InertObserver,
});
Element.prototype.scrollIntoView = () => {};

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});
