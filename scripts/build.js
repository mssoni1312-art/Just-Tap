#!/usr/bin/env node
/**
 * Production build preparation: ensure directories exist and generate OpenAPI spec.
 */
const fs = require('fs');
const path = require('path');

const dirs = [
  'uploads/images',
  'uploads/documents',
  'logs',
];

for (const dir of dirs) {
  const fullPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`Created ${dir}/`);
  }
}

require('./generate-openapi');
console.log('Build complete.');
