const JWT = require("jsonwebtoken");
const createError = require("http-errors");
const client = require("./init_redis");

// JWT doesn't support promises, it only uses callbacks
// So generate our own promises then

module.exports = {
    generateAccessToken: (userid) => {
        return new Promise((resolve, reject) => {

            // To create new JWT , it requires payload,secret,options & callback
            const secrect = process.env.ACCESS_TOKEN_SECRET_KEY || "some_super_secret_key";
            const options = {
                expiresIn: '45s',
                issuer: 'google.com',
                audience: userid
            }
            const payload = {}
            JWT.sign(payload, secrect, options, (err, token) => {
                if (err) {
                    return reject(createError.InternalServerError())
                }
                return resolve(token)
            })
        })
    },
    generateRefreshToken: (userid) => {
        return new Promise((resolve, reject) => {

            // To create new refresh JWT , it requires payload,secret,options & callback
            const secrect = process.env.REFRESH_TOKEN_SECRET_KEY || "some_super_secret_refresh_key";
            const options = {
                expiresIn: '1y',
                issuer: 'google.com',
                audience: userid
            }
            const payload = {}
            JWT.sign(payload, secrect, options, (err, token) => {
                if (err) {
                    return reject(createError.InternalServerError())
                }
                // store this generated refresh token in redis database
                // this will be helpful when we want to delete this refresh token or balcklist
                // redis save data by key value
                // ex: client.set(key,value,(callback after saving))
                // set expiration time on token
                client.SET(userid, token, 'EX', 365 * 24 * 60 * 60, (err, response) => {
                    if (err) {
                        console.log("Cant store refres token in redis", err.message)
                        return reject(createError.InternalServerError())
                    }
                    return resolve(token)
                })
            })
        })
    },
    verifyAccessToken: (req, res, next) => {
        if (!req.headers['authorization']) return next(createError.Unauthorized());
        const authHeader = req.headers['authorization'];
        const bearerToken = authHeader.split(' ');
        const token = bearerToken[1];
        JWT.verify(token, process.env.ACCESS_TOKEN_SECRET_KEY, (err, payload) => {
            if (err) {
                // if (err.name === "JsonWebTokenError") {
                //     return next(createError.Unauthorized())
                // } else {
                //     return next(createError.Unauthorized(err.message))
                // }
                // above code refactored to
                const message = err.name === 'JsonWebTokenError' ? 'Unauthoried' : err.message;
                return next(createError.Unauthorized(message))
            }
            req.payload = payload;
            next();
        })

    },
    verifyRefreshToken: (refreshToken) => {
        return new Promise((resolve, reject) => {
            JWT.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET_KEY, (err, payload) => {
                if (err) return reject(createError.Unauthorized());
                // get userid from jwt payload 
                //(in above generate reffresh token we are passing audience: userid in options);
                const userid = payload.aud;
                client.GET(userid, (err, response) => {
                    if (err) {
                        console.log("Cant verify refresh token", err.message);
                        return reject(createError.InternalServerError());
                    }
                    if (refreshToken !== response) return reject(createError.Unauthorized())
                    resolve(userid)
                })
            })
        })
    }
}