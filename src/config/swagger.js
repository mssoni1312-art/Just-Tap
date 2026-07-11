const { buildAdminOpenApiSpec, buildManagerOpenApiSpec, buildClientOpenApiSpec, buildOpenApiSpec } = require('../docs');

module.exports = {
  adminSwaggerSpec: buildAdminOpenApiSpec(),
  managerSwaggerSpec: buildManagerOpenApiSpec(),
  clientSwaggerSpec: buildClientOpenApiSpec(),
  combinedSwaggerSpec: buildOpenApiSpec(),
};
