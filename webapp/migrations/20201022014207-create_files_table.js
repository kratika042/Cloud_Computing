'use strict';

const { Sequelize } = require("../models");

module.exports = {
  up: async (queryInterface, DataTypes) => {
    return queryInterface.createTable("File",{
        file_id: { type: Sequelize.UUID, primaryKey: true, allowNull: false },
        file_name: { type: Sequelize.STRING, allowNull: false },
        s3_object_name: { type: Sequelize.STRING, allowNull: false },
        original_filename: { type: Sequelize.STRING, allowNull: false },
        encoding: { type: Sequelize.STRING, allowNull: false },
        mimetype: { type: Sequelize.STRING, allowNull: false },
        'content-length': { type: Sequelize.STRING, allowNull: false },
        createdAt:{
          field: 'created_date',
          type: Sequelize.DATE,
      }
      }
        ,{ updatedAt: false, freezeTableName: true },{
    tableName: 'File'},{timestamps: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.dropTable("File");
  }
};
