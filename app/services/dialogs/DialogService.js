const Validator = require('validatorjs');
const Logger = require("../../utils/Logger");
const Users = require("../../models/Users");
const Messages = require("../../models/Messages");
const Dialogs = require("../../models/Dialogs");
const { Op } = require("sequelize");

const Network = require('../web3/Network');
const BlockedUsers = require('../../models/BlockedUsers');

module.exports = {

    /* This is a function called `getDialogs` that takes in a single parameter `params`. It is an
    asynchronous function that uses `try-catch` block to handle errors. */
    GetDialogs: async(params) => {
        try {
            const validator = new Validator(params, {
                address: 'required|string',
            });
        
            if (validator.fails()) {
                return {
                    success: false,
                    message: 'Invalid Parameters'
                };
            }
        
            const user = await Users.findOne({ where: { address: params.address } });
        
            if (!user) {
                return {
                    success: false,
                    message: 'User not found'
                };
            }
        
            const dialogs = await Dialogs.findAll({
                where: {
                    [Op.or]: [
                        { sender: user.id },
                        { recipient: user.id }
                    ]
                },
                include: [
                    {
                        model: Users,
                        as: 'senderUser'
                    },
                    {
                        model: Users,
                        as: 'recipientUser'
                    }
                ],
                order: [
                    ['id', 'DESC']
                ],
            });
        

            // get last on message from database by dialogs
            const lastMessages = await Messages.findAll({
                where: {
                    dialogId: dialogs.map(dialog => dialog.id)
                },
                order: [
                    ['id', 'DESC']
                ],
            });

            // all messages from Buffer to stings are
            lastMessages.map(message => {
                message.content = message.content.toString();
                return message;
            });

            // add last message to dialogs
            dialogs.map(dialog => {
                const lastMessage = lastMessages.find(message => message.dialogId === dialog.id);
                if(lastMessage) {
                    dialog.lastMessage = lastMessage;
                }
                return dialog;
            });


            if (dialogs.length === 0) {
                return {
                    success: false,
                    message: 'Dialogs not found'
                };
            }
        
            const modifiedDialogs = dialogs.map(dialog => {
                if (dialog.recipientUser.address === params.address) {
                    return {
                        id: dialog.id,
                        dialogId: dialog.dialogId,
                        senderUser: dialog.recipientUser,
                        recipientUser: dialog.senderUser,
                        lastMessage: dialog.lastMessage
                    };
                } else {
                    return {
                        id: dialog.id,
                        dialogId: dialog.dialogId,
                        senderUser: dialog.senderUser,
                        recipientUser: dialog.recipientUser,
                        lastMessage: dialog.lastMessage
                    }
                }
            });
        
            return {
                success: true,
                message: 'Dialogs found',
                data: modifiedDialogs
            };
        } catch (error) {
            Logger.error(error);
            return {
                success: false,
                message: 'Internal Server Error'
            };
        }        
    },

    /* This is a function called `getDialog` that takes in a single parameter `params`. It is an
    asynchronous function that uses `try-catch` block to handle errors. */
    GetDialog: async(params) => {
        try {
            const validator = new Validator(params, {
                address: 'required|string',
                chatId: 'required|string',
            });
        
            if (validator.fails()) {
                return {
                    success: false,
                    message: 'Invalid Parameters'
                };
            }
        
            let user = await Users.findOne({ where: { address: params.address } });
            if (!user) {
                return {
                    success: false,
                    message: 'User not found'
                };
            }
        
            let dialog = await Dialogs.findOne({
                where: {
                    id: params.id,
                    [Op.or]: [
                        { sender: user.id },
                        { recipient: user.id }
                    ],
                    id: params.chatId
                },
                include: [
                    { model: Users, as: 'senderUser' },
                    { model: Users, as: 'recipientUser' }
                ]
            });
        
            if (!dialog) {
                return {
                    success: false,
                    message: 'Dialog not found'
                };
            }

            const messages = await Messages.findAll({
                where: {
                    dialogId: dialog.id
                },
                order: [
                    ['id', 'ASC']
                ],
            });

            // all messages from Buffer to stings are
            messages.map(message => {
                message.content = message.content.toString();
                return message;
            });

            dialog = dialog.toJSON();
            dialog.messages = messages;

            let tUser
            if(dialog.recipientUser.address === params.address) {
                tUser = dialog.recipientUser;
                dialog.recipientUser = dialog.senderUser;
                dialog.senderUser = tUser;
            }
            
            let blocked = await BlockedUsers.findOne({
                where: {
                    user_id: user.id,
                    blocked_id: dialog.recipientUser.id
                }
            })

            if(blocked) {
                dialog.blocked = blocked
            } else {
                blocked = await BlockedUsers.findOne({
                    where: {
                        blocked_id: user.id
                    }
                })
                dialog.blocked = blocked
            }
        
            return {
                success: true,
                message: 'Dialog found',
                data: dialog
            };
        } catch (error) {
            Logger.error(error);
            return {
                success: false,
                message: 'Internal Server Error'
            };
        }        
    },


    /* The `searchUser` function is a method that takes in a single parameter `params`. It is an
    asynchronous function that uses `try-catch` block to handle errors. */
    AddUser: async(params) => {
        try {
            const validator = new Validator(params, {
                address: 'required|string',
                recipient: 'required|string',
            });
        
            if (validator.fails()) {
                return {
                    success: false,
                    message: 'Invalid Parameters'
                };
            }

            if(params.address === params.recipient) {
                return {
                    success: false,
                    message: 'You cannot add yourself'
                };
            }

            // const network = new Network();
            // const addressExists = await network.checkAddressExists(params.recipient);
            // if (!addressExists.success) {
            //     return {
            //         success: false,
            //         message: addressExists.message
            //     };
            // }
        
            let user = await Users.findOne({ where: { address: params.address } });
            if (!user) {
                return {
                    success: false,
                    message: 'User not found'
                };
            }
        
            let recipient = await Users.findOne({ where: { address: params.recipient } });
            if (!recipient) {
                recipient = await Users.create({ address: params.recipient });
            }
        
            let dialog = await Dialogs.findOne({
                where: {
                    [Op.or]: [
                        { sender: user.id, recipient: recipient.id },
                        { sender: recipient.id, recipient: user.id }
                    ]
                }
            });
        
            if (!dialog) {
                dialog = await Dialogs.create({ sender: user.id, recipient: recipient.id });
            }
        
            return {
                success: true,
                message: 'User found',
                data: dialog
            };
        } catch (error) {
            Logger.error(error);
            return {
                success: false,
                message: 'Internal Server Error'
            };
        }        
    },


    /* The above code is defining an asynchronous function called `BlockUser` which takes in a parameter
    called `params`. Inside the function, it first validates the `params` using the `Validator` class.
    If the validation fails, it returns an error message. */
    async BlockUser(params) {
        try {
            const validator = new Validator(params, {
                dialogId: 'required|numeric',
                sender: 'required|numeric',
                recipient: 'required|numeric',
            });
            if(validator.fails()) {
                return {
                    success: false,
                    message: 'Invalid Parameters'
                };
            }

            const dialog = await Dialogs.findOne({
                where: {
                    id: params.dialogId,
                    [Op.or]: [
                        { sender: params.sender },
                        { recipient: params.sender }
                    ]
                }
            });

            if(!dialog) {
                return {
                    success: false,
                    message: 'Dialog not found'
                };
            }

            const blocked = BlockedUsers.create({
                user_id: params.sender,
                blocked_id: params.recipient
            });

            return {
                success: true,
                message: 'User blocked',
                data: {
                    dialogId: params.dialogId,
                    blocked: blocked,
                }
            };
            
        } catch (error) {
            Logger.error(error);
            return {
                success: false,
                message: 'Internal Server Error'
            };
        }
    },

    /* The above code is an asynchronous function in JavaScript that unblocks a user by deleting the
    corresponding record from the BlockedUsers table in a database. It takes in three required
    parameters: dialogId (numeric), sender (numeric), and recipient (numeric). It first validates the
    parameters using the Validator class, and if the validation fails, it returns an error message. It
    then checks if the dialog exists and if the sender is a part of the dialog. If the dialog is not
    found, it returns an error message. If the user is not blocked, it returns an error message. If the
    user is blocked */
    UnblockUser: async(params) => {
        try {
            const validator = new Validator(params, {
                dialogId: 'required|numeric',
                sender: 'required|numeric',
                recipient: 'required|numeric',
            });
            if(validator.fails()) {
                return {
                    success: false,
                    message: 'Invalid Parameters'
                };
            }

            const dialog = await Dialogs.findOne({
                where: {
                    id: params.dialogId,
                    [Op.or]: [
                        { sender: params.sender },
                        { recipient: params.sender }
                    ]
                }
            });

            if(!dialog) {
                return {
                    success: false,
                    message: 'Dialog not found'
                };
            }

            let blocked = await BlockedUsers.findOne({
                where: { user_id: params.sender, blocked_id: params.recipient },
            });

            if(!blocked) {
                return {
                    success: false,
                    message: 'User not blocked'
                };
            }

            await blocked.destroy();

            blocked = await BlockedUsers.findOne({
                where: { user_id: params.recipient, blocked_id: params.sender },
            })

            return {
                success: true,
                message: 'User unblocked',
                data: {
                    dialogId: params.dialogId,
                    blocked: blocked,
                }
            };

        } catch (error) {
            Logger.error(error);
            return {
                success: false,
                message: 'Internal Server Error'
            };
        }
    },



    /* The above code is a JavaScript function called SendMessage that sends a message to a recipient in a
    chat dialog. It takes in parameters such as the recipient's address, chat ID, and message content.
    The function first validates the parameters and checks if the user and dialog exist. It then creates
    a new message in the Messages table with the sender and recipient IDs and the message content.
    Finally, it returns a success message with the created message data or an error message if any
    issues occur. There are also commented out lines of code related to using a web3 network to send the
    message, but they are not */
    SendMessage: async(params) => {
        try {
            const validator = new Validator(params, {
                address: 'required|string',
                chatId: 'required|string',
                message: 'required|string',
            });
            if (validator.fails()) {
                return {
                    success: false,
                    message: 'Invalid Parameters'
                };
            }
            let user = await Users.findOne({ where: { address: params.address } });
            if (!user) {
                return {
                    success: false,
                    message: 'User not found'
                };
            }
        
            let dialog = await Dialogs.findOne({
                where: {
                    id: params.chatId,
                    [Op.or]: [
                        { sender: user.id },
                        { recipient: user.id }
                    ]
                }
            });
            if (!dialog) {
                return {
                    success: false,
                    message: 'Dialog not found'
                };
            }
        
            let recipient = await Users.findOne({
                where: {
                    [Op.or]: [
                        { id: dialog.sender },
                        { id: dialog.recipient }
                    ]
                }
            });
        
            if (!recipient) {
                return {
                    success: false,
                    message: 'Recipient not found'
                };
            }
            // const web3 = new Network();
            // const response = await web3.sendMessage(params.chatId, params.message, params.address);
            // console.log(response)
            // if(!response.success) {
            //     return {
            //         success: false,
            //         message: response.message
            //     };
            // }
        
            
            let senderId, recipientId;

            if (dialog.sender === user.id) {
                senderId = dialog.sender;
                recipientId = dialog.recipient;
            } else {
                senderId = dialog.recipient;
                recipientId = dialog.sender;
            }
            
            const blockedUser = await BlockedUsers.findOne({
                where: {
                    [Op.or]: [
                        { user_id: senderId, blocked_id: recipientId },
                        { user_id: recipientId, blocked_id: senderId }
                    ]
                }
            });

            if(blockedUser) {
                return {
                    success: false,
                    message: 'User blocked'
                };
            }
            
            const message = await Messages.create({
                dialogId: params.chatId,
                sender: senderId,
                recipient: recipientId,
                content: params.message
            });
            
            
        
            return {
                success: true,
                message: 'Message sent',
                data: message
            };
        } catch (error) {
            Logger.error(error);
            return {
                success: false,
                message: 'Internal Server Error'
            };
        }
    }
}