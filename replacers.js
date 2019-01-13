function getIndent(s) {
  const count = s.search(/\w/);
  if (count < 1) { return ''; }
  return ' '.repeat(count - 1);
}

const forre = /(for\s*\()\s*\bvar\b\s+([a-zA-Z0-9]+)/g;
exports.fors = str => {
  return str.replace(forre, '$1let $2');
};

const varre = /var\s+(\w+)/g;
exports.varconst = str => {
  return str.replace(varre, 'const $1');
};

const constre = /const\s+(\w+)\s*=/g;
exports.const2let = str => {
  const sections = str.split('</section>');
  return sections.reduce((acc, cur) => {
    const closingSection = cur.includes('<section') ? '</section>' : '';
    return acc.concat(
      cur.replace(constre, match => {
        const varname = match.split(' ')[1];
        // template string fubar's editor
        const varass = new RegExp(
          '(const)?\\s*' + varname + '\\s*[+\\-\\/*]?=\\s*[\\\'"\\[]?\\s*[\\w]+', 'g');
        // use let if we have a reassignment
        const reass = cur.match(varass);
        // and inc/dec operators
        const varincdec = new RegExp(`(\\\+\\\+${varname})|(--${varname})|(${varname}--)|(${varname}\\\+\\\+)`);
        const incdecass = cur.match(varincdec);
        if (incdecass !== null) {
          if (incdecass.length) {
            return `let ${varname} =`;
          }
        } else if (reass !== null) {
          const constcount = reass.reduce(
            (a, c) => a + c.includes('const'), 0);
          if (reass.length > 1 && constcount < 2 ) {
            return `let ${varname} =`;
          }
        }
        return match;
      }), closingSection);
  }, '');
};

const separateMultilineVarsRE = /\s*var\s+[\s\w=,.]+;/g;
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
