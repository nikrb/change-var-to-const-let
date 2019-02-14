/* eslint-disable max-len, quotes */
const assert = require('assert');
const {
  splitVarDecs,
  vars2constlet,
  fors,
  separateMultilineVars,
} = require('./replacers');

describe('for loop transform', () => {
  it('should replace vars in for loops', () => {
    const t = `for (var i = 0; i < ourArr.length; i++) {
        ourTotal += ourArr[i];
      }`;
    const expected = `for (let i = 0; i < ourArr.length; i++) {
        ourTotal += ourArr[i];
      }`;
    const res = fors(t);
    assert.strictEqual(res, expected, 'Failed to replace var in for loops');
  });
  it('should preserve indent', () => {
    const t = `
    var a = 1;
    if (something) {
      for(var i =0; i<5; i++) {
        doSomethingElse();
      }
    }
    `;
    const expected = `
    var a = 1;
    if (something) {
      for(let i =0; i<5; i++) {
        doSomethingElse();
      }
    }
    `;
    const res = fors(t);
    assert.strictEqual(res, expected, 'Failed to preserve indent');
  });
});

describe('ignoring var in words', () => {
  it('should ignore var as part of a word', () => {
    const t = `<hr>Start by adding a variable to keep track of the users just before where you are currently listening for connections.     <code>var currentUsers = 0;</code>`;
    const expected = `<hr>Start by adding a variable to keep track of the users just before where you are currently listening for connections.     <code>const currentUsers = 0;</code>`;
    const res = vars2constlet(t);
    assert.strictEqual(res, expected, 'Failed to catch var in words');
  });
});

describe('split var decs', () => {
  it('should split var decs', () => {
    const t = `var a = [], b = [];`;
    const expected = ['var a = []', ' b = [];'];
    const res = splitVarDecs(t);
    assert.deepStrictEqual(res, expected, 'Failed to split var decs');
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
    const res = separateMultilineVars(t);
    assert.strictEqual(res, expected, 'Failed to separate multiline defs');
  });
  it('should handle no semi-colons', () => {
    const t = `
    var a, o
    a = 1;
    o = 2;
    `;
    const expected = `
    var a;
    var o
    a = 1;
    o = 2;
    `;
    const res = separateMultilineVars(t);
    assert.strictEqual(res, expected, 'Failed to handle no semi-colons');
  });
  it('should not transform for loops', () => {
    const t = `for (var i = 0; i<arr.lenth; i++){
      doSomething();
    }`;
    const expected = `for (var i = 0; i<arr.lenth; i++){
      doSomething();
    }`;
    const res = separateMultilineVars(t);
    assert.strictEqual(res, expected, 'Failed to NOT transform for loop');
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
    const res = separateMultilineVars(t);
    assert.strictEqual(res, expected,
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
    const res = separateMultilineVars(t);
    assert.strictEqual(
      res,
      expected,
      'Failed to handle mixed declarations and definitions'
    );
  });
  it('should not split function call initialisers', () => {
    const t = `var hash = bcrypt.hashSync(req.body.password, 12);`;
    const expected = `var hash = bcrypt.hashSync(req.body.password, 12);`;
    const res = separateMultilineVars(t);
    assert.strictEqual(res, expected, 'Failed to handle function call initialiser');
  });
});
describe('change var to let if variable reassigned', () => {
  it('should handle declarations and reassignment', () => {
    const t = `
      var a;
      var b = 1;
      var b2 = 2;
      var c=3;
      var c2=4;
      a = 1;
      b2 = 5;
      c2 = 6;
    `;
    const expected = `
      let a;
      const b = 1;
      let b2 = 2;
      const c=3;
      let c2=4;
      a = 1;
      b2 = 5;
      c2 = 6;
    `;
    const res = vars2constlet(t);
    assert.strictEqual(
      res,
      expected,
      'Failed to handle declaration and reassignment'
    );
  });
  it('should recognise shorthand assignment operators', () => {
    const t = `
      var a = 1;
      var b = 2;
      var c;
      var d = 4;
      var e = 5;
      var f = 5.5;
      var html = "";
      a += 6;
      html += "<div/>";
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
      let html = "";
      a += 6;
      html += "<div/>";
      b -= 7;
      c *= 8;
      d /= 9;
      e ^= 10;
      f %= 11;
    `;
    const res = vars2constlet(t);
    assert.strictEqual(
      res,
      expected,
      'Failed to recognise shorthand assignment operators'
    );
  });
  it('should recognise increment/decrement operators as assignment', () => {
    const t = `
    var a = 1;
    var b = 2;
    var c = 3;
    var d = 4;
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
    const res = vars2constlet(t);
    assert.strictEqual(
      res,
      expected,
      'Failed to recognise increment/decrement operators'
    );
  });
  it('should allow spaces between variable and increment operator', () => {
    const t = `var i = 0;
    i ++`;
    const expected = `let i = 0;
    i ++`;
    const res = vars2constlet(t);
    assert.strictEqual(res, expected, 'Failed to allow space between var and inc operator');
  });
  it('should recognise array destructure reassignment', () => {
    const t = `
    var a = 1;
    var b = 2;
    var c = 3;
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
    const res = vars2constlet(t);
    assert.strictEqual(
      res,
      expected,
      'Failed to recognise array destructure reassignment'
    );
  });
  it('should allow separate declaration of for loop iterator', () => {
    const t = `
      var i;
      var ch;
      var chars = input.split(' ');
      var chars2 = input.split(" ");
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
    const res = vars2constlet(t);
    assert.strictEqual(
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
    var ourArr = [ 9, 10, 11, 12];
    var ourTotal = 0;
  </div>
</section>

<section id='solution'>
  var ourArr = [ 9, 10, 11, 12];
  var ourTotal = 0;

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
    const res = vars2constlet(t);
    assert.strictEqual(
      res,
      expected,
      'Failed to respect sections for reassignment'
    );
  });
  it('should preserve const if reassignment is also a definition', () => {
    const t = `
## Description
<section id='description'>
ES6 adds some nice support for easily defining object literals.
Consider the following code:
<blockquote>var getMousePosition = (x, y) => ({<br>&nbsp;&nbsp;x: x,<br>&nbsp;&nbsp;y: y<br>});</blockquote>
<code>getMousePosition</code> is a simple function that returns an object containing two fields.
ES6 provides the syntactic sugar to eliminate the redundancy of having to write <code>x: x</code>. You can simply write <code>x</code> once, and it will be converted to<code>x: x</code> (or something equivalent) under the hood.
Here is the same function from above rewritten to use this new syntax:
<blockquote>var getMousePosition = (x, y) => ({ x, y });</blockquote>
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
    const res = vars2constlet(t);
    assert.strictEqual(res, expected,
      'Failed to preserve const when reassignment is also a definition');
  });
  it('should preserve const for fat arrow parameter (e.g. socket => // ...)',
    () => {
    const t = `
    var a = 1;
    var b = a => {
      doSomething();
    }`;
    const expected = `
    const a = 1;
    const b = a => {
      doSomething();
    }`;
    const res = vars2constlet(t);
    assert.strictEqual(res, expected,
      'Failed to catch fat arrow parameter masquerading as assignment');
  });
  it('should preserve const for future assignment with same suffix', () => {
    const t = `
      var f = 1;
      var af = 2;
    `;
    const expected = `
      const f = 1;
      const af = 2;
    `;
    const res = vars2constlet(t);
    assert.strictEqual(res, expected, 'Failed to catch var with same suffix');
  });
  it('should preserve const for object member assignment with same name',
    () => {
    const t = `
      var change = 5;
      var obj = {};
      obj.change = change;
    `;
    const expected = `
      const change = 5;
      const obj = {};
      obj.change = change;
    `;
    const res = vars2constlet(t);
    assert.strictEqual(
      res,
      expected,
      'Failed to catch object member assigment with same name');
  });
  it('should preserve const for react prop assignment', () => {
    const t = `
      var store = Redux.createStore(messageReducer);
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
    const res = vars2constlet(t);
    assert.strictEqual(res, expected, 'Failed to catch react prop assignment');
  });
  // this covers html closing > caught from <block#> - which is now bl#ck
  it('should preserve react key prop', () => {
    const t = `<ul>
  {this.state.messages.map( (message, idx) => {
      return (
         <li key={idx}>{message}</li>
      )
    })
  }
</ul>`;
    const expected = `<ul>
  {this.state.messages.map( (message, idx) => {
      return (
         <li key={idx}>{message}</li>
      )
    })
  }
</ul>`;
    const res = vars2constlet(t);
    assert.strictEqual(res, expected, 'Failed to preserve react prop key');
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
    const res = vars2constlet(t);
    assert.strictEqual(res, expected, 'Failed to respect blank lines');
  });
  it('should respect scope', () => {
    const t = `
    function test() {
      var a = 1;
    }
    function test2() {
      var a = 2;
      a = 3;
    }
    `;
    const expected = `
    function test() {
      const a = 1;
    }
    function test2() {
      let a = 2;
      a = 3;
    }
    `;
    const res = vars2constlet(t);
    assert.strictEqual(res, expected, 'Failed to respect scope');
  });
  it('should respect scope live test', () => {
    const t = `function pandigitalProducts() {
      function is1to9Pandigital(...numbers) {
        var digitStr = concatenateNums(...numbers);
        // check if length is 9
        if (digitStr.length !== 9) {
          return false;
        }
        // check if pandigital
        for (let i = digitStr.length; i > 0; i--) {
          if (digitStr.indexOf(i.toString()) === -1) {
            return false;
          }
        }
        return true;
      }
      function concatenateNums(...numbers) {
        let digitStr = '';
        for (let i = 0; i < numbers.length; i++) {
          digitStr += numbers[i].toString();
        }
        return digitStr;
      }

      var pandigitalNums = [];
      let sum = 0;
      for (let mult1 = 2; mult1 < 9876; mult1++) {
        let mult2 = 123;
        while (concatenateNums(mult1, mult2, mult1 * mult2).length < 10) {
          if (is1to9Pandigital(mult1, mult2, mult1 * mult2) && !pandigitalNums.includes(mult1 * mult2)) {
            pandigitalNums.push(mult1 * mult2);
            sum += mult1 * mult2;
          }
          mult2++;
        }
      }
      return sum;
    }`;
    const expected = `function pandigitalProducts() {
      function is1to9Pandigital(...numbers) {
        const digitStr = concatenateNums(...numbers);
        // check if length is 9
        if (digitStr.length !== 9) {
          return false;
        }
        // check if pandigital
        for (let i = digitStr.length; i > 0; i--) {
          if (digitStr.indexOf(i.toString()) === -1) {
            return false;
          }
        }
        return true;
      }
      function concatenateNums(...numbers) {
        let digitStr = '';
        for (let i = 0; i < numbers.length; i++) {
          digitStr += numbers[i].toString();
        }
        return digitStr;
      }

      const pandigitalNums = [];
      let sum = 0;
      for (let mult1 = 2; mult1 < 9876; mult1++) {
        let mult2 = 123;
        while (concatenateNums(mult1, mult2, mult1 * mult2).length < 10) {
          if (is1to9Pandigital(mult1, mult2, mult1 * mult2) && !pandigitalNums.includes(mult1 * mult2)) {
            pandigitalNums.push(mult1 * mult2);
            sum += mult1 * mult2;
          }
          mult2++;
        }
      }
      return sum;
    }`;
    const res = vars2constlet(t);
    assert.strictEqual(res, expected, 'Failed to respect scope live test');
  });
  it('should handle logical not operator in assignment', () => {
    const t = `var a = true;
    a = !b`;
    const expected = `let a = true;
    a = !b`;
    const res = vars2constlet(t);
    assert.strictEqual(res, expected, 'Failed to handle logical not operator in assignment');
  });
  it('should handle unary plus in assignment', () => {
    const t = `var a = 1;
    a = +b;`;
    const expected = `let a = 1;
    a = +b;`;
    const res = vars2constlet(t);
    assert.strictEqual(res, expected, 'Failed to handle unary plus in assignment');
  });
});

describe('convert var to const or let', () => {
  it('should convert var to let when reassigned', () => {
    const t = `
      var a = 1;
      a = 2;
    `;
    const expected = `
      let a = 1;
      a = 2;
    `;
    const res = vars2constlet(t);
    assert.strictEqual(res, expected, 'Failed to convert var to let for reassigned var');
  });
  it('should convert var to let when reassigned in sibling block', () => {
    const t = `
      var a = 1;
      function() {
        a = 2;
      }
    `;
    const expected = `
      let a = 1;
      function() {
        a = 2;
      }
    `;
    const res = vars2constlet(t);
    assert.strictEqual(res, expected, 'Failed to convert var to let for sibling block');
  });
  it('should convert var to let when reassigned in child block', () => {
    const t = `
      function() {
        var a = 1;
        var b;
        for (var i = 1; i < 5; i++) {
          a++;
        }
      }
    `;
    const expected = `
      function() {
        let a = 1;
        const b;
        for (let i = 1; i < 5; i++) {
          a++;
        }
      }
    `;
    const res = vars2constlet(t);
    assert.strictEqual(res, expected, 'Failed to convert var to let reassigned in child block');
  });
  it('should convert var to const for function call and array initialisers', () => {
    const t = `var hash = bcrypt.hashSync(req.body.password, 12);
      var hash2 = [[1,2], [3,4]]`;
    const expected = `const hash = bcrypt.hashSync(req.body.password, 12);
      const hash2 = [[1,2], [3,4]]`;
    const res = vars2constlet(t);
    assert.strictEqual(res, expected, 'Failed to handle function call initialiser');
  });
});

describe('special character handling', () => {
  it('should handle dollar character', () => {
    const t = `
    function formatText (input, justification) {
      let x, y, max, cols = 0, diff, left, right;
      for (x = 0; x < input.length; x++) {
        input[x] = input[x].split('$');
        if (input[x].length > cols) {
          cols = input[x].length;
        }
      }
    }`;
    const res = vars2constlet(t);
    assert.equal(res, t, 'Failed latest etst');
  });
});

describe('multiline defs with maths operators', () => {
  it('should handle maths operator initialisers', () => {
    const t = `function spiralArray (n) {
      var arr = Array(n),
          x = 0, y = n,
          total = n * n--,
          dx = 1, dy = 0,
          i = 0, j = 0;
      while (y) arr[--y] = [];
      while (i < total) {
          arr[y][x] = i++;
          x += dx; y += dy;
          if (++j == n) {
              if (dy < 0) {x++; y++; n -= 2}
              j = dx; dx = -dy; dy = j; j = 0;
         }
      }
      return arr;
    }`;
    const expected = `function spiralArray (n) {
      const arr = Array(n);
      let x = 0;
      let y = n;
      const total = n * n--;
      let dx = 1;
      let dy = 0;
      let i = 0;
      let j = 0;
      while (y) arr[--y] = [];
      while (i < total) {
          arr[y][x] = i++;
          x += dx; y += dy;
          if (++j == n) {
              if (dy < 0) {x++; y++; n -= 2}
              j = dx; dx = -dy; dy = j; j = 0;
         }
      }
      return arr;
    }`;
    const res = vars2constlet(separateMultilineVars(t));
    assert.strictEqual(res, expected, 'Failed to handle maths operators in initialisers');
  });
  // skip this test until a fix can be implemented
  xit('should handle non var commas', () => {
    const t = `var finalTabs = socialWindow
                    .tabOpen() // Open a new tab for cat memes
                    .join(videoWindow.tabClose(2)) // Close third tab in video window, and join
                    .join(workWindow.tabClose(1).tabOpen());`;    
    const expected = `var finalTabs = socialWindow
                    .tabOpen() // Open a new tab for cat memes
                    .join(videoWindow.tabClose(2)) // Close third tab in video window, and join
                    .join(workWindow.tabClose(1).tabOpen());`;    
    const res = separateMultilineVars(t);
    assert.strictEqual(res, expected, 'Failed to handle non var commas');
  });
});

