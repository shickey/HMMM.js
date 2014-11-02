#! /bin/bash
git co master
if [ "$?" = "0" ]; then
  browserify assembler.js -o $TMPDIR/hmmm-assembler.js -s HmmmAssembler
  browserify simulator.js -o $TMPDIR/hmmm-simulator.js -s HmmmSimulator
  git co gh-pages
fi