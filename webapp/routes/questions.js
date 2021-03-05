const express = require('express');
require('dotenv').config()
const question = express.Router();
const bcrypt = require('bcrypt-nodejs');
const schema = require('../src/validator');
//const sequelize=require('../src/database/connection')
const db = require('../models');
const emailValidator = require('email-validator');
const { Sequelize } = require('../models');
var uuid = require('uuid');
const { json } = require('body-parser');

// router.get('/', (req,res) => res.send("heyy"));

let put_question_counter=0
let delete_question_counter=0
let delete_answer_file_counter=0
let delete_answer_counter=0
let put_answer_counter=0
let post_answer_counter=0
let post_question_counter=0
let get_question_counter=0
let get_answer_counter=0
let post_question_file_counter=0
let delete_question_file_counter=0
let post_answer_file_counter=0


const aws = require('aws-sdk')
const multer = require('multer')
const multerS3 = require('multer-s3');
const { fileFilter } = require('../bucket');
const user = require('./users');

const Client = require('node-statsd-client').Client;
const statsdClient= new Client("localhost",8125)
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
      //
      // - Write to all logs with level `info` and below to `csye6225.log` 
      // - Write all logs error (and below) to `error.log`.
      new winston.transports.File({ filename: 'csye6225.log' })
    ]
  });

const awss3 = new aws.S3()

sequelize.sync();
var topicArn = 'arn:aws:sns:us-east-1:108867826646:sns_topic';
authenticate = function (req, res, cb) {

    if (!req.headers.authorization || req.headers.authorization.indexOf('Basic ') === -1) {
        return res.status(401).json({ message: 'Missing Basic Authorization Header' });
    }
    const authorization = req.headers.authorization;
    const user = authorization.split(' ')[1];
    const plaintext = Buffer.from(user, 'base64').toString('ascii');
    const username = plaintext.split(':')[0]
    const options = { new: true }
    const password = plaintext.split(':')[1]
    if (!username || !password) {
        return res.status(401).send({ message: "Please provide username and password!" });
    }
    db.User.findOne({
        where: {
            username: username
        }
    })
        .then((data) => {
            if (data == null) {
                res.status(400).send({ message: "User not found!" });
            }
            else {
                comparePassword(password, data.password, function (err, ismatch) {
                    if (err || !ismatch) {
                        //console.log("Not matched!!")
                        return res.status(400).send({ message: "Incorrect password!!" });
                    }
                    else {
                        return cb(null, data);
                    }
                });
            }
        })
};
comparePassword = function (sentpassword, hashedpassword, cb) {
    bcrypt.compare(sentpassword, hashedpassword, function (err, ismatch) {
        if (err) {
            return cb(err);
        }
        return cb(null, ismatch);
    });
};

// Update the question
//fine
//1
question.put('/:question_id',async function (req, res, next) {
    logger.log({
        level:'info',
        message:'update_question'
    })
    let put_question_start=new Date()
    put_question_counter+=1
    statsdClient.count("put_question_counter",put_question_counter)
    
    authenticate(req, res, async function (err, result) {
        if (err || !result) {
            res.status(401).send({ message: "Not Authorized!" })
        }
        else {
            const keys = Object.keys(req.body)
            //console.log("keys...")
            if (!keys.includes("question_text")) {
                return res.status(400).send({ message: "Invalid parameters, must contain question_text" })
            }
            const question_id = req.params.question_id
            const question_text = req.body.question_text
            
            await db.Question.findOne({
                where: {
                    question_id: question_id
                }
            }).then(async (qdata) => {
                if (qdata.user_id != result.id) {
                    return res.status(401).send({ message: "User is not authorized to perform this action" })
                }
                // await db.Answer.findOne({
                //     where: {
                //         question_id: question_id
                //     }
                // }).then(async (ans) => {
                //     if (ans != null) {
                //         res.status(400).send({ message: "This question contains answers, action cannot be performed!!" })
                //     }
                    else {
                        _id = require("sequelize").UUIDV4;
                        let categories = [];
                        if (keys.includes('categories')) {
                            for (let i = 0; i < req.body.categories.length; i++) {
                                let categ = req.body.categories[i]
                                categories.push(categ)
                                await db.Category.findOne({
                                    where: {
                                        category: categ.category.toString()
                                    }
                                })
                                    .then(async (data) => {
                                        if (!data) {
                                           await db.Category.create({ _id, category: categ.category.toString() })
                                        }
                                        else {
                                            
                                        }
                                    }).catch((err) => {
                                        logger.log({
                                            level:'error',
                                            message:err
                                        })
                                        //console.log("i am error", err)
                                        res.status(400).send({message:err})
                                    })

                            }
                        }
                        let dumb=[];
                        let update_question_start=new Date();
                                
                      //  console.log("categories.............")
                        await db.Question.findOne({
                            where: {
                                question_id: question_id
                            }
                        })
                            .then(async (data) => {
                               // console.log("here with data...", data)
                                for (let i = 0; i < categories.length; i++) {
                                    await db.Category.findOne({
                                        where: {
                                            category: categories[i].category
                                        }
                                    }).then(async categor =>{
                                        await dumb.push(categor);
                                    })
                                    //console.log("adding categories......", data)
                                   // data.addCategory(x)
                                    // db.Question.update({question_text:question_text},{where:{question_id:question_id}})


                                }
                                await data.addCategories(dumb);

                                
                                await db.Question.update({ question_text: question_text }, { where: { question_id: question_id } })

                              
                                

                            }).then(() => {
                             //   console.log("sending resp..")
                                let update_question_end=new Date();
                                let update_question_db_query_time = update_question_end.getMilliseconds()-update_question_start.getMilliseconds();
                                statsdClient.timing('update_question_db_query_time',update_question_db_query_time);
                                return res.status(204).send({ message: "Question has been updated successfully!!" })
                            }).catch((err) => {
                              //  console.log("I am error catch")
                              logger.log({
                                  level:'error',
                                  message:err
                              })
                                res.status(400).send({ err })
                            })
                    }
                }).catch((err) => {
                    console.log(err)
                    res.status(404).send({ message: "No content found!!" })
                })
            // })
        }
    })
    let put_question_end=new Date()
    let update_question_api_time = put_question_end.getMilliseconds()-put_question_start.getMilliseconds();
    statsdClient.timing('update_question_api_time',update_question_api_time);
                                

})


//2
question.delete('/:question_id', function (req, res, next) {
    logger.log({
        level:'info',
        message:'delete_question'
    })
    let delete_question_start=new Date()
    delete_question_counter+=1
    
    statsdClient.count("delete_question_counter",delete_question_counter)
    
    authenticate(req, res, function (err, result) {
        if (err || !result) {
            res.status(401).send({ message: "Not Authorized!" })
        }
        else {
            
            const question_id = req.params.question_id
            db.User.findOne({
                where: {
                    username: result.username
                }
            }).then((data) => {
                //console.log(data)
                console.log(data.user_id)
                if (data != null) {
                    db.Question.findOne({
                        where: {
                            question_id: question_id
                        }
                    }).then((data2) => {
                        console.log(data2)
                        if (data2 == null) {
                            res.status(404).send({ message: "Question not found!!" })
                        }
                        else {
                             console.log(data2.user_id,data.id)
                            if (data2.user_id == data.id) {
                                console.log("matched")
                                db.Answer.findOne({
                                    where: {
                                        question_id: data2.question_id
                                    }
                                }).then((data3) => {
                                    if (!data3) {
                                        let delete_question_query_start=new Date()
                                        db.Question.destroy({ where: { question_id: data2.question_id } }).then(() => {
                                            let delete_question_query_end=new Date()
                                            let delete_question_query_db_time=delete_question_query_start.getMilliseconds()-delete_question_query_end.getMilliseconds();
                                            statsdClient.timing('delete_question_query_db_time',delete_question_query_db_time);
                                            return res.status(204).send({ message: "Question deleted successfully!!" })
                                        }).catch((err) => {
                                            logger.log({
                                                level:'error',
                                                message:err
                                            })
                                            res.status(400).send({ message: "Question cannot be deleted" })
                                        })

                                    }
                                    else {
                                        return res.status(400).send({ message: "Question contains answer, cannot be deleted!!" })
                                    }
                                }).catch((err) => {
                                    logger.log({
                                        level:'error',
                                        message:err
                                    })
                                    res.status(400).send({ message: "Question cannot be deleted" })
                                })
                            }
                            else {
                                return res.status(401).send({ message: "User not authorized to delete the question" })

                            }
                        }
                    }).catch((err) => {
                        logger.log({
                            level:'error',
                            message:err
                        })
                        res.status(400).send({ message: "Question cannot be deleted" })
                    })
                }
                else {
                    res.status(404).send({ message: "User not found" })
                }
            })
        }
    })
    let delete_question_end=new Date()
    let delete_question_api_time = delete_question_end.getMilliseconds()-delete_question_start.getMilliseconds();
    statsdClient.timing('delete_question_api_time',delete_question_api_time);
    
})

//DELETE an answer----
//fine
//3
question.delete('/:question_id/answer/:answer_id', function (req, res, next) {
    logger.log({
        level:'info',
        message:'delete_answer'
    })
    let delete_answer_start=new Date()
    delete_answer_counter+=1
    statsdClient.count("delete_answer_counter",delete_answer_counter)
    
    authenticate(req, res, function (err, result) {
        if (err || !result) {
            res.status(401).send({ message: "Not Authorized!" })
        }
        else {
            const answer_id = req.params.answer_id;
            const question_id = req.params.question_id;
            const answer_text = req.body.answer_text;
            db.Question.findOne({
                where:{
                    question_id:question_id
                }
            }).then((data)=>{
                if(data){
                    db.Answer.findOne({
                        where: {
                            answer_id: answer_id,
                            question_id: question_id,
                            user_id: result.id
                        }
                    }).then((ans) => {
                        let delete_answer_query_start=new Date()
                        if (ans == null) {
                            return res.status(401).send({ message: "User is not authorized!!" })
                        }
                        db.Answer.destroy({ where: { answer_id: answer_id } })
                            .then(() => {
                                let delete_answer_query_end=new Date()
                                let delete_answer_query_db_time=delete_answer_query_end.getMilliseconds()-delete_answer_query_start.getMilliseconds();
                                statsdClient.timing('delete_answer_query_db_time',delete_answer_query_db_time)
                                const uu=db.User.findOne({
                                    where:{
                                        id:data.user_id
                                    }
                                }).then((user1)=>{
                                    const link='https://prod.kratika.me/v1/question/'+question_id;
                                    const messageLambda='{"answer_id":"' + answer_id + '","question_id":"' + question_id +'" ,"user_id":"' + ans.user_id + '","answer_text":"' + answer_text + '","link":"'+link+'","event":"Answer Deleted"}'
                                    
                                    
                                    const params = {
                                        Message: messageLambda,
                                        TopicArn: topicArn,
                                        Subject: user1.username
                                    };

                                    const abc=new aws.SNS({region:'us-east-1'}).publish(params).promise();
                                    abc
                                    .then((data)=>
                                        {
                                            console.log(data)
                                            console.log(messageLambda)
                                            console.log("Message sent");
                                        }).catch(
                                            function (err) {
                                                console.error(err, err.stack);
                                            });
                                    
                                        
                                res.status(204).send({ message: "Answer deleted successfully" })
                                })
                            }).catch((err) => {
                                logger.log({
                                    level:'error',
                                    message:err
                                })
                                res.status(400).send({ message: err })
                            })
        
                    }).catch((err) => {
                        logger.log({
                            level:'error',
                            message:err
                        })
                        res.status(400).send({ message: err })
                    })
                }
                else{
                    res.status(404).send({ message: "Question not found" })
                }
            })
            
        }
    })
    let delete_answer_end=new Date()
    let delete_answer_api_time = delete_answer_end.getMilliseconds()-delete_answer_start.getMilliseconds();
    statsdClient.timing('delete_answer_api_time',delete_answer_api_time);
})


//Update a question's answer---
//fine
//4
question.put('/:question_id/answer/:answer_id', function (req, res, next) {
    logger.log({
        level:'info',
        message:'update_answer'
    })
    let put_answer_start=new Date()
    put_answer_counter+=1
    statsdClient.count("put_answer_counter",put_answer_counter)
    
    authenticate(req, res, function (err, result) {
        if (err || !result) {
            res.status(401).send({ message: "Not Authorized!" })
        }
        else {
            const answer_id = req.params.answer_id;
            const question_id = req.params.question_id;
            const answer_text = req.body.answer_text;
            db.Question.findOne({
                where:{
                    question_id:question_id
                }
            }).then((data)=>{
                if(data){
                db.Answer.findOne({
                    where: {
                        answer_id: answer_id,
                        question_id: question_id,
                        user_id: result.id
                    }
                }).then((ans) => {
                    let update_answer_query_start=new Date()
                    if (!ans) {
                        return res.status(401).send({ message: "Answer ID with matching User ID and Question ID is not found, User not authorized!!" })
                    }
                    db.Answer.update({ answer_text: answer_text }, { where: { answer_id: answer_id } })
                        .then(() => {
                            let update_answer_query_end=new Date()
                            let update_answer_query_db_time=update_answer_query_end.getMilliseconds()-update_answer_query_start.getMilliseconds();
                            statsdClient.timing('update_answer_query_db_time',update_answer_query_db_time) 
                            const uu=db.User.findOne({
                                where:{
                                    id:data.user_id
                                }
                            }).then((user1)=>{
                            const link='https://prod.kratika.me/v1/question/'+question_id+'/answer/'+answer_id;
                    
                            const messageLambda='{"answer_id":"' + answer_id + '","question_id":"' + question_id +'" ,"user_id":"' + ans.user_id + '","answer_text":"' + answer_text + '","link":"'+link+'","event":"Answer Updated"}'
                            
                            
                            const params = {
                                Message: messageLambda,
                                TopicArn: topicArn,
                                Subject: user1.username
                            };
        
                            const abc=new aws.SNS({region:'us-east-1'}).publish(params).promise();
                            abc
                            .then((data)=>
                                 {
                                    console.log(data)
                                    console.log(messageLambda)
                                    console.log("Message sent");
                                }).catch(
                                    function (err) {
                                        console.error(err, err.stack);
                                    });
                            
           
                            
                            res.status(204).send({ message: "Answer updated successfully" })
                            })
                        }).catch((err) => {
                            logger.log({
                                level:'error',
                                message:err
                            })
                            res.status(400).send({ message: err })
                        })
                }).catch((err) => {
                    logger.log({
                        level:'error',
                        message:err
                    })
                    res.status(400).send({ message: err })
                })
            }
            else{
                res.status(404).send({message:"Question not found"})
            }
            })
            
        }
    })
    let put_answer_end=new Date()
    let put_answer_api_time = put_answer_end.getMilliseconds()-put_answer_start.getMilliseconds();
    statsdClient.timing('put_answer_api_time',put_answer_api_time);
})

//5
//fine
question.post('/:question_id/answer', async function (req, res, next) {
    logger.log({
        level:'info',
        message:'post_answer'
    })
    let post_answer_start=new Date()
    post_answer_counter+=1
    statsdClient.count("post_answer_counter",post_answer_counter)
    
    authenticate(req, res, async function (err, result) {
        if (err || !result) {
            res.status(401).send({ message: "Not Authorized!" })
        }
        else {
            const keys = Object.keys(req.body)
            if (!keys.includes("answer_text")) {
                res.status(400).send({ message: "Body must contain answer_text" })
            }
            question_id = req.params.question_id,
                _id = Sequelize.UUIDV4;
            answer_text = req.body.answer_text
            user_id = result.id
            const today = new Date()
            createdAt = today
            updatedAt = today
            let post_answer_query_start=new Date();
            await db.Question.findOne({
                where:{
                    question_id:question_id
                }
            }).then(async(data)=>{
                if(data){
                   // console.log("this is question/........",data)
                await db.Answer.create({ _id, question_id, createdAt, updatedAt, user_id, answer_text })
                .then((ans) => {
                    let post_answer_query_end=new Date();
                    let post_answer_query_db_time= post_answer_query_end.getMilliseconds()-post_answer_query_start.getMilliseconds();
                    statsdClient.timing('post_answer_query_db_time',post_answer_query_db_time)
                    const uu=db.User.findOne({
                        where:{
                            id:data.user_id
                        }
                    }).then((user1)=>{
                        //console.log("uu....",user1)
                    //})
                    
                    const link='https://prod.kratika.me/v1/question/'+question_id+'/answer/'+ans.answer_id;
                    const messageLambda='{"answer_id":"' + ans.answer_id + '","question_id":"' + ans.question_id +'" ,"user_id":"' + ans.user_id + '","answer_text":"' + ans.answer_text + '","link":"'+link+'","event":"Answer Posted"}'
                    
                
                    const params = {
                        Message: messageLambda,
                        TopicArn: topicArn,
                        Subject: user1.username
                    };

                    const abc=new aws.SNS({region:'us-east-1'}).publish(params).promise();
                    abc
                    .then((data)=>
                         {
                            console.log(data)
                            console.log(messageLambda)
                            console.log("Message sent");
                        }).catch(
                            function (err) {
                                console.error(err, err.stack);
                            });
                    
                    
                    const snd = '{"answer_id":"' + ans.answer_id + '","question_id":"' + ans.question_id + '","created_timestamp":"' + ans.createdAt + '","updated_timestamp":"' + ans.updatedAt + '","user_id":"' + ans.user_id + '","answer_text":"' + ans.answer_text + '"}'
                    res.status(201).send(ans)
                })
                }).catch((err) => {
                    logger.log({
                        level:'error',
                        message:err
                    })
                    res.status(400).send("err")
                })}
                else{
                    res.status(404).send({message:"Question not found!!"})
                }
            }).catch((err)=>{
                logger.log({
                    level:'error',
                    message:err
                })
                res.status(404).send({message:"Question not found!!"})
            })
            
        }
    })
    let post_answer_end=new Date()
    let post_answer_api_time = post_answer_end.getMilliseconds()-post_answer_start.getMilliseconds();
    statsdClient.timing('post_answer_api_time',post_answer_api_time);
})
//6
question.post('/', async function (req, res, next) {
    logger.log({
        level:'info',
        message:'post_question'
    })
    let post_question_start=new Date()
    post_question_counter+=1
    statsdClient.count("post_question_counter",post_question_counter)
    
    authenticate(req, res, async function (err, result) {
        if (err || !result) {
            return res.status(401).send({ message: "Not Authorized!" })
        }
        else {
            let keys = Object.keys(req.body)
            if (!keys.includes("question_text")) {
                return res.status(400).send({ message: "Body must contain question_text" })
            }
            let _id=require("sequelize").UUIDV4;
            console.log(_id)
            let user_id = result.id;
            let question_text = req.body.question_text;
            let today = new Date()
            let createdAt = today
            let updatedAt = today
            let categories = [] //c
            if (keys.includes('categories')) {
                for (let i = 0; i < req.body.categories.length; i++) {
                    let categ = req.body.categories[i] // c
                    categories.push(categ)
                    //console.log(categ.category)
                    // console.log(req.body.categories[i])
                    let post_question_query_start=new Date()
                    await db.Category.findOne({
                        where: {
                            category: categ.category.toString()
                        }
                    })
                        .then(async (data) => {
                            //console.log("fghjdgdhsdghsdgrhdgrhdrtghdrxt",data)
                            if (!data) {
 
                                await db.Category.create({ _id, category: categ.category.toString() })
                                let post_question_query_end=new Date();
                                let post_question_query_db_time= post_question_query_end.getMilliseconds()-post_question_query_start.getMilliseconds();
                                statsdClient.timing('post_question_query_db_time',post_question_query_db_time)
                            }
                        }).catch((err) => {
                            logger.log({
                                level:'error',
                                message:err
                            })
                            console.log("i am error", err)
                        })
                }
            }
            //_id = require('sequelize').UUIDV4;
            let dumb = [];
            _id = Sequelize.UUIDV4;
            await db.Question.create({ _id, user_id: user_id, question_text: question_text, created_timestamp: createdAt, updated_timestamp: updatedAt })
                .then(async (data) => {
                    for (let i = 0; i < categories.length; i++) {
                        await db.Category.findOne({
                            where: {
                                category: categories[i].category
                            }
                        }).then(async categor => {
                            await dumb.push(categor);
                            console.log(categor);
                        } )
                        //await data.addCategory(x)
                        //let msg = '{"category_id":"' + x.category_id + '","category":"' + x.category + '"}';
                        //dumb.push(msg)
                        console.log("dumb", dumb)
                    }
                        await data.addCategories(dumb);
                    //res.status(200).send(data)   
                    await db.Question.findOne({
                        where: {
                            question_id: data.question_id

                        }
                    }).then((a) => {
                        //console.log("question_id", a.question_id)
                        //let snd = '{"question_id":"' + a.question_id + '","created_timestamp":"' + a.createdAt + '","updated_timestamp":"' + a.updatedAt + '","user_id":"' + a.user_id + '","question_text":"' + a.question_text + '","categories":[' + dumb.toString() + ']}';
                        res.status(201).json(
                            {
                                "question_id":  a.question_id ,"created_timestamp": a.createdAt ,"updated_timestamp":a.updatedAt ,"user_id": a.user_id ,"question_text": a.question_text ,"categories": dumb
                            }
                        )
                    })
                }).catch((err) => {
                    logger.log({
                        level:'error',
                        message:err
                    })
                    res.status(400).send(err)
                })

        }
    })
    let post_question_end=new Date()
    let post_question_api_time = post_question_end.getMilliseconds()-post_question_start.getMilliseconds();
    statsdClient.timing('post_question_api_time',post_question_api_time);
})

//7
question.get('/:question_id', async function (req, res, next) {
    logger.log({
        level:'info',
        message:'get_question'
    })
    let get_question_start=new Date()
    get_question_counter+=1
    statsdClient.count("get_question_counter",get_question_counter)
    
    const question_id = req.params.question_id;
    let get_question_query_start=new Date()
                    
    const q = await db.Question.findAll({
        where: {
            question_id: question_id
        },
        include: ['answers', 'categories', 'files'],
    }).then((question) => {
        if (question.length != 0) {
            let get_question_query_end=new Date()
            let get_question_db_query_time = get_question_query_end.getMilliseconds()-get_question_query_start.getMilliseconds();
            statsdClient.timing('get_question_db_query_time',get_question_db_query_time);
            res.status(200).send(question)
        }
        else {
            res.status(404).send({ message: "No question found with the given id" })
        }
    }).catch((err) => {
        logger.log({
            level:'error',
            message:err
        })
        res.status(400).send(err)
    })
    let get_question_end=new Date()
    let get_question_api_time = get_question_end.getMilliseconds()-get_question_start.getMilliseconds();
    statsdClient.timing('get_question_api_time',get_question_api_time);
})


//8
question.get('/:question_id/answer/:answer_id', async function (req, res, next) {
    logger.log({
        level:'info',
        message:'get_answer'
    })
    let get_answer_start=new Date()
    get_answer_counter+=1
    statsdClient.count("get_answer_counter",get_answer_counter)
   // console.log("heyyyyyyyyyyy")
    const question_id = req.params.question_id;
    const answer_id = req.params.answer_id;
    // let get_answer_end=new Date()
    console.log(question_id)
    let get_answer_query_start=new Date()
    const k=await db.Answer.findOne({
        where: {
            answer_id: answer_id,
            question_id: question_id
        },
        //include: ['files'],
    }).then((ans) => {
       // console.log("ans....",ans.length)
        if (ans) {
            console.log("here....")
            const snd = '{"answer_id":"' + ans.answer_id + '","question_id":"' + ans.question_id + '","created_timestamp":"' + ans.createdAt + '","updated_timestamp":"' + ans.updatedAt + '","user_id":"' + ans.user_id + '","answer_text":"' + ans.answer_text + '"}';
            console.log(snd)
            //res.status(200).send(snd)
            let get_answer_query_end=new Date()
            //console.log("1")
            let get_answer_query_api_time = get_answer_query_end.getMilliseconds()-get_answer_query_start.getMilliseconds();
            //console.log("2")
            statsdClient.timing('get_answer_api_time',get_answer_query_api_time);
            res.status(200).send(snd)
        }
        else {
            console.log("hi")
            res.status(404).send({ message: "No Answers Found!!" })
        }
    }).catch((err) => {
        logger.log({
            level:'error',
            message:err
        })
        res.status(404).send({ message: "No answers found!!" })
    })
    let get_answer_end=new Date()
    let get_answer_api_time = get_answer_end.getMilliseconds()-get_answer_start.getMilliseconds();
    statsdClient.timing('get_answer_api_time',get_answer_api_time);

});

//9
question.post('/:question_id/file', async function(req,res)  {
    logger.log({
        level:'info',
        message:'post_question_file'
    })
    let post_question_file_start=new Date()
    post_question_file_counter+=1
    statsdClient.count("post_question_file_counter",post_question_file_counter)
    
    console.log(process.env.WEBAPP_S3_BUCKET)
    authenticate(req, res, async function (err, result) {
        if (err || !result) {
            return res.status(401).send({ message: "Not Authorized!" })
        }
    question_id=req.params.question_id
    db.Question.findByPk(question_id)
    .then(async ques =>{
        if(ques){
            if(ques.user_id == result.id){
                let filepath;
                let filename;
                let id= uuid.v4()
                let post_question_file_query_start=new Date()
                let post_question_file_s3_start=new Date()
                
                let upload = await multer({
                    storage: multerS3({
                        s3: awss3,
                        acl: 'public-read',
                        bucket: process.env.WEBAPP_S3_BUCKET,
                        key: function (req, file, cb){
                            filename= id+ file.originalname;
                            filepath= ques.question_id+'/'+id+'/'+filename;
                            cb(null,filepath);
                        }
                    }),
                    fileFilter: fileFilter,
                }).single('image');

                await upload(req,res, async (err)=>{
                    if(err){
                        
                        res.status(500).send(err)
                    }
                    else{
                        let post_question_file_s3_end=new Date()
                        let post_question_file_s3_time = post_question_file_s3_end.getMilliseconds()-post_question_file_s3_start.getMilliseconds();
                        statsdClient.timing('post_question_file_s3_time',post_question_file_s3_time);
                                
                        if(req.file){
                            console.log(id)
                            await db.File.create({ 'file_name': filename, 's3_object_name': filepath, 'original_filename': "req.file.originalname", 'encoding': "req.file.encoding.toString()", 'mimetype': "req.file.mimetype.toString()", 'content-length': "req.file.size.toString()", 'file_id': id, "created_date":"date","user_id":result.id,"question_id":question_id})
                            .then(async (newFile) =>{
                                console.log("3")
                                let post_question_file_query_end=new Date()
                                let post_question_file_query_api_time = post_question_file_query_end.getMilliseconds()-post_question_file_query_start.getMilliseconds();
                                statsdClient.timing('post_question_file_api_time',post_question_file_query_api_time);
                                res.status(201).send(newFile)
                            }).catch(async err =>{
                                logger.log({
                                    level:'error',
                                    message:err
                                })
                                await awss3.deleteObject({
                                    Bucket: process.env.BUCKET,
                                    Key: filepath
                                }, function (err, data) { })
                                console.log(err.message); res.sendStatus(500); return;
                            });
                        }
                        else{
                            res.status(400).send("Invalid Image"); return;
                        }
                        return;
                    }
                });

            }
            else{
                res.status(401).send("User not authorized"); return;
            }
        }
        else{
            res.status(401).send("Question not found"); return;
            
        }
    })
    .catch(err=>{
        logger.log({
            level:'error',
            message:err
        })
        console.log(err.message);
        res.sendStatus(500);return;
    })

})
    let post_question_file_end=new Date()
    let post_question_file_api_time = post_question_file_end.getMilliseconds()-post_question_file_start.getMilliseconds();
    statsdClient.timing('post_question_file_api_time',post_question_file_api_time);
})
//10
//delete file for a question
question.delete('/:question_id/file/:file_id', (req, res) => {
    logger.log({
        level:'info',
        message:'delete_question_file'
    })
    let delete_question_file_start=new Date()
    delete_question_file_counter+=1
    statsdClient.count("delete_question_file_counter",delete_question_file_counter)
    
    authenticate(req, res, async function (err, result) {
        if (err || !result) {
            return res.status(401).send({ message: "Not Authorized!" })
        }
        let question_id=req.params.question_id
        let file_id = req.params.file_id
        db.Question.findByPk(question_id)
        .then(ques =>{
            console.log(ques)
            if(ques){
                let delete_question_file_query_start=new Date();
                db.File.findByPk(file_id).then(file =>{
                    if(file){
                        console.log(result.id)
                        file.getUser().then(async usr =>{
                            if(usr.id == result.id){
                                
                                console.log(process.env.BUCKET);
                                let delete_question_file_s3_start=new Date();
                                await awss3.deleteObject({
                                    
                                    Bucket : process.env.WEBAPP_S3_BUCKET,
                                    Key : file.s3_object_name
                                }, function(err, data){
                                    if(err) {
                                        logger.log({
                                            level:'error',
                                            message:err
                                        })
                                        console.log(err); res.status(500).send("Unable to connect"); 
                                        return
                                    }
                                    else{
                                        file.destroy();
                                        let delete_question_file_query_end=new Date()
                                        let delete_question_file_query_api_time = delete_question_file_query_end.getMilliseconds()-delete_question_file_query_start.getMilliseconds();
                                        let delete_question_file_s3_time = delete_question_file_query_end.getMilliseconds()-delete_question_file_s3_start.getMilliseconds();
                                        
                                        statsdClient.timing('delete_question_file_api_time',delete_question_file_query_api_time);
                                        statsdClient.timing('delete_question_file_s3_time',delete_question_file_s3_time);
                                        return res.sendStatus(204);
                                    }
                                })
                            }
                            else{
                                return res.status(401).send("Not Authorized")
                            }
                        }).catch(err =>{
                            logger.log({
                                level:'error',
                                message:err
                            })
                            console.log(err.message);
                            res.sendStatus(500);
                            return;
                        })
                    }
                    else{
                        return res.status(404).send("Invalid file id")
                    }
                }).catch(err =>{
                    logger.log({
                        level:'error',
                        message:err
                    })
                    console.log(err.message);
                            res.sendStatus(500);
                            return;
                })
            }
            else{
                return res.status(404).send("Invalid question id")
            }
        }).catch(err=>{
            logger.log({
                level:'error',
                message:err
            })
            console.log(err.message);
            res.sendStatus(500);
            return;
        })

    });
    let delete_question_file_end=new Date()
    let delete_question_file_api_time = delete_question_file_end.getMilliseconds()-delete_question_file_start.getMilliseconds();
    statsdClient.timing('delete_question_file_api_time',delete_question_file_api_time);
})



//post a file for an answer
//11
question.post('/:question_id/answer/:answer_id/file', async(req,res)=>{
    logger.log({
        level:'info',
        message:'post_answer_file'
    })
    let post_answer_file_start=new Date()
    post_answer_file_counter+=1
    statsdClient.count("post_answer_file_counter",post_answer_file_counter)
    
    authenticate(req, res, async function (err, result) {
        if (err || !result) {
            return res.status(401).send({ message: "Not Authorized!" })
        }
        question_id=req.params.question_id
        answer_id=req.params.answer_id
        db.Question.findByPk(question_id)
        .then(async ques =>{
            if(ques){
                let filepath;
                let filename;
                let id = uuid.v4();
                let post_answer_file_query_start=new Date();
                db.Answer.findByPk(answer_id).then(async ans =>{
                    if(ans && ans.question_id == ques.question_id){
                        if(ans.user_id== result.id){
                            let post_answer_file_s3_start=new Date();
                            let upload = await multer({
                                storage: multerS3({
                                    s3: awss3,
                                    acl: 'public-read',
                                    bucket : process.env.WEBAPP_S3_BUCKET,
                                    key : function(req, file, cb){
                                        filename = id + file.originalname;
                                        filepath = question_id +'/' + answer_id+'/'+result.id+'/'+filename;
                                        cb(null, filepath);
                                    }
                                }),
                                fileFilter: fileFilter,
                            }).single('image');
                            await upload(req, res, async(err)=>{
                                if(err){res.status(500).send(err);}
                                else{
                                    if(req.file){
                                        let post_answer_file_s3_end=new Date()
                                        let post_answer_file_s3_time = post_answer_file_s3_end.getMilliseconds()-post_answer_file_s3_start.getMilliseconds();
                                        statsdClient.timing('post_answer_file_s3_time',post_answer_file_s3_time);
                                
                                        await db.File.create({'file_name':filename, 's3_object_name':filepath, 'original_filename': "req.file.originalname", 'encoding': "req.file.encoding.toString()", 'mimetype': "req.file.mimetype.toString()", 'content-length': "req.file.size.toString()", 'file_id': id, "created_date":"date","user_id":result.id,"question_id":question_id})
                                        .then(async newFile =>{
                                            let post_answer_file_query_end=new Date()
                                            let post_answer_file_query_api_time = post_answer_file_query_end.getMilliseconds()-post_answer_file_query_start.getMilliseconds();
                                            statsdClient.timing('post_answer_file_api_time',post_answer_file_query_api_time);
                                
                                            res.status(201).send(newFile);
                                        }).catch(async err =>{
                                            logger.log({
                                                level:'error',
                                                message:err
                                            })
                                            await awss3.deleteObject({
                                                Bucket : process.env.WEBAPP_S3_BUCKET,
                                                Key : filepath
                                            }, function(err, data){})
                                            console.log(err.message); res.sendStatus(500); return;
                                        });
                                    }
                                    else{
                                        res.status(401).send("Invalid Image"); return;
                                    }
                                    return;
                                    
                                }
                                
                            })
                        }
                        else{
                            res.status(401).send("Unauthorized"); return;
                        }
                    }
                    else{
                        res.status(401).send("Answer not found"); return;
                    }
                }).catch(err=>{
                    logger.log({
                        level:'error',
                        message:err
                    })
                    console.log(err.message); res.sendStatus(500); return;
                })
            }
            else{
                res.status(401).send("Question not found"); return;
            }
        }).catch(err=>{
            logger.log({
                level:'error',
                message:err
            })
            console.log(err.message); res.sendStatus(500); return;
        })
    })
    let post_answer_file_end=new Date()
    let post_answer_file_api_time = post_answer_file_end.getMilliseconds()-post_answer_file_start.getMilliseconds();
    statsdClient.timing('post_answer_file_api_time',post_answer_file_api_time);
})
//12
//delete a file for an answer
question.delete('/:question_id/answer/:answer_id/file/:file_id', (req,res)=>{
    logger.log({
        level:'info',
        message:'delete_answer_file'
    })
    let delete_answer_file_start=new Date()
    delete_answer_file_counter +=1
    statsdClient.count("delete_answer_file_counter",delete_answer_file_counter)
    
    authenticate(req, res, async function (err, result) {
        if (err || !result) {
            return res.status(401).send({ message: "Not Authorized!" })
        }
        let question_id=req.params.question_id;
        let answer_id=req.params.answer_id;
        let file_id= req.params.file_id

        db.Question.findByPk(question_id)
        .then(ques=>{
            if(ques){
                db.Answer.findByPk(answer_id)
                .then(ans =>{
                    if (ans && ans.question_id ==ques.question_id){
                        db.File.findByPk(file_id).then(file =>{
                            if(file){
                                let delete_answer_file_query_start=new Date();
                                file.getUser().then(async usr =>{
                                    if(usr.id==result.id){
                                        let delete_answer_file_s3_start=new Date()
                                        await awss3.deleteObject ({
                                            Bucket : process.env.WEBAPP_S3_BUCKET,
                                            Key : file.s3_object_name
                                        }, function(err, data){
                                            if(err){
                                                logger.log({
                                                    level:'error',
                                                    message:err
                                                })
                                                console.log(err);
                                                res.status(500).send("Unable to connect to bucket...")
                                            }
                                            else{
                                                file.destroy();
                                                let delete_answer_file_query_end=new Date()
                                                let delete_answer_file_query_api_time = delete_answer_file_query_end.getMilliseconds()-delete_answer_file_query_start.getMilliseconds();
                                                let delete_answer_file_s3_time = delete_answer_file_query_end.getMilliseconds()-delete_answer_file_s3_start.getMilliseconds();
                                                
                                                statsdClient.timing('delete_answer_file_s3_time',delete_answer_file_s3_time);
                                                statsdClient.timing('delete_answer_file_api_time',delete_answer_file_query_api_time);
                                
                                                return res.sendStatus(204);
                                            }
                                        })
                                    }
                                    else{
                                        return res.status(401).send("Not authorized")
                                    }
                                }).catch(err=>{
                                    logger.log({
                                        level:'error',
                                        message:err
                                    })
                                    console.log(err.message)
                                    res.sendStatus(500); 
                                    return;
                                })
                            }
                            else{
                                return res.status(404).send("File not found")
                            }
                        }).catch(err=>{
                            logger.log({
                                level:'error',
                                message:err
                            })
                            console.log(err.message)
                            res.sendStatus(500); 
                            return;
                        })
                    }
                    else{
                        return res.status(404).send("answer not found")
                    }
                }).catch(err=>{
                    logger.log({
                        level:'error',
                        message:err
                    })
                    res.status(404).send("Invalid answer id")
                })
            }
            else{
                return res.status(404).send("Invalid question id")
            }
        }).catch(err=>{
            logger.log({
                level:'error',
                message:err
            })
            console.log(err.message)
            res.sendStatus(500); 
            return;
        })

    })
    let delete_answer_file_end=new Date()
    let delete_answer_file_api_time = delete_answer_file_end.getMilliseconds()-delete_answer_file_start.getMilliseconds();
    statsdClient.timing('delete_answer_file_api_time',delete_answer_file_api_time);
})




module.exports = question;