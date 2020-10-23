const createError = require("http-errors");
const User = require("../models/User.model");
const { authValidationSchema } = require("../helpers/user_validation_schema");

const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../helpers/jwt_helper");

const client = require("../helpers/init_redis");

module.exports = {
  register: async (req, res, next) => {
    try {
      const { email, password } = req.body;

      // Validate incoming requests using @hapi/joe
      const result = await authValidationSchema.validateAsync(req.body);

      // If NO email or password throw error
      // if (!email || !password) throw createError.BadRequest("Email or Password should be present!!");

      // check if user with the provided email exist in database
      const doesUserExist = await User.findOne({
        email: result.email,
      });

      if (doesUserExist)
        throw createError.Conflict(
          `User with provided email ${email} already exists`
        );

      const user = new User({
        email: result.email,
        password: result.password,
      });

      const savedUser = await user.save();
      const accessToken = await generateAccessToken(savedUser.id);
      const refreshToken = await generateRefreshToken(savedUser.id);
      res.status(201).send({
        message: "User saved successfully",
        user: savedUser,
        token: accessToken,
        refreshToken,
      });
    } catch (error) {
      // if error is coming from hapi set the status to 422
      if (error.isJoi === true) error.status = 422;
      next(error);
    }
  },
  login: async (req, res, next) => {
    try {
      const result = await authValidationSchema.validateAsync(req.body);
      const user = await User.findOne({
        email: result.email,
      });
      if (!user) throw createError.NotFound("User not found, register first!!");
      const isMatch = await user.isPasswordValid(result.password);
      if (!isMatch) throw createError.Unauthorized("Email/Password is wrong!!");
      const accessToken = await generateAccessToken(user.id);
      const refreshToken = await generateRefreshToken(user.id);
      res.status(200).send({
        message: "Login successfull",
        token: accessToken,
        refreshToken,
      });
    } catch (error) {
      if (error.isJoi === true)
        return next(createError.BadRequest("Invalid Username or Password"));
      next(error);
    }
  },
  refreshToken: async (req, res, next) => {
    try {
      const { refreshToken } = req.body;
      const userId = await verifyRefreshToken(refreshToken);
      // Now generate both accesstoken and refresh token
      const newAccessToken = await generateAccessToken(userId);
      const newrRefreshToken = await generateRefreshToken(userId);
      res.send({
        accessToken: newAccessToken,
        refreshToken: newrRefreshToken,
      });
    } catch (error) {
      console.log("errror is", error);
      next(createError.BadRequest());
    }
  },
  logout: async (req, res, next) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) throw createError.BadRequest();
      const userId = await verifyRefreshToken(refreshToken);
      client.DEL(userId, (err, response) => {
        if (err) {
          throw createError.InternalServerError();
        }
        res.status(200).send({
          message: "Logout successfully",
        });
      });
    } catch (error) {
      next(createError.InternalServerError());
    }
  },
};
