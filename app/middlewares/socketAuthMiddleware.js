const jwt = require('jsonwebtoken');

function socketAuthMiddleware(socket, next) {
    // Get the token from the socket handshake query or headers
    // const token = socket.handshake.query.token || socket.handshake.headers.authorization;

    // // Check if a token is provided
    // if (!token) {
    //     return next(new Error('Authentication error: Token missing'));
    // }

    // try {
    //     // Verify the token and decode the payload
    //     const decoded = jwt.verify(token, process.env.JWT_SECRET);

    //     // Attach the decoded payload to the socket object for further use
    //     socket.user = decoded;

        //  next();
    // } catch (error) {
    //     next(new Error('Authentication error: Invalid token'));
    // }
}

module.exports = socketAuthMiddleware;