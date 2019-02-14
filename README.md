script to change var to const/let in fcc md files

# prerequisites

if you can run FCC locally you should be good to go

# installation

1. clone repo
2. npm install
3. cp sample.env .env
4. update .env to point FCC_BASE_DIR to your local copy

# tests

to run the tests for the conversion script `npm run test:all`

# running the script

First cd to your local FCC and create a new branch.
Then cd back to this local repo and `npm start`.

This will create `.out` and `.dif` files in the `curriculum/challenges/english` directory structure for all files that are to be updated.

Check through the dif files to ensure nothing untoward occurred.

1. `find /curriculum/challenges/english -name '*.dif' > changelist.txt`
2. ```vi `cat changelist.txt` ```
3. View each dif file and make sure vars are changed to const, or let if reassigned

replace md files with .out files

`find curriculum/challenges/english/ -name '*.out' | rename -f 's/(.*).out/$1.md/'`

Then go through each of the changed files testing client app and curriculum test. There are currently 5 files which the converter fails on and a dozen or so files that require attention due to seed/solution issues. These are detailed in the `outlist.txt` file.


Finally commit the changes to the FCC repo and push.

# directories skipped
1. no js
    > `curriculum/challenges/english/01-responsive-web-design`
2. var dec/defs are required
    > `curriculum/challenges/english/02-javascript-algorithms-and-data-structures/basic-javascript`
    > `curriculum/challenges/english/02-javascript-algorithms-and-data-structures/es6`
4. external projects
    > `curriculum/challenges/english/06-information-security-and-quality-assurance`
    > `curriculum/challenges/english/05-apis-and-microservices`

# oopsies!
should you need to restart, remove the generated files from the FCC repo: `git clean -f > out`. Don't forget the redirect or terminal will flood with deleted files!

