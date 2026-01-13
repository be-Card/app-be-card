import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  }
}));

import api from '../api';
import authService from '../authService';

describe('authService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
  });

  it('guarda access_token y refresh_token en login', async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: {
        access_token: 'access',
        refresh_token: 'refresh',
        token_type: 'bearer',
        expires_in: 1800,
      }
    } as any);

    const result = await authService.login({ email: 'a@b.com', password: 'x' });

    expect(result.access_token).toBe('access');
    expect(localStorage.getItem('access_token')).toBe('access');
    expect(localStorage.getItem('refresh_token')).toBe('refresh');
  });
});

