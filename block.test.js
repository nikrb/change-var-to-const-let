const assert = require('assert');

const { findMatchingBrace, getBlocks, normaliseBlocks, reduceBlocks } = require('./block');

describe('blocks', () => {
  it('should handle no blocks', () => {
    const t = ' ';
    const expected = [{ text: ' ', children: null }];
    const res = getBlocks(t);
    assert.deepStrictEqual(res, expected, 'Failed to handle no blocks');
  });
  it('should work for a single block', () => {
    const t = `
    {
    }
    `;
    const expected = [
      { text: '\n    ', children: null },
      { text: '{\n    }', children: null},
      { text: '\n    ', children: null},
    ];
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
        text:'\n',
        children: null,
      }, {
        text: `{\n  const block1;\n  {\n    const block2;\n  }\n}`,
        children: [
          { text: '{\n    const block2;\n  }', children: null },
          { text: '\n', children: null },
        ],
      }, {
        text: '\n    ',
        children: null,
      },
    ];
    const res = getBlocks(t);
    assert.deepStrictEqual(res, expected, 'Failed to split block');
  });
  it('should split consecutive blocks', () => {
    const t = `
    function() {
      const firstblock;
    }
    function2() {
      const secondblock;
    } `;
    const expected = [
      { text: '\n    function() ', children: null },
      { text: '{\n      const firstblock;\n    }', children: null },
      { text: '\n    function2() ', children: null },
      { text: '{\n      const secondblock;\n    }', children: null },
      { text: ' ', children: null },
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
        text: '\n',
        children: null,
      }, {
        text: '{\n  const block1;\n  {\n    const block2;\n  }\n  {\n    const block3;\n  }\n}',
        children: [
          { text: '{\n    const block2;\n  }', children: null },
          { text: '\n  ', children: null },
          { text: '{\n    const block3;\n  }', children: null },
          { text: '\n', children: null },
        ],
      }, {
        text: '\n', children: null, 
      }, {
        text: '{\n  const block4;\n  {\n    const block5;\n  }\n}',
        children: [
          { text: '{\n    const block5;\n  }', children: null },
          { text: '\n', children: null },
        ],
      }, {
        text: '\n    ',
        children: null,
      },
    ];
    const res = getBlocks(t);
    assert.deepStrictEqual(res, expected, 'Failed to handle mixed blocks');
  });
  it('should handle text with blocks', () => {
    const t = `
this is some instruction text
{
  const block1;
  {
    const block2;
  }
}
    `;
    const expected = [{
        text: '\nthis is some instruction text\n',
        children: null,
      }, {
        text: '{\n  const block1;\n  {\n    const block2;\n  }\n}',
        children: [
          { text: '{\n    const block2;\n  }', children: null },
          { text: '\n', children: null },
        ],
      },
      { text: '\n    ', children: null },
    ];
    const res = getBlocks(t);
    assert.deepStrictEqual(res, expected, 'Failed to handle text with blocks');
  });
  it('should handle text after blocks', () => {
    const t = `
    some pre block text
    {
      const block1 = 2;
    }
    and some post block text
    `;
    const expected = [
      { text: '\n    some pre block text\n    ', children: null },
      { text: '{\n      const block1 = 2;\n    }', children: null },
      { text: '\n    and some post block text\n    ', children: null },
    ];
    const res = getBlocks(t);
    assert.deepStrictEqual(res, expected, 'Failed to handle text after blocks');
  });
});

describe('normalise blocks', () => {
  it('should normalise block text', () => {
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
        text: '{\n  const block1;\n  {\n    const block2;\n  }\n  {\n    const block3;\n  }\n}',
        part: '{\n  const block1;\n  <block0>\n  <block1>\n}',
        children: [
          { text: '{\n    const block2;\n  }', children: null },
          { text: '{\n    const block3;\n  }', children: null },
        ],
      }, {
        text: '{\n  const block4;\n  {\n    const block5;\n  }\n}',
        part: '{\n  const block4;\n  <block0>\n}',
        children: [
          { text: '{\n    const block5;\n  }', children: null },
        ],
      },
    ];
    const res = normaliseBlocks(blocks);
    assert.deepStrictEqual(res, expected, 'Failed to normalise blocks');
  });
  it('should normalise text outside blocks', () => {
    const blocks = [{
        text: 'text outside block\n',
        children: null,
      }, {
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
    const expected = [{
        text: 'text outside block\n',
        children: null,
      }, {
        text: '{\n  const block1;\n  {\n    const block2;\n  }\n  {\n    const block3;\n  }\n}',
        part: '{\n  const block1;\n  <block0>\n  <block1>\n}',
        children: [
          { text: '{\n    const block2;\n  }', children: null },
          { text: '{\n    const block3;\n  }', children: null },
        ],
      }, {
        text: '{\n  const block4;\n  {\n    const block5;\n  }\n}',
        part: '{\n  const block4;\n  <block0>\n}',
        children: [
          { text: '{\n    const block5;\n  }', children: null },
        ],
      },
    ];
    const res = normaliseBlocks(blocks);
    assert.deepStrictEqual(res, expected, 'Failed to normalise text outside blocks');
  });
});

describe('reduceBlocks', () => {
  it('should reduce blocks', () => {
    const t = [{
        text: '\n',
        children: null,
      }, {
        text: '{\n  const block1;\n  {\n    const block2;\n  }\n  {\n    const block3;\n  }\n}',
        part: '{\n  const block1;\n  <block0>\n  <block1>\n}',
        children: [
          { text: '{\n    const block2;\n  }', children: null },
          { text: '{\n    const block3;\n  }', children: null },
        ],
      }, {
        text: '{\n  const block4;\n  {\n    const block5;\n  }\n}',
        part: '{\n  const block4;\n  <block0>\n}',
        children: [
          { text: '{\n    const block5;\n  }', children: null },
        ],
      },
    ];
    const expected = '\n{\n  const block1;\n  {\n    const block2;\n  }\n  ' +
      '{\n    const block3;\n  }\n}' +
      '{\n  const block4;\n  {\n    const block5;\n  }\n}';
    const res = reduceBlocks(t);
    assert.strictEqual(res, expected, 'Failed to reduce blocks');
  });
});

describe('full block process', () => {
  it('should go there and back again', () => {
    const t = 'some text';
    const res = reduceBlocks(normaliseBlocks(getBlocks(t)));
    assert.strictEqual(t, res, 'Failed there and back again');
  });
  it('should go there and back again 2', () => {
    const t = `
    header
    function() {
      const a = 1;
    }
    body text
    function2() {
    }
    footer text
    `;
    const res = reduceBlocks(normaliseBlocks(getBlocks(t)));
    assert.strictEqual(t, res, 'Failed there and back again');
  });
});

