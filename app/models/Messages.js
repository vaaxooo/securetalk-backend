const { Sequelize, DataTypes } = require('sequelize');
const { MySQL } = require('../utils/MySQL');

const Dialogs = require('./Dialogs');

const Messages = MySQL.define('messages', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    dialogId: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    sender: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    recipient: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    is_read: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
    },
}, {
    timestamps: false,
    sequelize: MySQL,
    modelName: 'messages',
    freezeTableName: true,
    indexes: [{
        unique: false,
        fields: ['sender', 'recipient'],
    }],
});

Messages.belongsTo(Dialogs, {
    foreignKey: 'dialogId',
    targetKey: 'id',
    as: 'dialog',
});

module.exports = Messages;