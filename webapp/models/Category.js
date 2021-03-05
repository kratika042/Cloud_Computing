const { UniqueConstraintError } = require("sequelize");
const Sequelize=require("sequelize");
const sequelize = require("../src/database/connection");

const Category = sequelize.define("Category",{
      category_id:{
          type:Sequelize.UUID,
          allowNull:false,
          autoIncrement: false,
          primaryKey:true,
          defaultValue:require("sequelize").UUIDV4,
          
      },
      category:
      {
          type:Sequelize.STRING,
          unique:true
      },
    },{
      tableName: 'Category',timestamps: false
   });
 // return User;
module.exports=Category;

