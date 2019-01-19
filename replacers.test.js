const assert = require('assert');
const {
  const2let,
  fors,
  separateMultiLineVars,
  varconst
} = require('./replacers');

describe('for loop transform', () => {
  const t = `for (var i = 0; i < ourArr.length; i++) {
      ourTotal += ourArr[i];
    }`;
  const expected = `for (let i = 0; i < ourArr.length; i++) {
      ourTotal += ourArr[i];
    }`;
  it('should replace vars in for loops', () => {
    const res = fors(t);
    assert.equal(res, expected, 'Failed to replace var in for loops');
  });
  const t2 = `
  var a = 1;
  if (something) {
    for(var i =0; i<5; i++) {
      doSomethingElse();
    }
  }
  `;
  const expected2 = `
  var a = 1;
  if (something) {
    for(let i =0; i<5; i++) {
      doSomethingElse();
    }
  }
  `;
  it('should preserve indent', () => {
    const res = fors(t2);
    assert.equal(res, expected2, 'Failed to preserve indent');
  });
});

describe('split up multi line var definitions', () => {
  it('should separate multiline var definitions', () => {
    const t = `
    var a = 1,
        b = 2;
    var c = 3;
    var e = [], f = [];
    var c5 = 5;
    var c2 = 3.5, c3 = 3.8,
        c4 = 3.9;
    var d = 4;`;
    const expected = `
    var a = 1;
    var b = 2;
    var c = 3;
    var e = [];
    var f = [];
    var c5 = 5;
    var c2 = 3.5;
    var c3 = 3.8;
    var c4 = 3.9;
    var d = 4;`;
    const res = separateMultiLineVars(t);
    assert.equal(res, expected, 'Failed to separate multiline defs');
  });
  it('should not transform for loops', () => {
    const t = `for (var i = 0; i<arr.lenth; i++){
      doSomething();
    }`;
    const expected = `for (var i = 0; i<arr.lenth; i++){
      doSomething();
    }`;
    const res = separateMultiLineVars(t);
    assert.equal(res, expected, 'Failed to NOT transform for loop');
  });
  it('should preserve indent on multiline declarations and definitions', () => {
    const t = `
    var a = 1;
      var b = 2, c = 3,
          d = 4;
    var e, f, g;
    `;
      const expected = `
    var a = 1;
      var b = 2;
      var c = 3;
      var d = 4;
    var e;
    var f;
    var g;
    `;
    const res = separateMultiLineVars(t);
    assert.equal(res, expected,
      'Failed to preserve indent on multiline decs and defs');
  });
  it('should handle mixed multiple declarations and definitions', () => {
    const t = `
      var i, ch, chars = input.split(' '), chars2 = input.split(" ");
      for (i = 1; i < 6; i++) {
        ch = chars.splice(i, 1);
      }
    `;
    const expected = `
      var i;
      var ch;
      var chars = input.split(' ');
      var chars2 = input.split(" ");
      for (i = 1; i < 6; i++) {
        ch = chars.splice(i, 1);
      }
    `;
    const res = separateMultiLineVars(t);
    assert.equal(
      res,
      expected,
      'Failed to handle mixed declarations and definitions'
    );
  });
});

describe('transform var to const', () => {
  it('should replace var with const', () => {
    const t = `var a = 1,
          b = 2;
      var a = 1;
      var b = 2;`;
    const expected = `const a = 1,
          b = 2;
      const a = 1;
      const b = 2;`;
    const res = varconst(t);
    assert.equal(res, expected, 'Failed to replace var with const');
  });
});

describe('change const to let if variable reassigned', () => {
  it('should handle declarations and reassignment', () => {
    const t = `
      const a;
      const b = 1;
      const b2 = 2;
      const c=3;
      const c2=4;
      a = 1;
      b2 = 5;
      c2 = 6;
    `;
    const expected = `
      let a;
      const b = 1;
      let b2 = 2;
      const c=3;
      let c2 =4;
      a = 1;
      b2 = 5;
      c2 = 6;
    `;
    const res = const2let(t);
    assert.equal(
      res,
      expected,
      'Failed to handle declaration and reassignment'
    );
  });
  it('should recognise shorthand assignment operators', () => {
    const t = `
      const a = 1;
      const b = 2;
      const c;
      const d = 4;
      const e = 5;
      const f = 5.5;
      a += 6;
      b -= 7;
      c *= 8;
      d /= 9;
      e ^= 10;
      f %= 11;
    `;
    const expected = `
      let a = 1;
      let b = 2;
      let c;
      let d = 4;
      let e = 5;
      let f = 5.5;
      a += 6;
      b -= 7;
      c *= 8;
      d /= 9;
      e ^= 10;
      f %= 11;
    `;
    const res = const2let(t);
    assert.equal(
      res,
      expected,
      'Failed to recognise shorthand assignment operators'
    );
  });
  it('should recognise increment/decrement operators as assignment', () => {
    const t = `
    const a = 1;
    const b = 2;
    const c = 3;
    const d = 4;
    ++a;
    --b;
    c++;
    d--;
    `;
    const expected = `
    let a = 1;
    let b = 2;
    let c = 3;
    let d = 4;
    ++a;
    --b;
    c++;
    d--;
    `;
    const res = const2let(t);
    assert.equal(
      res,
      expected,
      'Failed to recognise increment/decrement operators'
    );
  });
  it('should recognise array destructure reassignment', () => {
    const t = `
    const a = 1;
    const b = 2;
    const c = 3;
    c += a;
    a = [b, b=b+a][0];
    `;
    const expected = `
    let a = 1;
    let b = 2;
    let c = 3;
    c += a;
    a = [b, b=b+a][0];
    `;
    const res = const2let(t);
    assert.equal(
      res,
      expected,
      'Failed to recognise array destructure reassignment'
    );
  });
  it('should allow separate declaration of for loop iterator', () => {
    const t = `
      const i;
      const ch;
      const chars = input.split(' ');
      const chars2 = input.split(" ");
      for (i = 1; i < 6; i++) {
        ch = chars.splice(i, 1);
      }
    `;
    const expected = `
      let i;
      let ch;
      const chars = input.split(' ');
      const chars2 = input.split(" ");
      for (i = 1; i < 6; i++) {
        ch = chars.splice(i, 1);
      }
    `;
    const res = const2let(t);
    assert.equal(
      res,
      expected,
      'Failed to allow separate declaration of for loop iterator'
    );
  });
  it('should respect sections in md files when finding reassignment',
    () => {
    const t = `
<section id='challengeSeed'>
  <div id='js-seed'>
    const ourArr = [ 9, 10, 11, 12];
    const ourTotal = 0;
  </div>
</section>

<section id='solution'>
  const ourArr = [ 9, 10, 11, 12];
  const ourTotal = 0;

  ourTotal += 1;
</section>
`;
    const expected = `
<section id='challengeSeed'>
  <div id='js-seed'>
    const ourArr = [ 9, 10, 11, 12];
    const ourTotal = 0;
  </div>
</section>

<section id='solution'>
  const ourArr = [ 9, 10, 11, 12];
  let ourTotal = 0;

  ourTotal += 1;
</section>
`;
    const res = const2let(t);
    assert.equal(
      res,
      expected,
      'Failed to respect sections for reassignment'
    );
  });
  it('should preserve const if reassignment is also a definition', () => {
    /* eslint-disable max-len */
    const t = `
## Description
<section id='description'>
ES6 adds some nice support for easily defining object literals.
Consider the following code:
<blockquote>const getMousePosition = (x, y) => ({<br>&nbsp;&nbsp;x: x,<br>&nbsp;&nbsp;y: y<br>});</blockquote>
<code>getMousePosition</code> is a simple function that returns an object containing two fields.
ES6 provides the syntactic sugar to eliminate the redundancy of having to write <code>x: x</code>. You can simply write <code>x</code> once, and it will be converted to<code>x: x</code> (or something equivalent) under the hood.
Here is the same function from above rewritten to use this new syntax:
<blockquote>const getMousePosition = (x, y) => ({ x, y });</blockquote>
</section>`;
    const expected = `
## Description
<section id='description'>
ES6 adds some nice support for easily defining object literals.
Consider the following code:
<blockquote>const getMousePosition = (x, y) => ({<br>&nbsp;&nbsp;x: x,<br>&nbsp;&nbsp;y: y<br>});</blockquote>
<code>getMousePosition</code> is a simple function that returns an object containing two fields.
ES6 provides the syntactic sugar to eliminate the redundancy of having to write <code>x: x</code>. You can simply write <code>x</code> once, and it will be converted to<code>x: x</code> (or something equivalent) under the hood.
Here is the same function from above rewritten to use this new syntax:
<blockquote>const getMousePosition = (x, y) => ({ x, y });</blockquote>
</section>`;
    /* eslint-enable max-len */
    const res = const2let(t);
    assert.equal(res, expected,
      'Failed to preserve const when reassignment is also a definition');
  });
  it('should preserve const for fat arrow parameter (e.g. socket => // ...)',
    () => {
    const t = `
    const a = 1;
    const b = a => {
      doSomething();
    }`;
    const expected = `
    const a = 1;
    const b = a => {
      doSomething();
    }`;
    const res = const2let(t);
    assert.equal(res, expected,
      'Failed to catch fat arrow parameter masquerading as assignment');
  });
  it('should preserve const for future assignment with same suffix', () => {
    const t = `
      const f = 1;
      const af = 2;
    `;
    const expected = `
      const f = 1;
      const af = 2;
    `;
    const res = const2let(t);
    assert.equal(res, expected, 'Failed to catch var with same suffix');
  });
  it('should preserve const for object member assignment with same name',
    () => {
    const t = `
      const change = 5;
      const obj = {};
      obj.change = change;
    `;
    const expected = `
      const change = 5;
      const obj = {};
      obj.change = change;
    `;
    const res = const2let(t);
    assert.equal(
      res,
      expected,
      'Failed to catch object member assigment with same name');
  });
  it('should preserve const for react prop assignment', () => {
    const t = `
      const store = Redux.createStore(messageReducer);
      // ... then in render function
      return (
        <Provider store = {store} >
          <DisplayMessages />
        </Provider>
      );
    `;
    const expected = `
      const store = Redux.createStore(messageReducer);
      // ... then in render function
      return (
        <Provider store = {store} >
          <DisplayMessages />
        </Provider>
      );
    `;
    const res = const2let(t);
    assert.equal(res, expected, 'Failed to catch react prop assignment');
  });
  it('should respect blank lines', () => {
    const t = `
    <section>
    </section>
    `;
    const expected = `
    <section>
    </section>
    `;
    const res = const2let(t);
    assert.equal(res, expected, 'Failed to respect blank lines');
  });
  it('should respect scope', () => {
    const t = `
    {
      const a = 1;
      {
        const b = 2;
      }
    }
    {
      const c = 3;
      {
        c = 4;
      }
    }
    `;
    const expected = `
    {
      const a = 1;
      {
        const b = 2;
      }
    }
    {
      let c = 3;
      {
        c = 4;
      }
    }
    `;
    const res = const2let(t);
    assert.strictEqual(res, expected, 'Failed to respect scope');
  });
});

