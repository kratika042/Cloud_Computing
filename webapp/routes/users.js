const express = require('express');
const user=express.Router();
const bcrypt=require('bcrypt-nodejs');
const schema= require('../src/validator');
const { v4: uuidv4 } = require('uuid');
//const sequelize=require('../src/database/connection')
const db = require('../models');
const emailValidator=require('email-validator');
const { Sequelize } = require('../models');
// router.get('/', (req,res) => res.send("heyy"));
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
let post_user_counter=0
let get_user_id_counter=0
let update_user_counter=0
let get_user_counter=0

const User=require('../models/User')
const Question=require('../models/Question')
const Answer=require('../models/Answer')
const Category=require('../models/Category');
const File =require('../models/File')
const e = require('express');
User.hasMany(Question,{as:"ques",foreignKey:"user_id"});
Question.belongsTo(User,{as:"user",foreignKey:"user_id"})
Question.hasMany(Answer,{as:"answers", foreignKey:"question_id"})
Answer.belongsTo(Question,{foreignKey:"question_id"})
Answer.belongsTo(User,{foreignKey:"user_id"});
Category.belongsToMany(Question,{as:"question",through:"question_category",foreignKey:"category_id"})
Question.belongsToMany(Category,{as:"categories",through:"question_category", foreignKey:"question_id"});
Question.hasMany(File,{as: "files", foreignKey:"question_id"})
File.belongsTo(Question,{foreignKey:"question_id"})
Answer.hasMany(File, {as:"files",foreignKey:"answer_id"})
File.belongsTo(Answer,{foreignKey:"answer_id"})
User.hasMany(File,{as:"files",foreignKey:"user_id"})
File.belongsTo(User,{foreignKey:"user_id"})

sequelize.sync();



authenticate= function(req,res,cb){
    console.log("1")
    if (!req.headers.authorization || req.headers.authorization.indexOf('Basic ') === -1) {
        return res.status(401).json({ message: 'Missing Basic Authorization Header' });
    }
    const authorization= req.headers.authorization;
    const user=authorization.split(' ')[1];
    const plaintext=Buffer.from(user,'base64').toString('ascii');
    const username= plaintext.split(':')[0]
    
    const password= plaintext.split(':')[1]
    if(!username || !password){
        return res.status(401).send({message:"Please provide username and password!"});
    }
    db.User.findOne({
        where:{
            username:username
        }
    })
    .then((data)=>{
        if(data==null){
            console.log("2")
            res.status(400).send({message:"User not found!"});
        }
        else{
            console.log("3")
        comparePassword(password,data.password, function(err, ismatch){
            if(err || !ismatch){
                //console.log("Not matched!!")
                return res.status(400).send({message:"Incorrect password!!"});
            }
            else{
                console.log("4")
                return cb(null,data);
            }
        });
    }
})
};
comparePassword= function(sentpassword,hashedpassword,cb){
    bcrypt.compare(sentpassword,hashedpassword,function(err, ismatch){
        if(err){
            return cb(err);
        }
        return cb(null,ismatch);
    });
};

//1
user.post('/user/', function(req,res,next){
    logger.log({
        level:'info',
        message:'creating_new_user'
    })
    let post_user_api_start=new Date()
    post_user_counter +=1
    statsdClient.count("post_user_counter",post_user_counter)
    
    const today=new Date()
    const today2=Sequelize.NOW;
    _id= uuidv4();
    console.log(_id)
    first_name = req.body.first_name,
    last_name = req.body.last_name,
    username = req.body.username,
    password = req.body.password,
    createdAt = today,
    updatedAt = today

    if(!first_name || !last_name || !username || !password || Object.keys(req.body).length!=4){
        res.status(400).send({message:"Invalid Request, check parameters!"});
    }
    const chk=db.User.findAll({
        where:{
            username:username
        }
    }).then((data)=>{
        
        if(data.length!=0){
            res.status(400).send({message:"User already exists!!"})
        }else{
            
            if(! emailValidator.validate(username)){
                return res.status(400).send({message:"Invalid username!!"})
            }
            else{
            if(schema.validate(password)){
            var salt = bcrypt.genSaltSync(2);
            const hash=bcrypt.hashSync(password,salt,null, function(err,hash){
                if (err){
                    throw err;
                }
                password=hash;
            });
            let post_user_query_start=new Date()
    
            db.User.create({_id,first_name,last_name,username,password:hash,createdAt,updatedAt})
            .then((data) =>{
                let post_user_query_end=new Date()
                let post_user_query_time = post_user_query_end.getMilliseconds()-post_user_query_start.getMilliseconds();
                statsdClient.timing('post_user_query_time',post_user_query_time) 
                const msg='{"_id":"'+data.id+'","first_name":"'+data.first_name+'","last_name":"'+data.last_name+'","username":"'+data.username+'","account_created":"'+data.createdAt+'","account_updated":"'+data.updatedAt+'"}'
                res.status(201).send(msg);
            })
            .catch((err)=>{
                 res.status(400).send({ message: err });
            });   
        }
        else{
            res.status(400).send({message:"Bad password!!"})
        }
    }
    }
    }).catch((err)=>{
        res.status(400).send(err)
    })
    let post_user_api_end=new Date()
    let post_user_api_time = post_user_api_end.getMilliseconds()-post_user_api_start.getMilliseconds();
    statsdClient.timing('post_user_api_time',post_user_api_time) 
});


user.get('/user/self',async function(req, res, next){
    logger.log({
        level:'info',
        message:'get_user'
    })
    let get_user_api_start=new Date()
    get_user_counter+=1
    statsdClient.count("get_user_counter",get_user_counter)
    let get_user_query_start=new Date()
    
    authenticate(req,res,function(err,result){
        if(err || !result){
            res.status(401).send({message:"Not Authorized!"})
        }        else{
                let get_user_query_end=new Date()
                let get_user_query_time =get_user_query_end.getMilliseconds()-get_user_query_start.getMilliseconds();
                statsdClient.timing('get_user_query_time',get_user_query_time)
               // console.log("Matched!!")
                const msg='{"_id":"'+result.id+'","first_name":"'+result.first_name+'","last_name":"'+result.last_name+'","username":"'+result.username+'","account_created":"'+result.createdAt+'","account_updated":"'+result.updatedAt+'"}'
                return res.status(200).send(msg)
            }
        })
        let get_user_api_end=new Date()
        let get_user_api_time =get_user_api_end.getMilliseconds()-get_user_api_start.getMilliseconds();
        statsdClient.timing('get_user_api_time',get_user_api_time)
    })
   
user.get('/user/:id',function(req,res,next){
    logger.log({
        level:'info',
        message:'get_user_with_id'
    })
    let get_user_id_api_start=new Date()
    get_user_id_counter+=1
    statsdClient.count("get_user_id_counter",get_user_id_counter)
    
    const userId=req.params.id;
    let get_user_id_query_start=new Date()
    const user=User.findOne({
        where:{
            id:userId
        }
    }).then((data)=>{
        if(data.length!=0){
            let get_user_id_query_end=new Date()
            let get_user_id_query_time= get_user_id_query_end.getMilliseconds()-get_user_id_query_start.getMilliseconds()
            statsdClient.timing('get_user_id_query_time',get_user_id_query_time)
            const msg='{"id":"'+data.id+'","first_name":"'+data.first_name+'","last_name":"'+data.last_name+'","username":"'+data.username+'","account_created":"'+data.createdAt+'","account_updated":"'+data.updatedAt+'"}'
                    
            return res.status(200).send(msg)
        }
        else{
            return res.status(404).send({message:"Not found!!"})
        }
    }).catch((err)=>{
        return res.status(404).send({message:"Not found!!"})
    })
    let get_user_id_api_end=new Date()
    let get_user_id_api_time= get_user_id_api_end.getMilliseconds()-get_user_id_api_start.getMilliseconds()
    statsdClient.timing('get_user_id_api_time',get_user_id_api_time)
})

user.put('/user/self', async function(req, res, next){
    logger.log({
        level:'info',
        message :'update_user'
    })
    let update_user_api_start=new Date()
    update_user_counter+=1
    statsdClient.count("update_user_counter",update_user_counter)
    
    authenticate(req,res,function(err,result){
        if(err || !result){
            res.status(401).send({message:"Not Authorized!"})
        }
                else{
                    const options= {new:true}
                    const keys=Object.keys(req.body)
                    if(keys.includes("username") || keys.includes("account_updated") || keys.includes("account_created")){
                        res.status(400).send({message:"Check parameters, Cannot update"})
                    }  
                    if(!keys.includes("first_name") || !keys.includes("last_name") || !keys.includes("password")){
                        res.status(400).send({message:"Check parameters, Must contain first_name, last_name and password"})
                    }
                    const password=req.body.password;
                    const first_name=req.body.first_name;
                    const last_name=req.body.last_name;
                    if(schema.validate(password)){
                        var salt = bcrypt.genSaltSync(2);
                        let hash=bcrypt.hashSync(password,salt,null, function(err,hash){
                            if (err){
                                throw err;
                            }
                            password=hash;
                        });
                        let update_user_query_start=new Date()
                        db.User.update({first_name:first_name,last_name:last_name,password:hash},
                            { where:
                            {
                                username:result.username
                            } },options)
                    }
                    
             
                
                    const data=db.User.findOne({
                        where: {
                            username:result.username
                        }               
                    })
                    .then((data)=>{
                        let update_user_query_end=new Date()
                        let update_user_query_time = update_user_query_end.getMilliseconds()-update_user_query_start.getMilliseconds()
                        statsdClient.timing('update_user_query_time',update_user_query_time)                    
                        res.status(200).send({message:"User info updated successfully!"})
                       
                }).catch((err)=>{
                    return res.status(400).send(err)
                })
            }
    })
    let update_user_api_end=new Date()
    let update_user_api_time = update_user_api_end.getMilliseconds()-update_user_api_start.getMilliseconds()
    statsdClient.timing('update_user_api_time',update_user_api_time)
});

module.exports= user;