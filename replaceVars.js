/*
we transform the var declarations to const or let in order to simplify
catching the variable reassignents, which require a let declaration

1. for loops - easy, just change var to let
2. transform multiline declarations (separated with commas) giving each
    declaration it's own var line declaration
3. check through and find the vars
4. set the var to const, or let if re/assigned
 */
/* eslint-disable no-console */
const fs = require('fs');
const { exec } = require('child_process');
const globby = require('globby');
require('dotenv').config();

const {
  fors,
  separateMultilineVars,
  vars2constlet,
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
    `!${process.env.FCC_BASE_DIR}/curriculum/challenges/english/06-information-security-and-quality-assurance`,
    `!${process.env.FCC_BASE_DIR}/curriculum/challenges/english/05-apis-and-microservices`,
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
      const res = vars2constlet(separateMultilineVars(fors(str)));
      try {
        if (res !== str) {
          const opfile = filepath.replace(/\.md/, '.out');
          const difile = filepath.replace(/\.md/, '.dif');
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

