const printBlocks = (blocks, ndx) => {
  console.log('blocks:', blocks);
  if (Array.isArray(ndx)) {
    ndx.forEach(n => console.log('children:', blocks[n].children));
  } else {
    console.log('children:', blocks[ndx].children);
    console.log('vars:', blocks[ndx].vars);
  }
};
exports.printBlocks = printBlocks;

exports.getIndent = s => {
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

// reduce the blocks back to a string.
// hydrate block ids with child text
const reduceBlocks = fieldname => blocks => {
  return blocks.reduce((acc, block) => {
    const blockre = /<block(\d+)>/g;
    let matches = blockre.exec(block.part);
    let newpart = block.part;
    while(matches) {
      const childstr = reduceBlocks(fieldname)([block.children[matches[1]]]);
      newpart = newpart.replace(matches[0], childstr);
      matches = blockre.exec(block.part);
    }
    return acc.concat(newpart);
  }, '');
};
exports.reduceBlocks = reduceBlocks;

// replace duplicate parent text that's in child with blockid '<block#>'
const normaliseBlocks = blocks => {
  return blocks.map(block => {
    const newblock = { ...block, part: block.text };
    if (newblock.children) {
      newblock.children = newblock.children.map((child, i) => {
        const ab = normaliseBlocks([child])[0];
        newblock.part = newblock.part.replace(child.text, `<block${i}>`);
        return ab;
      });
    }
    return newblock;
  });
};
exports.normaliseBlocks = normaliseBlocks;

const getBlocks = str => {
  const blocks = [];
  let open = str.indexOf('{');
  let lastCloseNdx = str.length+1;
  if (open === -1) return [{ text: str, children: null }];
  // normally a block starts with open brace, but not for body text
  if (open > 0) {
    blocks.push({ text: str.substring(0, open), children:null });
  }
  while(open !== -1) {
    const newblock = { children: null };
    const curstr = str.substring(open);
    const close = findMatchingBrace(curstr);
    const text = curstr.substring(0, close + 1);
    newblock.text = text;
    const nestedOpen = text.indexOf('{', 1);
    if (nestedOpen > -1) {
      newblock.children = getBlocks(text.substring(nestedOpen));
    }
    blocks.push(newblock);
    lastCloseNdx = open + close;
    open = str.indexOf('{', open + close + 1);
    if (open - lastCloseNdx > 1) {
      blocks.push({ text: str.substring(lastCloseNdx + 1, open), children: null });
    }
  }
  if (lastCloseNdx < str.length) {
    let endndx = str.indexOf('}', lastCloseNdx + 1);
    if (endndx === -1) endndx = str.length;
    const text = str.substring(lastCloseNdx + 1, endndx);
    if (text.length) blocks.push({ text, children: null });
  }
  return blocks;
};
exports.getBlocks = getBlocks;

