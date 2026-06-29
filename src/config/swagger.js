const buildOpenApiSpec = require('../docs');

const swaggerSpec = buildOpenApiSpec();

module.exports = swaggerSpec;
