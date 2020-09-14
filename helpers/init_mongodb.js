const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI, {
        dbName: process.env.MONGODB_DATABASENAME,
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
        useCreateIndex: true
    })
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.log("Error while connecting", err));

// Log all events

mongoose.connection.on('connected', () => {
    console.log("Mongoose connected to DB");
});

mongoose.connection.on('error', (err) => {
    console.log("Error on Mongoose conenction to DB", err.message);
});

mongoose.connection.on('disconnect', () => {
    console.log("Mongoose Disconnected");
});

// Close mongoose connection when app exited
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    process.exit(0);
})