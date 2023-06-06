
const Web3 = require('web3');
const Logger = require('../../utils/Logger');
const abi = require('./abi.json')

class Network {

    constructor() {
        this.web3 = new Web3(process.env.INFURA_URL);
        this.contract = new this.web3.eth.Contract(abi, process.env.CONTRACT_ADDRESS);
    }


    /**
     * This is an async function that sends a message to a chat using web3 and saves it to a contract.
     * @param chatId - The ID of the chat where the message will be saved.
     * @param messageContent - The content of the message that you want to save in the blockchain.
     */
    async sendMessage(chatId, messageContent, sender) {
        try {


            // let txParams = {
            //     from: sender,
            //     gas: 1000000,
            //     gasPrice: 10000000000,
            //     to: process.env.CONTRACT_ADDRESS,
            //     data: this.contract.methods.saveMessage(messageContent, chatId).encodeABI()
            // }

            // const tx = await this.web3.eth.accounts.signTransaction(txParams, process.env.PRIVATE_KEY);
            // const transaction = await this.web3.eth.sendSignedTransaction(tx.rawTransaction);



            const nonce = await this.web3.eth.getTransactionCount(sender, 'pending');
            const currentGasPrice = await this.web3.eth.getGasPrice();

            // Увеличиваем gas price на определенный процент (например, 10%)
            const gasPriceIncreasePercentage = 10;
            const newGasPrice = currentGasPrice * (1 + gasPriceIncreasePercentage / 100);
            
            // Округляем новое значение gas price до целого числа
            const roundedGasPrice = Math.round(newGasPrice);
            
            const gasLimit = 300000;
            const contractMethod = this.contract.methods.saveMessage(messageContent, chatId);
        
            const data = contractMethod.encodeABI();
        
            const transaction = {
              from: sender,
              to: process.env.CONTRACT_ADDRESS,
              nonce: this.web3.utils.toHex(nonce),
              gasPrice: this.web3.utils.toHex(roundedGasPrice),
              gasLimit: this.web3.utils.toHex(gasLimit),
              value: '0x00',
              data: data,
            };
        
            // Подписываем транзакцию
            const signedTransaction = await this.web3.eth.accounts.signTransaction(transaction, process.env.PRIVATE_KEY);
        
            // Отправляем подписанную транзакцию
            const receipt = await this.web3.eth.sendSignedTransaction(signedTransaction.rawTransaction);

            



            console.log(receipt)
            return {
                success: true,
                message: 'Message sent',
                data: receipt
            }
        } catch (error) {
            Logger.error(error);
            return {
                success: false,
                message: 'Internal Server Error'
            }
        }
    }
    
    /**
     * This function retrieves messages by chat ID from a smart contract and logs them to the console.
     * @param chatId - The chatId parameter is the unique identifier of a chat or conversation for which we
     * want to retrieve messages.
     */
    async getMessagesByChatId(chatId) {
        try {
            const messages = await contract.methods.getMessagesByChatId(chatId).call();
            return {
                success: true,
                message: 'Messages found',
                data: messages
            };
        } catch (error) {
            Logger.error(error);
            return {
                success: false,
                message: 'Internal Server Error'
            }
        }
    }

    /**
     * This function checks if a given Ethereum address has any transactions associated with it.
     * @param address - The Ethereum address that needs to be checked for existence.
     * @returns an object with two properties: "success" and "message". The "success" property is a boolean
     * value indicating whether the address exists or not. The "message" property is a string value
     * providing additional information about the result. If the address exists, the message will be
     * "Address exists". If the address does not exist, the message will be "Address does not exist". If
     */
    async checkAddressExists(address) {
        try {
            const transactionsCount = await this.web3.eth.getTransactionCount(address);
            const recipientTransactionsCount = await this.web3.eth.getTransactionCount(address);
            if (transactionsCount > 0 || recipientTransactionsCount > 0) {
                return {
                    success: true,
                    message: 'Address exists'
                }
            } else {
                return {
                    success: false,
                    message: 'Address does not exist'
                }
            }
        } catch (error) {
            Logger.error(error);
            return {
                success: false,
                message: 'Internal Server Error'
            }
        }
    }
}

module.exports = Network;