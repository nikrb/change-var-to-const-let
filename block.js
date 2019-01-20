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

const normaliseBlocks = blocks => {
  return blocks.map(block => {
    if (block.children) {
      block.children.forEach((child, i) => {
        if (child.children) normaliseBlock(child.children);
        block.text = block.text.replace(child.text, `<block${i}>`);
      });
    }
    return block;
  });
};
exports.normaliseBlocks = normaliseBlocks;

const getBlocks = str => {
  const blocks = [];
  let open = str.indexOf('{');
  if (open === -1) return [{ text: str, children: null }];
  while(open !== -1) {
    const newblock = { children: null };
    const curstr = str.substring(open);
    const close = findMatchingBrace(curstr);
    const block = curstr.substring(0, close + 1);
    newblock.text = block;
    const nestedOpen = block.indexOf('{', 1);
    if (nestedOpen > -1) {
      newblock.children = getBlocks(block.substring(1));
    }
    blocks.push(newblock);
    open = str.indexOf('{', open + close + 1);
  }
  return blocks;
};
exports.getBlocks = getBlocks;

