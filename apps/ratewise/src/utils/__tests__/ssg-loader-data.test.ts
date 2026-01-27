import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ensureStaticLoaderData } from '../ssg-loader-data';

type SSGWindow = Window & {
  __VITE_REACT_SSG_HASH__?: string;
  __VITE_REACT_SSG_STATIC_LOADER_DATA__?: Record<string, unknown>;
};

describe('ensureStaticLoaderData', () => {
  const ssgWindow = window as SSGWindow;

  beforeEach(() => {
    Reflect.deleteProperty(ssgWindow, '__VITE_REACT_SSG_HASH__');
    Reflect.deleteProperty(ssgWindow, '__VITE_REACT_SSG_STATIC_LOADER_DATA__');
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('缺少 hash 時應回退為空物件且不呼叫 fetch', async () => {
    await ensureStaticLoaderData();

    expect(ssgWindow.__VITE_REACT_SSG_STATIC_LOADER_DATA__).toEqual({});
    expect(fetch).not.toHaveBeenCalled();
  });

  it('遇到非 JSON 回應時應回退為空物件', async () => {
    ssgWindow.__VITE_REACT_SSG_HASH__ = 'test-hash';
    const mockResponse = new Response('<!DOCTYPE html>', {
      headers: { 'content-type': 'text/html' },
    });

    vi.mocked(fetch).mockResolvedValueOnce(mockResponse);

    await ensureStaticLoaderData();

    expect(ssgWindow.__VITE_REACT_SSG_STATIC_LOADER_DATA__).toEqual({});
  });

  it('取得 JSON 回應時應寫入靜態資料', async () => {
    ssgWindow.__VITE_REACT_SSG_HASH__ = 'test-hash';
    const mockResponse = new Response(JSON.stringify({ '/': { ok: true } }), {
      headers: { 'content-type': 'application/json' },
    });

    vi.mocked(fetch).mockResolvedValueOnce(mockResponse);

    await ensureStaticLoaderData();

    expect(ssgWindow.__VITE_REACT_SSG_STATIC_LOADER_DATA__).toEqual({ '/': { ok: true } });
  });

  it('已有資料時不覆蓋', async () => {
    ssgWindow.__VITE_REACT_SSG_STATIC_LOADER_DATA__ = { existing: true };

    await ensureStaticLoaderData();

    expect(ssgWindow.__VITE_REACT_SSG_STATIC_LOADER_DATA__).toEqual({ existing: true });
    expect(fetch).not.toHaveBeenCalled();
  });
});
