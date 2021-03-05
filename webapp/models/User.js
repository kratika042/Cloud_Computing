  const Sequelize=require("sequelize");
  const sequelize = require("../src/database/connection");

const User = sequelize.define("User",{
        id:{
            type:Sequelize.UUID,
            allowNull:false,
            autoIncrement: false,
            primaryKey:true,
            defaultValue:require("sequelize").UUIDV4
        },
        
        first_name: Sequelize.STRING(200),
        last_name: Sequelize.STRING(200),
        username: Sequelize.STRING(200),
        password: Sequelize.STRING(200),
        createdAt: {
            field: 'account_created',
            type: Sequelize.DATE,
           //type:'TIMESTAMP',
        },
        updatedAt: {
            field: 'account_updated',
            type: Sequelize.DATE,
            //type:'TIMESTAMP',
        },
        
    },{
        tableName: 'User'
     },{timestamps: false});
   // return User;
module.exports=User;

