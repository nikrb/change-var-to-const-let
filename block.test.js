const assert = require('assert');

const { findMatchingBrace, getBlocks } = require('./replacers');

describe('blocks', () => {
  it('should handle no blocks', () => {
    const t = ' ';
    const expected = [{ text: ' ', children: null }];
    const res = getBlocks(t);
    assert.deepStrictEqual(res, expected, 'Failed to handle no blocks');
  });
  it('should work for a single block', () => {
    const t = `{ }`;
    const expected = [{ text: '{ }', children: null }];
    const res = getBlocks(t);
    assert.deepStrictEqual(res, expected, 'Failed for single block');
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
    const expected = [{
        text: `{\n  const block1;\n  {\n    const block2;\n  }\n}`,
        children: [{ text: '{\n    const block2;\n  }', children: null }],
      },
    ];
    const res = getBlocks(t);
    assert.deepStrictEqual(res, expected, 'Failed to split block');
  });
  it('should split consecutive blocks', () => {
    const t = `{ const firstblock; }{ const secondblock; } `;
    const expected = [
      { text: '{ const firstblock; }', children: null },
      { text: '{ const secondblock; }', children: null },
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
    const expected = [{
        text: '{\n  const block1;\n  {\n    const block2;\n  }\n  {\n    const block3;\n  }\n}',
        children: [
          { text: '{\n    const block2;\n  }', children: null },
          { text: '{\n    const block3;\n  }', children: null },
        ],
      }, {
        text: '{\n  const block4;\n  {\n    const block5;\n  }\n}',
        children: [
          { text: '{\n    const block5;\n  }', children: null },
        ],
      },
    ];
    const res = getBlocks(t);
    assert.deepStrictEqual(res, expected, 'Failed to handle mixed blocks');
  });
});

const normaliseBlocks = blocks => {
  return blocks.map(block => {
    if (block.children) {
      block.children.forEach((child, i) => {
        if (child.children) normaliseBlock(child.children);
        block.text = block.text.replace(child.text, `<block${i}>`);
      });
    }
    return block;
  });
};

it('should blockety', () => {
  const blocks =  [{
      text: '{\n  const block1;\n  {\n    const block2;\n  }\n  {\n    const block3;\n  }\n}',
      children: [
        { text: '{\n    const block2;\n  }', children: null },
        { text: '{\n    const block3;\n  }', children: null },
      ],
    }, {
      text: '{\n  const block4;\n  {\n    const block5;\n  }\n}',
      children: [
        { text: '{\n    const block5;\n  }', children: null },
      ],
    },
  ];
  const expected =  [{
      text: '{\n  const block1;\n  <block0>\n  <block1>\n}',
      children: [
        { text: '{\n    const block2;\n  }', children: null },
        { text: '{\n    const block3;\n  }', children: null },
      ],
    }, {
      text: '{\n  const block4;\n  <block0>\n}',
      children: [
        { text: '{\n    const block5;\n  }', children: null },
      ],
    },
  ];
  const res = normaliseBlocks(blocks);
  assert.deepStrictEqual(res, expected, 'Failed blockety');
});

