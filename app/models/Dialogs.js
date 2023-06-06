const { Sequelize, DataTypes } = require('sequelize');
const { MySQL } = require('../utils/MySQL');

const Users = require('./Users');

const Dialogs = MySQL.define('dialogs', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    sender: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    recipient: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
    },
}, {
    timestamps: false,
    sequelize: MySQL,
    modelName: 'dialogs',
    freezeTableName: true,
    indexes: [{
        unique: false,
        fields: ['sender', 'recipient'],
    }],
});

Dialogs.belongsTo(Users, {
    foreignKey: 'sender',
    targetKey: 'id',
    as: 'senderUser',
});

Dialogs.belongsTo(Users, {
    foreignKey: 'recipient',
    targetKey: 'id',
    as: 'recipientUser',
});

module.exports = Dialogs;