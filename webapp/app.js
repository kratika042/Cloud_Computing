const express=require('express');
const path = require('path')
require('dotenv').config({path:'.env'})
const bodyParser=require('body-parser');
const sequelize=require('./src/database/connection')
const app=express();
app.get('/', (req,res) => res.send("Hello"));
const PORT = 5002;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
  }));
app.use(express.json());

console.log(process.env.DATABASE_NAME)
app.listen(PORT, console.log(`Server started on port: ${PORT}`));
app.use(function(req, res, next) {
  res.setHeader("Content-Type", "application/json");
  next();
});
//TEST DATABASE
sequelize.authenticate()
.then(() => console.log('Database connected'))
.catch(err => console.log('Error: '+err))


//require('./src/associations')();
//User Routes
app.use('/v1',require('./routes/users'));
app.use('/v1/question',require('./routes/questions'));
app.use('/v1',require('./routes/allquestions'));
// require("./src/database/connection");
//require("./src/database/connection");
module.exports=app;