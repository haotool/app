import { describe, expect, it } from 'vitest';
import { resolveGaMeasurementId } from '../analyticsGate';

const GA_ID = 'G-TEST123456';

describe('resolveGaMeasurementId', () => {
  it('正式站 host 放行 measurement ID', () => {
    expect(resolveGaMeasurementId('app.haotool.org', GA_ID)).toBe(GA_ID);
  });

  it.each([
    ['staging host', 'ratewise-staging.zeabur.app'],
    ['localhost preview', 'localhost'],
    ['loopback IP', '127.0.0.1'],
    ['非正式子網域', 'preview.app.haotool.org'],
  ])('%s 回傳空字串使 initGA 提早返回', (_label, hostname) => {
    expect(resolveGaMeasurementId(hostname, GA_ID)).toBe('');
  });

  it('measurement ID 為空時維持空字串', () => {
    expect(resolveGaMeasurementId('app.haotool.org', '')).toBe('');
  });
});
