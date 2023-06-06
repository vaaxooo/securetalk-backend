const { Sequelize, DataTypes } = require('sequelize');
const { MySQL } = require('../utils/MySQL');

const Users = MySQL.define('users', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    address: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    is_online: {
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
    modelName: 'users',
    freezeTableName: true,
    indexes: [{
        unique: true,
        fields: ['address'],
    }],
});

module.exports = Users;