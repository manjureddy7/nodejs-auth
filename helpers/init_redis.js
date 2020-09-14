const redis = require("redis");

const client = redis.createClient({
    port: 6379,
    host: "127.0.0.1"
});

client.on("connect", () => {
    console.log("client connected to redis")
})

client.on("ready", () => {
    console.log("client connected to redis & ready to use")
})

client.on("error", (error) => {
    console.log(`error while connecting to redis ${error.message}`)
})

client.on("end", () => {
    console.log(`redis connection ended`)
})


// Stop client  when user terminates

process.on("SIGINT", () => {
    client.quit()
})


// You need to install redis-cli first on your local machine
// then in another terminal start redis-server
// then only you can use redis in your nodejs application
// without above steps you will get redis refused to connect error


module.exports = client;