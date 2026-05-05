import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

if (!URL.createObjectURL) {
  URL.createObjectURL = vi.fn(() => "blob:test-preview");
}

if (!URL.revokeObjectURL) {
  URL.revokeObjectURL = vi.fn();
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.restoreAllMocks();
});
