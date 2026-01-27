import { vi } from 'vitest';

// Mock fetch helper
export function mockFetch(data: unknown, ok = true) {
  return vi.fn().mockResolvedValue({
    ok,
    json: async () => data,
    status: ok ? 200 : 400,
  });
}

export * from '@testing-library/react';
