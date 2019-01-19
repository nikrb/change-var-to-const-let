function getIndent(s) {
  const count = s.search(/\w/);
  if (count < 1) { return ''; }
  return ' '.repeat(count - 1);
}

const findMatchingBrace = str => {
  let count = 0;
  let ndx = 0;
  while(ndx < str.length) {
    if (str[ndx] === '{') count++;
    if (str[ndx] === '}') {
      count--;
      if (count === 0) break;
    }
    ndx += 1;
  }
  return ndx;
};
exports.findMatchingBrace = findMatchingBrace;

const getBlocks = str => {
  const blocks = [];
  let open = str.indexOf('{');
  if (open === -1) return [str];
  while(open !== -1) {
    const curstr = str.substring(open);
    const close = findMatchingBrace(curstr);
    const block = curstr.substring(0, close + 1);
    blocks.push(block);
    const nestedOpen = block.indexOf('{', 1);
    if (nestedOpen > -1) {
      blocks.push(...getBlocks(block.substring(1)));
    }
    open = str.indexOf('{', open + close + 1);
  }
  return blocks;
};
exports.getBlocks = getBlocks;

const forre = /(for\s*\()\s*\bvar\b\s+([a-zA-Z0-9]+)/g;
exports.fors = str => {
  return str.replace(forre, '$1let $2');
};

const varre = /var\s+(\w+)/g;
exports.varconst = str => {
  return str.replace(varre, 'const $1');
};

const constre = /const\s+(\w+)\s*([=;])/g;
exports.const2let = str => {
  const sections = str.split('</section>');
  return sections.reduce((acc, cur) => {
    const closingSection = cur.includes('<section') ? '</section>' : '';
    return acc.concat(
      cur.replace(constre, (match, varname, postVar) => {
        const isDefinition = postVar === '=';
        // template string fubar's editor
        const varassre = new RegExp(
          '(const|for\\s*\\()?\\s*\\b\(\\.)?' + varname +
          '\\s*[+\\-\\/*\\^\\%]?=\\s*[\\\'"\\[]?\\s*[\\w]+', 'g');
        // use let if we have a reassignment
        const varassresult = cur.match(varassre);
        let reass = null;
        if (varassresult) {
          // not resassignment if it's a redefition, redeclaration or object
          // member assignment
          reass = varassresult.filter(
            s =>
              s.indexOf('const') === -1 &&
              s.indexOf('.') === -1 &&
              s.indexOf('for') === -1
          );
        }
        // and inc/dec operators
        const varincdecre = new RegExp(
          `(\\\+\\\+${varname})|(--${varname})|` +
          `(${varname}--)|(${varname}\\\+\\\+)`
        );
        const incdecass = cur.match(varincdecre);
        if (incdecass !== null) {
          if (incdecass.length) {
            return `let ${varname}${isDefinition ? ' =' : ';'}`;
          }
        } else if (reass !== null) {
          if (reass.length) {
            return `let ${varname}${isDefinition ? ' =' : ';'}`;
          }
        }
        return match;
      }), closingSection);
  }, '');
};

const separateMultilineVarsRE = /\s*var\s+[\s\w=,.'"()\[\]]+;/g;
exports.separateMultiLineVars = str => {
  return str.replace(separateMultilineVarsRE, match => {
    const indent = getIndent(match);
    const bits = match.split(',');
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
