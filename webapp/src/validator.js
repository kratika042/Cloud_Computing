const passwordValidator=require('password-validator');

const schema = new passwordValidator();
schema
.is().min(8)                                    
.is().max(64)                                  
.has().uppercase()                              
.has().lowercase()                              
.has().digits()                                
.has().not().spaces()                  

module.exports=schema;