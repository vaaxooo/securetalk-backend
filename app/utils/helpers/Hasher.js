const crypto = require("crypto")
const Logger = require("../Logger")

/**
 * The function encrypts a given text using AES-256-CBC encryption with a specified encryption key.
 * @param text - The text that needs to be encrypted.
 * @returns an encrypted hash of the input text using the AES-256-CBC encryption algorithm and a secret
 * key stored in the environment variable ENCRYPTION_KEY. The encrypted hash is represented in
 * hexadecimal format.
 */
function encryptHash(text) {
    text = JSON.stringify(text);
    const cipher = crypto.createCipher('aes-256-cbc', process.env.ENCRYPTION_KEY);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

/**
 * The function decrypts a hash using AES-256-CBC encryption with a secret key.
 * @param text - The encrypted text that needs to be decrypted.
 * @returns The code is incomplete and contains undefined variables (`crypto`, `secretKey`,
 * `encryptedText`). Therefore, it is not possible to determine what is being returned.
 */
function decryptHash(text) {
    const decipher = crypto.createDecipher('aes-256-cbc', process.env.ENCRYPTION_KEY);
    let decrypted = decipher.update(text, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
}

/**
 * This function encrypts a given text using the AES-256-CBC encryption algorithm and a secret key
 * stored in an environment variable.
 * @param text - The text that needs to be encrypted.
 * @returns an encrypted version of the input text using the AES-256-CBC encryption algorithm and a
 * secret key stored in the environment variable ENCRYPTION_KEY. The encrypted text is in hexadecimal
 * format.
 */
function encrypt(text) {
    const cipher = crypto.createCipher('aes-256-cbc', process.env.ENCRYPTION_KEY);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

/**
 * This function decrypts a given text using AES-256-CBC encryption and a specified encryption key.
 * @param text - The encrypted text that needs to be decrypted.
 * @returns the decrypted version of the input text using the AES-256-CBC encryption algorithm and the
 * encryption key stored in the environment variable ENCRYPTION_KEY.
 */
function decrypt(text) {
    const decipher = crypto.createDecipher('aes-256-cbc', process.env.ENCRYPTION_KEY);
    let decrypted = decipher.update(text, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

module.exports = {
    encryptHash,
    decryptHash,
    decrypt,
    encrypt
}