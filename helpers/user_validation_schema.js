const Joi = require("@hapi/joi");

const authValidationSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().min(2).required(),
});

module.exports = {
  authValidationSchema,
};
