/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { middleware } from '../src/middleware';

function request(pathname: string, cookie?: string): NextRequest {
  return new NextRequest(`https://dashboard.test${pathname}`, {
    headers: cookie ? { cookie } : undefined,
  });
}

describe('middleware route protection', () => {
  it('redirects unauthenticated users away from known protected routes', () => {
    const response = middleware(request('/dashboard'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://dashboard.test/');
  });

  it('lets unknown routes reach Next.js 404 handling', () => {
    const response = middleware(request('/this-route-does-not-exist'));

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
  });
});
