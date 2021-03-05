// const { should } = require('should');
// const chai=require('chai');
// const chaiHttp=require("chai-http");
// const { response } = require('express');
//const app=require('../app');
const validator=require('email-validator')
const passwordValidator=require('password-validator');
// var expect=chai.expect;
// chai.use(chaiHttp);
//console.log(app)


describe('Testing',()=>{
    
    describe('',()=>{
        it('',(done) =>{
            validator.validate('abc@sbn.com');
            done();
        })
    })
    describe('',()=>{
        it('',(done)=>{
            const val=new passwordValidator();
            val
            .is().min(8)
            .is().max(64)
            .has().uppercase()
            .has().lowercase()
            .has().not().spaces()
            .has().digits(1)
            val.validate('A1dsfv$hs67');
            done();
        })
    })
})