const Sequelize=require('sequelize');
const sequelize=new Sequelize(process.env.DATABASE_NAME,process.env.DATABASE_USERNAME,process.env.DATABASE_PASSWORD,{host:process.env.DATABASE_HOSTNAME, dialect:"mysql",
//const sequelize=new Sequelize('webapp2','root','Kratika@123',{host:'localhost',dialect:"mysql",

dialectOptions:{
    dateStrings:true,
    useUTC: true,
    // typeCast: function (field, next) { // for reading from database
    //     if (field.type === 'DATETIME') {
    //       return field.string()
    //     }
    //       return next()
    //     },
},timezone: '-08:00'
})

module.exports= sequelize;
global.sequelize=sequelize;