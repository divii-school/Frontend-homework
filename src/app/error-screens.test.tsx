import { describe, expect, it } from 'vitest';
import { createElement, type ComponentType } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import RootError from './error';
import GlobalError from './global-error';
import MainError from './(main)/error';

/**
 * TC-COMMON-21. A crash cannot be triggered on the QA server from outside, so the three crash
 * screens are rendered here directly: the text the user sees, the retry button, and never the
 * network message (code review item 7).
 */
type ErrorScreen = ComponentType<{ error: Error & { digest?: string }; reset: () => void }>;
const render = (screen: ErrorScreen) =>
  renderToStaticMarkup(createElement(screen, { error: new Error('boom'), reset: () => undefined }));

describe('crash screens', () => {
  it.each([
    ['app/error.tsx (login and pages outside the admin shell)', RootError],
    ['app/(main)/error.tsx (admin pages, menu stays)', MainError],
    ['app/global-error.tsx (root layout itself)', GlobalError],
  ] as [string, ErrorScreen][])('%s shows the crash message and 다시 시도', (_name, screen) => {
    const html = render(screen);
    expect(html).toContain('화면을 표시하는 중 오류가 발생했습니다.');
    expect(html).toContain('다시 시도');
    expect(html).toContain('role="alert"');
    expect(html).not.toContain('네트워크');
    expect(html).not.toContain('boom'); // the technical error text is never shown to the user
  });

  it('global-error brings its own <html lang="ko"> and a way back to 상품 관리', () => {
    const html = render(GlobalError);
    expect(html).toContain('<html lang="ko"');
    expect(html).toContain('href="/shopping/products"');
  });
});
