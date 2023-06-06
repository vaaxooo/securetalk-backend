const jwt = require('jsonwebtoken')
const Validator = require('validatorjs')
const Logger = require("../../utils/Logger")
const Users = require("../../models/Users")
const {
    encrypt,
    decrypt
} = require("../../utils/helpers/Hasher")

module.exports = {

    /* A function called `Login` that takes in a parameter `params` and returns an object with a `success`
    boolean value, a `message` string, and the `params` object. The function is marked as `async`, which
    means it can use `await` to handle promises. If there is an error, it logs the error using a
    `Logger` utility and returns an object with `success` set to `false` and a generic error message. */
    Login: async(params) => {
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
        
            let [user, created] = await Users.findOrCreate({
                where: {
                    address: params.address
                },
                defaults: {
                    address: params.address
                }
            });
        
            if (!created) {
                await Users.update(
                    { is_active: true },
                    { where: {id: user.id} }
                );
            }
        
            const token = jwt.sign({id: user.id,address: user.address},process.env.JWT_SECRET, { expiresIn: '1d'});
            user.token = token;
            return {
                success: true,
                message: 'Login Success',
                user: {
                    id: user.id,
                    address: user.address,
                    token: user.token
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



    /* The `Me` function is an asynchronous function that takes in a `socket` parameter. It attempts to
    find a user in the `Users` model with the `id` that matches the `id` of the user associated with the
    `socket`. If the user is not found, it returns an object with `success` set to `false` and a message
    indicating that the token is invalid. If the user is found, it decrypts the user's `address` using
    the `decryptHash` function and returns an object with `success` set to `true`, a message indicating
    success, and an object containing the user's `id`, `address`, and `token`. */
    Me: async(socket) => {
        try {
            const user = await Users.findByPk(socket.user.id);
            if (!user) {
                return {
                    success: false,
                    message: 'Invalid Token'
                };
            }
            user.address = user.address;
            return {
                success: true,
                message: 'Success',
                user: {
                    id: user.id,
                    address: user.address,
                    token: user.token
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


    /* The `SetOnline` function is an asynchronous function that takes in a `params` parameter. It attempts
    to find a user in the `Users` model with the `id` that matches the `id` of the user associated with
    the `socket`. If the user is not found, it returns an object with `success` set to `false` and a
    message indicating that the token is invalid. If the user is found, it updates the user's `is_active`
    property to `true` and returns an object with `success` set to `true`, a message indicating success,
    and an object containing the user's `id`, `address`, and `token`. */
    SetOnline: async(params, status) => {
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
            await Users.update(
                { is_active: true,
                is_online: status },
                { where: {address: params.address} }
            );
            return {
                success: true,
                message: 'Success',
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