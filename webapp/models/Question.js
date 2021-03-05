const Sequelize=require("sequelize");
const sequelize = require("../src/database/connection");

// module.exports= (sequelize, DataTypes)=>{
    const Question = sequelize.define("Question",{
        question_id:{
            type:Sequelize.UUID, 
            allowNull:false,
            autoIncrement: false,
            primaryKey:true,
            defaultValue:require("sequelize").UUIDV4
        },
        //user_id:Sequelize.UUID,
        question_text: Sequelize.STRING,
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
        
    },{
        tableName: 'Question'
     },{timestamps: false});
//    return Question;
// };


module.exports=Question;