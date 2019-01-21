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
    if (block.children) {
      const str = block.children.reduce((acc2, b, i) => {
        let childstr = b[fieldname];
        if (b.children) childstr = reduceBlocks(fieldname)(b.children);
        const blockid = `<block${i}>`;
        return acc2.replace(blockid, b[fieldname]);
      }, block.part);
      return acc.concat(str);
    }
    return acc.concat(block[fieldname]);
  }, '');
};
exports.reduceBlocks = reduceBlocks;

// replace duplicate parent text that's in child with blockid '<block#>'
const normaliseBlocks = blocks => {
  return blocks.map(block => {
    const newblock = { ...block };
    if (newblock.children) {
      newblock.part = newblock.text;
      newblock.children.forEach((child, i) => {
        if (child.children) normaliseBlocks(child.children);
        newblock.part = newblock.part.replace(child.text, `<block${i}>`);
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

