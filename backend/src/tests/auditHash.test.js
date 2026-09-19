const { computeHash } = require('../middleware/audit.middleware');

describe('Audit hash chain', () => {
  const originalSecret = process.env.AUDIT_LOG_SECRET;
  beforeAll(() => {
    // ensure deterministic secret for tests
    process.env.AUDIT_LOG_SECRET = 'test_secret_value';
  });

  afterAll(() => {
    process.env.AUDIT_LOG_SECRET = originalSecret;
  });

  test('computeHash is deterministic and chains with prevHash', () => {
    const payload1 = { user: 'u1', action: 'A', meta: { a: 1 } };
    const payload2 = { user: 'u1', action: 'B', meta: { b: 2 } };

    const h1 = computeHash(payload1, null);
    const h1b = computeHash(payload1, null);
    expect(h1).toBeDefined();
    expect(h1).toEqual(h1b);

    const h2 = computeHash(payload2, h1);
    const h2b = computeHash(payload2, h1);
    expect(h2).toBeDefined();
    expect(h2).toEqual(h2b);
    expect(h2).not.toEqual(h1);
  });
});
