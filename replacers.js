const { getIndent, findMatchingBrace, getBlocks, normaliseBlocks, reduceBlocks } = require('./block');

const forre = /(for\s*\()\s*\bvar\b\s+([a-zA-Z0-9]+)/g;
exports.fors = str => {
  return str.replace(forre, '$1let $2');
};

/* think we're binning this
const varre = /var\s+(\w+)/g;
exports.varconst = str => {
  return str.replace(varre, 'const $1');
};
*/

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
  return blocks.map(block => {
    if (block.children) findReassignment(block.children);
    const supertext = reduceBlocks('part')(blocks);
    block.vars.forEach(v => {
      // and inc/dec operators
      const varincdecre = new RegExp(
        `(\\\+\\\+${v.name})|(--${v.name})|` +
        `(${v.name}--)|(${v.name}\\\+\\\+)`
      );
      const incdecass = supertext.match(varincdecre);
      if (incdecass !== null) {
        if (incdecass.length) {
          v.reassigned = true;
          // return `let ${varname}${isDefinition ? ' =' : ';'}`;
        }
      } else {
        const varassre = new RegExp(
          '(var|for\\s*\\()?\\s*\\b\(\\.)?' + v.name +
          '\\s*[+\\-\\/*\\^\\%]?=\\s*[\\\'"\\[]?\\s*[\\w]+', 'g');
        const varassresult = supertext.match(varassre);
        let reass;
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
        if (reass && reass.length) {
          v.reassigned = true;
          // return `let ${varname}${isDefinition ? ' =' : ';'}`;
        }
      }
      block.part = block.part.replace('var', v.reassigned ? 'let' : 'const');
    });
    return block;
  });
};

exports.vars2constlet = str => {
  const sections = str.split('</section>');
  return sections.reduce((acc, section) => {
    const closingSection = section.includes('<section') ? '</section>' : '';
    const blocks = normaliseBlocks(getBlocks(section));
    const varblocks = findVars(blocks);
    const processed = findReassignment(varblocks);
    return reduceBlocks('part')(processed);
  }, '');
};
/*
exports.oldconst2let = str => {
  const sections = str.split('</section>');
  return sections.reduce((acc, section) => {
    const closingSection = cur.includes('<section') ? '</section>' : '';
    const blocks = normalise(getBlocks(section));
    const withvars = findVarnames(blocks);
    // foreach block
    //  find varnames in block text
    //  search tree for varname assignments
    //  fix up block text var declarator
    return acc.concat(replacer(section, constre), closingSection);
  }, '');
};
const replacer = (cur, constre) => {
  return cur.replace(constre, (match, varname, postVar) => {
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
  });
};
*/

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
