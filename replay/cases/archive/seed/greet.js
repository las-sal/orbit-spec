#!/usr/bin/env node
// Prints a greeting: the name given as the first argument, or 'world' when no name is given.
const name = process.argv[2];
console.log(`Hello, ${name ? name : 'world'}!`);
