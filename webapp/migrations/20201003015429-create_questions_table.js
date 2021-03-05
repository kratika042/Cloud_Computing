'use strict';

const { Sequelize } = require("../models");

module.exports = {
  up: async (queryInterface, DataTypes) => {
    return queryInterface.createTable("Question",{
      question_id:{
        type:DataTypes.UUID,
        allowNull:false,
        autoIncrement: false,
        primaryKey:true,
        defaultValue:require("sequelize").UUIDV4
    }, 
    //user_id:DataTypes.UUID,
    question_text: DataTypes.STRING,
    createdAt: {
        field: 'created_timestamp',
        type: Sequelize.DATE,
       //type:'TIMESTAMP',
    },
    updatedAt: {
        field: 'updated_timestamp',
        type: Sequelize.DATE,
        //type:'TIMESTAMP',
    },
    
    },{tableName: 'Question'},)
    
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.dropTable("Question");
  }
};
