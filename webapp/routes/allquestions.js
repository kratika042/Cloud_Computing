const express = require('express');
const allques=express.Router();
const bcrypt=require('bcrypt-nodejs');
const schema= require('../src/validator');
const db = require('../models');
const emailValidator=require('email-validator');
const { Sequelize, sequelize } = require('../models');
const Client = require('node-statsd-client').Client;
const statsdClient= new Client("localhost",8125)
const winston = require('winston');
let get_allquestions_counter=0;
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
      new winston.transports.File({ filename: 'csye6225.log' })
    ]
  });
  

sequelize.sync();
allques.get('/questions',async function(req,res,next){
    logger.log({
        level:'info',
        message:'get_allquestions'
    });
    let questions_get_start= new Date()
    get_allquestions_counter+=1
    statsdClient.count("get_allquestions_counter",get_allquestions_counter)
    let questions_find_start= new Date()
    await db.Question.findAll({
        include: ['categories','answers','files']
    }).then((question)=>{
        if(question.length!=0){
            let questions_find_end = new Date()
            let questions_find_time=questions_find_end.getMilliseconds()-questions_find_start.getMilliseconds();
            statsdClient.timing("all_questions_find_db_query",questions_find_time);
            res.status(200).send(question)
        }
        else{
            res.status(404).send({message:"No questions found!!"})
        }
    }).catch((err)=>{
        logger.log({
            level: 'error',
            message: err
        })
    })
    let questions_get_end= new Date()
    let questions_get_time=questions_get_end.getMilliseconds()-questions_get_start.getMilliseconds();
    statsdClient.timing("all_questions_get_api_time",questions_get_time);

})
module.exports=allques;