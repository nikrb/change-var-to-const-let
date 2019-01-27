const { getIndent, findMatchingBrace, getBlocks, normaliseBlocks, reduceBlocks } = require('./block');
// const { printBlocks } = require('./block');

const forre = /(for\s*\()\s*\bvar\b\s+([a-zA-Z0-9]+)/g;
exports.fors = str => {
  return str.replace(forre, '$1let $2');
};

const varre = /var\s+(\w+)\s*([=;])/g;
const findVars = blocks => {
  return blocks.map(block => {
    if (block.children) block.children = findVars(block.children);
    block.vars = [];
    let matches = varre.exec(block.text);
    while(matches !== null) {
      block.vars.push({ name: matches[1], dec: matches[2] === ';', reassigned: false, ndx: matches.index });
      matches = varre.exec(block.text);
    }
    return block;
  });
};
const findReassignment = blocks => {
  return blocks.map((block, i) => {
    if (block.children) findReassignment(block.children);
    let supertext;
    if (block.part.startsWith('{')) {
      supertext = reduceBlocks('part')([block]);
    } else {
      supertext = reduceBlocks('part')(blocks);
    }
    block.vars.forEach(v => {
      // inc/dec operators
      const varincdecre = new RegExp(
        `(\\\+\\\+${v.name})|(--${v.name})|` +
        `(${v.name}--)|(${v.name}\\\+\\\+)`
      );
      const incdecass = supertext.match(varincdecre);
      if (incdecass !== null) {
        if (incdecass.length) {
          v.reassigned = true;
        }
      } else {
        const varassre = new RegExp(
          '(var\\b|for\\s*\\()?\\s*\\b(\\.)?' + v.name +
          '\\s*[+\\-\\/*\\^\\%]?=\\s*[\\\'"\\[]?\\s*[!\\-\\w]+', 'g');
        const varassresult = supertext.match(varassre);
        let reass;
        if (varassresult) {
          // not resassignment if it's a redefinition, redeclaration or object
          // member assignment
          reass = varassresult.filter(
            s => s.indexOf('var') === -1 &&
                s.indexOf('let') === -1 &&
                s.indexOf('const') === -1 &&
                s.indexOf('.') === -1 &&
                s.indexOf('for') === -1
          );
        }
        if (reass && reass.length) {
          v.reassigned = true;
        }
      }
      block.part = block.part.replace(/var\b/, v.reassigned ? 'let' : 'const');
    });
    return block;
  });
};

exports.vars2constlet = str => {
  const sections = str.split('</section>');
  return sections.reduce((acc, section) => {
    const closingSection = section.includes('<section') ? '</section>' : '';
    const blocks = getBlocks(section);
    const normalised = normaliseBlocks(blocks);
    const varblocks = findVars(normalised);
    const processed = findReassignment(varblocks);
    return acc.concat(reduceBlocks('part')(processed), closingSection);
  }, '');
};

const splitVarDecs = str => {
  const bits = [];
  let count = 0;
  let i = 0;
  let lastNdx = 0;
  while(i < str.length) {
    if (str[i] === '[' || str[i] === '(') count++;
    if (str[i] === ']' || str[i] === ')') count--;
    if (str[i] === ',' && count === 0) {
      bits.push(str.substring(lastNdx, i));
      lastNdx = i + 1;
      i += 1;
    }
    i += 1;
  }
  bits.push(str.substring(lastNdx));
  return bits;
};
exports.splitVarDecs = splitVarDecs;

const separateMultilineVarsRE = /\s*var\s+[\s\w=,.'"()\[\]*\-+\/]+;/g;
exports.separateMultilineVars = str => {
  return str.replace(separateMultilineVarsRE, match => {
    const indent = getIndent(match);
    const bits = splitVarDecs(match);
    if (bits.length > 1) {
      const separateLines = bits.reduce((acc, cur, ndx, arr) => {
        const c = cur.trim();
        // last line will already have semicolon
        let ret = acc.concat(`\n${indent}var ${c}`);
        if (ndx === 0) {
          // first line will have var
          ret = acc.concat(`\n${indent}${c};`);
        } else if (ndx < arr.length - 1) {
          ret = acc.concat(`\n${indent}var ${c};`);
        }
        return ret;
      }, '');
      return separateLines;
    }
    return match;
  });
};
