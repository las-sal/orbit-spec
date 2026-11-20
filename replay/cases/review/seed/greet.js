#!/usr/bin/env node
// Prints a greeting: the name given as the first argument, or the world.
const name = process.argv[2];
console.log(`Hello, ${name ? name : 'world'}!`);
