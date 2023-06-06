require('dotenv-flow').config()
const http = require('http');
const socketIO = require('socket.io');
const socketAuthMiddleware = require('./app/middlewares/socketAuthMiddleware');

const io = require('socket.io')({
    allowEIO3: true,
    cleanupEmptyChildNamespaces: true,
    maxHttpBufferSize: 1e8,
    pingInterval: 15000,
    pingTimeout: 60000,
    perMessageDeflate: {
        zlibDeflateOptions: {
            // See zlib defaults.
            chunkSize: 1024,
            memLevel: 7,
            level: 3
        },
        zlibInflateOptions: {
            chunkSize: 10 * 1024
        },
        // Other options settable:
        clientNoContextTakeover: true, // Defaults to negotiated value.
        serverNoContextTakeover: true, // Defaults to negotiated value.
        serverMaxWindowBits: 10, // Defaults to negotiated value.
        // Below options specified as default values.
        concurrencyLimit: 10, // Limits zlib concurrency for perf.
        threshold: 1024 // Size (in bytes) below which messages
    },
    cors: {},
})

const { MySQL } = require('./app/utils/MySQL')
const { Redis } = require('./app/utils/Redis')
const Logger = require('./app/utils/Logger')

const { Login, SetOnline } = require('./app/services/accounts/AccountService');
const { GetDialogs, GetDialog, AddUser, SendMessage, BlockUser, UnblockUser } = require('./app/services/dialogs/DialogService');
const { MarkAsReadMessage } = require('./app/services/dialogs/MessageService');
const { decryptHash, encryptHash } = require('./app/utils/helpers/Hasher');


/* ################################################################### */


io.on('connection', (socket) => {
    
    socket.on('connect', async() => {
        socket.emit('connect', { success: true });
    })

    socket.on('socket-connected', async (data) => {
        await SetOnline(data, true);
        socket.user = data;
    })

    socket.on('account:login', async(data) => {
        const result = await Login(decryptHash(data));
        socket.emit('account:login', encryptHash(result));
        socket.user = result.user;
    });

    socket.on('account:me', async() => {
        const result = await Me(socket);
        socket.emit('account:me', encryptHash(result));
    });

    socket.on('account:setOnline', async(data) => {
        await SetOnline(decryptHash(data), true);
    })


    socket.on('dialogs:getDialogs', async(data) => {
        const result = await GetDialogs(decryptHash(data));
        socket.emit('dialogs:getDialogs', encryptHash(result));
    });

    socket.on('dialogs:getDialog', async (data) => {
        const currentRoom = socket.currentRoom;
        const rooms = Array.from(socket.rooms);
        for (const room of rooms) {
            if (room !== currentRoom) {
                socket.leave(room);
            }
         }
        const result = await GetDialog(decryptHash(data));
        if (result.success) {
            const chatRoom = 'chatId' + result.data.id;
            socket.join(chatRoom);
            socket.currentRoom = result.data.id;
            socket.emit('dialogs:getDialog', encryptHash(result));
        }
    });
      
      

    socket.on('dialogs:addUser', async(data) => {
        const result = await AddUser(decryptHash(data));
        socket.emit('dialogs:addUser', encryptHash(result));
    });

    socket.on('dialogs:sendMessage', async(data) => {
        const result = await SendMessage(decryptHash(data));
        if(result.success) {
            io.to('chatId' + +result.data.dialogId).emit('dialogs:sendMessage', encryptHash(result));
            io.to('chatId' + +result.data.dialogId).emit('dialogs:newMessage', encryptHash(result));
        }
    })

    socket.on('dialogs:typingMessage', async(data) => {
        data = decryptHash(data);
        io.to('chatId' + data.chatId).emit('dialogs:typingMessage', encryptHash({
            success: true,
            data: {
                chatId: data.chatId,
                address: data.address,
                typing: data.typing
            }
        }));
    })

    socket.on('messages:markAsRead', async (data) => {
        const result = await MarkAsReadMessage(decryptHash(data));
        if (result.success) {
            io.to('chatId' + +result.data.dialogId).emit('messages:markAsRead', encryptHash(result));
        }
      });      


    socket.on('users:block', async(data) => {
        const result = await BlockUser(decryptHash(data));
        if (result.success) {
            io.to('chatId' + +result.data.dialogId).emit('users:block', encryptHash(result));
        }
    });

    socket.on('users:unblock', async(data) => {
        const result = await UnblockUser(decryptHash(data));
        if (result.success) {
            io.to('chatId' + +result.data.dialogId).emit('users:unblock', encryptHash(result));
        }
    });

    socket.on('disconnect', async() => {
        await SetOnline({address: socket.user.address}, false);
    })

    socket.on('disconnecting', async () => {
        await SetOnline({address: socket.user.address}, false);
        const rooms = Array.from(socket.rooms);
        for (const room of rooms) {
            socket.leave(room);
        }
    });


});



/* ################################################################### */

/**
 * It checks if the table is empty, if it is empty it will create a row with the values of 0.
 */
async function startNode() {
    try {
        await MySQL.authenticate();
        await MySQL.sync()
        await Redis.connect();
        Logger.info('Postgres connection has been established successfully.');
    } catch (error) {
        Logger.error('Unable to connect to the database:', error);
    }
    Logger.info(`Server is running on port ${process.env.PORT}`)
}

startNode()

io.listen(process.env.PORT);
Redis.on('error', error => Logger.error(error));