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
    open = str.indexOf('{', open + close + 1);
  }
  return blocks;
};
exports.getBlocks = getBlocks;

