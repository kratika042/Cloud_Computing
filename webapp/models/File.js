const Sequelize=require("sequelize");
const sequelize = require("../src/database/connection");

// module.exports= (sequelize, DataTypes)=>{
    const File = sequelize.define("File",{
        file_id: { type: Sequelize.UUID, primaryKey: true, allowNull: false },
        file_name: { type: Sequelize.STRING, allowNull: false },
        s3_object_name: { type: Sequelize.STRING, allowNull: false },
        original_filename: { type: Sequelize.STRING, allowNull: false },
        encoding: { type: Sequelize.STRING, allowNull: false },
        mimetype: { type: Sequelize.STRING, allowNull: false },
        "content-length": { type: Sequelize.STRING, allowNull: false },
        createdAt:{
            field: 'created_date',
            type: Sequelize.DATE,
        }

    }, { timestamps: true, updatedAt: false, freezeTableName: true });
module.exports=File;