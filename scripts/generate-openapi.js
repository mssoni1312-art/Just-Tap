#!/usr/bin/env node
/**
 * Generates openapi.json from the programmatic OpenAPI spec.
 * Usage: npm run openapi:generate
 */
const fs = require('fs');
const path = require('path');
const buildOpenApiSpec = require('../src/docs');

const spec = buildOpenApiSpec();
const outPath = path.join(process.cwd(), 'openapi.json');

fs.writeFileSync(outPath, JSON.stringify(spec, null, 2), 'utf8');

const pathCount = Object.keys(spec.paths).length;
const schemaCount = Object.keys(spec.components.schemas).length;

console.log(`Generated ${outPath}`);
console.log(`  Paths: ${pathCount}`);
console.log(`  Schemas: ${schemaCount}`);
console.log(`  Swagger UI: http://localhost:3000/api/docs`);
console.log(`  OpenAPI JSON: http://localhost:3000/openapi.json`);
