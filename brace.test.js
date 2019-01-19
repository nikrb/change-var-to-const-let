const assert = require('assert');

const { findMatchingBrace } = require('./replacers');

describe('find matching brace', () => {
  it('should return string length if no matching brace', () => {
    const t = ` `;
    const res = findMatchingBrace(t);
    assert.strictEqual(res, t.length, 'Failed to handle no matching brace');
  });
  it('should find matching brace', () => {
    const t = `{ }`;
    const res = findMatchingBrace(t);
    assert.strictEqual(res, 2, 'Failed to find matching brace');
  });
  it('should find nested braces', () => {
    const t = `{
      {
        const innerblock;
      }
    }`;
    const res = findMatchingBrace(t);
    const exp = t.lastIndexOf('}');
    assert.strictEqual(res, exp, 'Failed to find nested braces');
    const t2 = t.substring(t.lastIndexOf('{'));
    const res2 = findMatchingBrace(t2);
    const exp2 = t2.indexOf('}');
    assert.strictEqual(res2, exp2, 'Failed to find nested braces');
  });
});

