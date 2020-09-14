// Import all dependencies

const express = require("express");
const morgan = require("morgan");
const createError = require("http-errors");
require("dotenv").config();
require("./helpers/init_mongodb");

const AuthRoute = require("./Routes/Auth.Route");
const {
  verifyAccessToken
} = require("./helpers/jwt_helper");

require("./helpers/init_redis")

const app = express();

// Use Morgan to log all request info
app.use(morgan("dev"));
app.use(express.json()); // to parse body from the POST requests

app.get("/", (req, res) => {
  res.send("ok");
});

app.get("/protected", verifyAccessToken, (req, res) => {
  console.log("hello", verifyAccessToken);
  res.send({
    message: "Some protected Route",
    token: req.payload,
  });
});

app.use("/auth", AuthRoute);

app.use(async (req, res, next) => {
  // This below implementation is the custom way of creating errors without any package

  // const error = new Error("This Route not found");
  // error.status = 404;
  // next(error);

  next(createError.NotFound("yooo this shit route doesn't exist yaa"));

  // whenever we call next with error as parameter below middleware func will get triggereed
});

// This will get fired whenever we this application calls next(error)
app.use(async (err, req, res, next) => {
  res.status(err.status || 500);
  res.send({
    error: {
      status: err.status || 500,
      message: err.message,
    },
  });
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => console.log("App UP & RUNNING!!! Catch it", PORT));