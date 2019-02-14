/* eslint-disable max-len, quotes */
const assert = require('assert');

const { getBlocks, normaliseBlocks, reduceBlocks } = require('./block');

describe('get blocks', () => {
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
        text: '\n',
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
    const blocks = [{
        text: '{\n  const block1;\n  {\n    const block2;\n  }\n  {\n    const block3;\n  }\n}',
        children: [{
          text: '{\n    const block2;\n  }',
          children: null,
        }, {
          text: '{\n    const block3;\n  }',
          children: null,
        }],
      }, {
        text: '{\n  const block4;\n  {\n    const block5;\n  }\n}',
        children: [{
          text: '{\n    const block5;\n  }',
          children: null,
        }],
      },
    ];
    const expected = [{
        text: '{\n  const block1;\n  {\n    const block2;\n  }\n  {\n    const block3;\n  }\n}',
        part: '{\n  const block1;\n  bl0ck\n  bl1ck\n}',
        children: [{
          text: '{\n    const block2;\n  }',
          part: '{\n    const block2;\n  }',
          children: null
        }, {
          text: '{\n    const block3;\n  }',
          part: '{\n    const block3;\n  }',
          children: null
        }],
      }, {
        text: '{\n  const block4;\n  {\n    const block5;\n  }\n}',
        part: '{\n  const block4;\n  bl0ck\n}',
        children: [{
          text: '{\n    const block5;\n  }',
          part: '{\n    const block5;\n  }',
          children: null
        }],
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
        part: 'text outside block\n',
        children: null,
      }, {
        text: '{\n  const block1;\n  {\n    const block2;\n  }\n  {\n    const block3;\n  }\n}',
        part: '{\n  const block1;\n  bl0ck\n  bl1ck\n}',
        children: [{
          text: '{\n    const block2;\n  }',
          part: '{\n    const block2;\n  }',
          children: null,
        }, {
          text: '{\n    const block3;\n  }',
          part: '{\n    const block3;\n  }',
          children: null,
        }],
      }, {
        text: '{\n  const block4;\n  {\n    const block5;\n  }\n}',
        part: '{\n  const block4;\n  bl0ck\n}',
        children: [{
          text: '{\n    const block5;\n  }',
          part: '{\n    const block5;\n  }',
          children: null
        }],
      },
    ];
    const res = normaliseBlocks(blocks);
    assert.deepStrictEqual(res, expected, 'Failed to normalise text outside blocks');
  });
  it('should handle multiple blocks with text', () => {
    const t = `
    header
    function() {
      const a = 1;
    }
    body text
    function2() {
      a = 2;
    }
    footer text
    `;
    const expected = [{
        text: '\n    header\n    function() ',
        part: '\n    header\n    function() ',
        children: null,
      }, {
        text: '{\n      const a = 1;\n    }',
        part: '{\n      const a = 1;\n    }',
        children: null,
      }, {
        text: '\n    body text\n    function2() ',
        part: '\n    body text\n    function2() ',
        children: null,
      }, {
        text: '{\n      a = 2;\n    }',
        part: '{\n      a = 2;\n    }',
        children: null,
      }, {
        text: '\n    footer text\n    ',
        part: '\n    footer text\n    ',
        children: null,
      },
    ];
    const res = normaliseBlocks(getBlocks(t));
    assert.deepStrictEqual(res, expected, 'Failed to handle multiple blocks with text');
  });
});

describe('reduceBlocks', () => {
  it('should reduce blocks', () => {
    const t = [{
        text: '\n      function() ',
        children: null,
        part: '\n      function() ',
        vars: [],
      }, {
        children: [{
            text: '{\n          a++;\n        }',
            part: '{\n          a++;\n        }',
            vars: [],
            children: null
          },
          { text: '\n      ', part: '\n      ', children: null, vars: [] },
        ],
        text:
         '{\n        var a = 1;\n        for (var i = 1; i < 5; i++) {\n          a++;\n        }\n      }',
        part:
         '{bl1ck  var a = 1;\n        for (var i = 1; i < 5; i++) bl0ck\n      }',
        vars: [
          { name: 'a', dec: false, reassigned: true, ndx: 10 },
          { name: 'i', dec: false, reassigned: true, ndx: 34 },
        ],
      }, {
        text: '\n    ', children: null, part: '\n    ', vars: [],
      }
    ];
    const expected = `
      function() {
        var a = 1;
        for (var i = 1; i < 5; i++) {
          a++;
        }
      }
    `;
    const res = reduceBlocks('part')(t);
    assert.deepStrictEqual(res, expected, 'Failed to reduce blocks');
  });
  it('should reduce blocks 2', () => {
    const t = [{
        text: '\n',
        part: '\n',
        children: null,
      }, {
        text: '{\n  const block1;\n  {\n    const block2;\n  }\n  {\n    const block3;\n  }\n}',
        part: '{\n  const block1;\n  bl0ck\n  bl1ck\n}',
        children: [{
          text: '{\n    const block2;\n  }',
          part: '{\n    const block2;\n  }',
          children: null,
        }, {
          text: '{\n    const block3;\n  }',
          part: '{\n    const block3;\n  }',
          children: null,
        }],
      }, {
        text: '{\n  const block4;\n  {\n    const block5;\n  }\n}',
        part: '{\n  const block4;\n  bl0ck\n}',
        children: [{
          text: '{\n    const block5;\n  }',
          part: '{\n    const block5;\n  }',
          children: null,
        }],
      },
    ];
    const expected = '\n{\n  const block1;\n  {\n    const block2;\n  }\n  ' +
      '{\n    const block3;\n  }\n}' +
      '{\n  const block4;\n  {\n    const block5;\n  }\n}';
    const res = reduceBlocks('part')(t);
    assert.strictEqual(res, expected, 'Failed to reduce blocks 2');
  });
});

describe('full block process', () => {
  it('should go there and back again', () => {
    const t = 'some text';
    const res = reduceBlocks('part')(normaliseBlocks(getBlocks(t)));
    assert.strictEqual(t, res, 'Failed there and back again');
  });
  it('should go there and back again 2', () => {
    const t = `
    header
    var a = 1;
    var b = 2;
    function() {
      var c = 1;
      for (var i = 1; i < 5; i++) {
        b += 1;
      }
    }
    body text
    function2() {
      var d = 1;
    }
    footer text
    `;
    const reducePart = reduceBlocks('part');
    const blocks = getBlocks(t);
    const normalised = normaliseBlocks(blocks);
    const res = reducePart(normalised);
    assert.strictEqual(t, res, 'Failed there and back again');
  });
});

