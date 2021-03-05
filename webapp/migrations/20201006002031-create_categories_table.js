'use strict';

const { Sequelize } = require("../models");

module.exports = {
  up: async (queryInterface, DataTypes) => {
    return queryInterface.createTable("Category",{
      category_id:{
        type:Sequelize.UUID,
        allowNull:false,
        autoIncrement: false,
        primaryKey:true,
        defaultValue:require("sequelize").UUIDV4
    },
    category:
    {
        type:Sequelize.STRING,
        unique:true
    },
  },{
    tableName: 'Category',timestamps: false
 });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.dropTable("Category");
  }
};
