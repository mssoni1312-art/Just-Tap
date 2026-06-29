const { sendError } = require('../helpers/response');

const validate = (schema, property = 'body') => (req, res, next) => {
  const { error, value } = schema.validate(req[property], {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errors = error.details.map((d) => d.message);
    return sendError(res, 'Validation failed', errors, 422);
  }

  req[property] = value;
  next();
};

module.exports = validate;
