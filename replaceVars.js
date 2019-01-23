/*
we transform the var declarations to const or let in order to simplify
catching the variable reassignents, which require a let declaration

1. for loops - easy, just change var to let
2. transform multiline declarations (separated with commas) giving each
    declaration it's own var line declaration
3. swap all remaining var's to const's
4. check through for const reassignement and change declaration to let
 */
/* eslint-disable no-console */
const fs = require('fs');
const { exec } = require('child_process');
const globby = require('globby');
require('dotenv').config();

const {
  const2let,
  fors,
  separateMultiLineVars,
  varconst
} = require('./replacers');

let filelist;
if (process.argv.length > 2) {
  filelist = Promise.resolve([process.argv[2]]);
} else if (process.env.FCC_BASE_DIR) {
  console.log('directory:',
    `${process.env.FCC_BASE_DIR}/curriculum/challenges/english/**/*.md`);
  filelist = globby([
    /* eslint-disable max-len */
    // `${process.env.FCC_BASE_DIR}/curriculum/challenges/english/02-javascript-algorithms-and-data-structures`,
    `${process.env.FCC_BASE_DIR}/curriculum/challenges/english/**/*.md`,
    `!${process.env.FCC_BASE_DIR}/curriculum/challenges/english/01-responsive-web-design`,
    `!${process.env.FCC_BASE_DIR}/curriculum/challenges/english/02-javascript-algorithms-and-data-structures/basic-javascript`,
    `!${process.env.FCC_BASE_DIR}/curriculum/challenges/english/02-javascript-algorithms-and-data-structures/es6`,
    /* eslint-enable max-len */
  ]);
}
if (filelist) {
  filelist.then(paths => {
    paths.forEach(filepath => {
      let str;
      console.log('processing:', filepath);
      try {
        str = fs.readFileSync(filepath, 'utf8');
      } catch (e) {
        console.error('file read failed [${filepath}]', e);
      }
      const res = const2let(varconst(separateMultiLineVars(fors(str))));
      try {
        if (res !== str) {
          const opfile = filepath.replace(/\.md/, '.out.md');
          const difile = filepath.replace(/\.md/, '.out.md.dif');
          console.log('out file:', opfile);
          fs.writeFileSync(opfile, res);
          exec( `diff ${filepath} ${opfile} > ${difile}`);
        }
      } catch (e) {
        console.error(`file write failed [${filepath}]`);
      }
    });
  })
  .catch(err => console.error(err));
} else {
  console.error('Failed to find files');
}

