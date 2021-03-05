const Sequelize=require("sequelize");
const sequelize = require("../src/database/connection");

const Answer = sequelize.define("Answer",{
      answer_id:{
          type:Sequelize.UUID,
          allowNull:false,
          autoIncrement: false,
          primaryKey:true,
          defaultValue:require("sequelize").UUIDV4
      },
      question_id:Sequelize.UUID,
      
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
      user_id:Sequelize.UUID,
      answer_text:Sequelize.STRING
      
  },{
      tableName: 'Answer'
   },{timestamps: false});
 // return User;
module.exports=Answer;

