const assert = require('assert');

const { findMatchingBrace, getBlocks } = require('./replacers');

describe('blocks', () => {
  it('should work for a single block', () => {
    const t = `{ }`;
    const expected = `{ }`;
    const res = getBlocks(t);
    assert.strictEqual(t, expected, 'Failed for single block');
  });
  it('should split nested blocks', () => {
    const t = `
{
  const block1;
  {
    const block2;
  }
}
    `;
    const expected = [
      `{\n  const block1;\n  {\n    const block2;\n  }\n}`,
      `{\n    const block2;\n  }`,
    ];
    const res = getBlocks(t);
    assert.deepStrictEqual(res, expected, 'Failed to split block');
  });
  it('should split consecutive blocks', () => {
    const t = `{ const firstblock; }{ const secondblock; } `;
    const expected = [
      "{ const firstblock; }",
      "{ const secondblock; }",
    ];
    const res = getBlocks(t);
    assert.deepStrictEqual(res, expected, 'Failed to split consecutive blocks');
  });
  it('should handle mixed blocks', () => {
    const t = `
{
  const block1;
  {
    const block2;
  }
  {
    const block3;
  }
}
{
  const block4;
  {
    const block5;
  }
}
    `;
    const expected = [
      '{\n  const block1;\n  {\n    const block2;\n  }\n  {\n    const block3;\n  }\n}',
      '{\n    const block2;\n  }',
      '{\n    const block3;\n  }',
      '{\n  const block4;\n  {\n    const block5;\n  }\n}',
      '{\n    const block5;\n  }',
    ];
    const res = getBlocks(t);
    assert.deepStrictEqual(res, expected, 'Failed to handle mixed blocks');
  });
});

