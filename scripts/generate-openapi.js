#!/usr/bin/env node
/**
 * Generates openapi.json from the programmatic OpenAPI spec.
 * Usage: npm run openapi:generate
 */
const fs = require('fs');
const path = require('path');
const { buildOpenApiSpec, buildAdminOpenApiSpec, buildManagerOpenApiSpec } = require('../src/docs');

const spec = buildOpenApiSpec();
const adminSpec = buildAdminOpenApiSpec();
const managerSpec = buildManagerOpenApiSpec();
const outPath = path.join(process.cwd(), 'openapi.json');
const adminOutPath = path.join(process.cwd(), 'openapi-admin.json');
const managerOutPath = path.join(process.cwd(), 'openapi-manager.json');

fs.writeFileSync(outPath, JSON.stringify(spec, null, 2), 'utf8');
fs.writeFileSync(adminOutPath, JSON.stringify(adminSpec, null, 2), 'utf8');
fs.writeFileSync(managerOutPath, JSON.stringify(managerSpec, null, 2), 'utf8');

const pathCount = Object.keys(spec.paths).length;
const schemaCount = Object.keys(spec.components.schemas).length;

console.log(`Generated ${outPath}`);
console.log(`Generated ${adminOutPath}`);
console.log(`Generated ${managerOutPath}`);
console.log(`  Paths: ${pathCount}`);
console.log(`  Schemas: ${schemaCount}`);
console.log(`  Admin Swagger UI: http://localhost:3000/api/docs`);
console.log(`  Manager Swagger UI: http://localhost:3000/api/manager/docs`);
console.log(`  OpenAPI JSON: http://localhost:3000/openapi.json`);
