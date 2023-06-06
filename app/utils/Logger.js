const winston = require('winston');
const { combine, timestamp, label, printf } = winston.format;

const myFormat = printf(({ level, message, label, timestamp }) => {
    return `[${timestamp}] [${level}]: ${message}`;
});

const errorPathFormat = winston.format((info) => {
    if (info instanceof Error) {
        info.path = info.stack.split('\n')[1].trim().replace('at ', '');
    }
    return info;
});


const Logger = winston.createLogger({
    format: winston.format.combine(
        errorPathFormat(),
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        //
        // - Write all logs with importance level of `error` or less to `error.log`
        // - Write all logs with importance level of `info` or less to `combined.log`
        //
        new winston.transports.File({ filename: 'logs/errors.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log', level: 'info' })
    ],
});


module.exports = Logger