const Messages = require('../../models/Messages');
const Dialogs = require('../../models/Dialogs');
const Logger = require('../../utils/Logger');
const Validator = require('validatorjs');

module.exports = {

    /* This is a function called `MarkAsReadMessage` that takes in an object `params` as a parameter. It
    first validates the `params` object using a `Validator` class, checking if it has the required
    properties and if they are of the correct type. If the validation fails, it returns an error
    message. */
    MarkAsReadMessage: async (params) => {
        try {
            const validator = new Validator(params, {
                chatId: 'required|integer',
                messageId: 'required|integer',
                consumer: 'required|integer',
            });

            if (validator.fails()) {
                return {
                    success: false,
                    message: 'Invalid Parameters'
                };
            }

            const dialog = await Dialogs.findOne({
                where: {
                    id: params.chatId,
                },
            });



            if (!dialog) {
                return {
                    success: false,
                    message: 'Dialog not found'
                };
            }

            const message = await Messages.findOne({
                where: {
                    id: params.messageId,
                    dialogId: params.chatId,
                    recipient: params.consumer,
                },
            });

            if (!message) {
                return {
                    success: false,
                    message: 'Message not found'
                };
            }

            await Messages.update({
                is_read: true,
            }, {
                where: {
                    id: params.messageId,
                    dialogId: params.chatId,
                    recipient: params.consumer,
                },
            });

            return {
                success: true,
                message: 'Message marked as read',
                data: {
                    id: message.id,
                    dialogId: message.dialogId,
                    messageId: params.messageId,
                    sender: message.sender,
                    recipient: message.recipient,
                }
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