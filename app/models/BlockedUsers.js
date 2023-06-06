const { Sequelize, DataTypes } = require('sequelize');
const { MySQL } = require('../utils/MySQL');

const Users = require('./Users');

const BlockedUsers = MySQL.define('blocked_users', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    blocked_id: {
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
    modelName: 'blocked_users',
    freezeTableName: true,
    indexes: [{
        unique: false,
        fields: ['user_id', 'blocked_id'],
    }],
});

BlockedUsers.belongsTo(Users, {
    foreignKey: 'user_id',
    targetKey: 'id',
    as: 'user',
});

BlockedUsers.belongsTo(Users, {
    foreignKey: 'blocked_id',
    targetKey: 'id',
    as: 'blocked',
});

module.exports = BlockedUsers;