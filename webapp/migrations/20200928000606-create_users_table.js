'use strict';

const { Sequelize } = require("../models");

module.exports = {
  up: async (queryInterface, DataTypes) => {
    return queryInterface.createTable("User",{
      id:{
        type:DataTypes.UUID,
        allowNull:false,
        autoIncrement: false,
        primaryKey:true
    },
    first_name: DataTypes.STRING(200),
    last_name: DataTypes.STRING(200),
    username: DataTypes.STRING(200),
    password: DataTypes.STRING(200),
    createdAt: {
      field: 'account_created',
      type: Sequelize.DATE,
  },
  updatedAt: {
      field: 'account_updated',
      type: Sequelize.DATE,
  },
    },{tableName: 'User'},)
    
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.dropTable("User");
  }
};
