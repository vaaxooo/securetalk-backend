const { createClient } = require('redis');

const config = process.env;

module.exports.Redis = createClient({
    host: config.REDIS_HOST,
    port: config.REDIS_PORT,
    password: config.REDIS_PASSWORD
});