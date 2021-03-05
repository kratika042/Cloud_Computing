// module.exports=async()=>{
// const User=require('../models/User')
// const Question=require('../models/Question')
// const Answer=require('../models/Answer')
// User.hasMany(Question,{as:"ques",foreignKey:"user_id"});
// Question.belongsTo(User,{as:"user",foreignKey:"user_id"})
// Question.hasMany(Answer,{as:"ans", foreignKey:"question_id"})
// Answer.belongsTo(Question,{foreignKey:"question_id"})
// Answer.belongsTo(User,{foreignKey:"user_id"})

// // // const q= Question.findAll({
// // //       where:{question_id:"bb56eb88-e2df-43ee-b6b5-bf5e885a1646"},
// // //       include: ['ans'],
// // //     }).then((questions) => {
// // //       console.log(questions);
// // //     });
// // //     console.log(q)
// const user=await User.create({
//     first_name:"krati",
//     last_name: "abc",
//     username: "def@gmail.com",
//     password:"1234"
// }).catch((err)=>{
//     console.log(err)
// })

// // // const question=await Question.create({
// // //     question_text: "This is my question!!",
// // //     user_id: user.id

// // // }).catch((err)=>{
// // //     console.log(err)
// // // })
// const answer=await Answer.create({
//     answer_text:"I am answer 2",
//     user_id:user.id,
//     question_id:"bb56eb88-e2df-43ee-b6b5-bf5e885a1646"
// }).catch((err)=>{
//     console.log(err)
// })
// // // const users=await User.findAll({
// // //     where: {
// // //         username: "abc@gmail.com"
// // //     },
// // //     include :[{model: Question, as:"ques"}]
// // // }).catch((err)=>{
// // //     console.log(err)
// // // })
// // // console.log("im here")
// // // console.log(users);
//  }