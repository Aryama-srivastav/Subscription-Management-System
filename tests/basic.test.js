import { describe, it, expect } from 'vitest';
import { validatePassword, validateEmail } from '../src/utils/validators.js';
import { round2, toNumber } from '../src/utils/money.js';
import { canTransitionSub } from '../src/utils/status.js';
import { nextBillingDate } from '../src/utils/dates.js';

describe('validators', () => {
  it('rejects short password', () => { expect(validatePassword('Ab1!')).toBeTruthy(); });
  it('accepts strong password', () => { expect(validatePassword('StrongP@ss1')).toBeNull(); });
  it('validates email', () => { expect(validateEmail('a@b.com')).toBeNull(); expect(validateEmail('bad')).toBeTruthy(); });
});

describe('money', () => {
  it('rounds', () => { expect(round2(1.005)).toBe(1.01); });
  it('toNumber', () => { expect(toNumber('abc')).toBe(0); expect(toNumber('5')).toBe(5); });
});

describe('status transitions', () => {
  it('allows forward', () => { expect(canTransitionSub('draft','quotation')).toBe(true); });
  it('allows close', () => { expect(canTransitionSub('active','closed')).toBe(true); });
  it('disallows skip', () => { expect(canTransitionSub('draft','active')).toBe(false); });
});

describe('dates', () => {
  it('next billing monthly', () => { expect(nextBillingDate('2026-01-15','monthly')).toBe('2026-02-15'); });
});
