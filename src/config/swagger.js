const { buildAdminOpenApiSpec, buildManagerOpenApiSpec, buildOpenApiSpec } = require('../docs');

module.exports = {
  adminSwaggerSpec: buildAdminOpenApiSpec(),
  managerSwaggerSpec: buildManagerOpenApiSpec(),
  combinedSwaggerSpec: buildOpenApiSpec(),
};
