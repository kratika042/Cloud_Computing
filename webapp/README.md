# webapp
Dependencies and installations-
1. npm install express sequelize sequelize-cli mysql2 bcrypt email-validator password-validator body-parser

2. Port is set to 5001
3. API for GET request: 
localhost:5001/v1/user/self
Basic Authentication is needed (provide username and password)

4. API for POST request:
localhost:5001/v1/user/
Request Header should be like this-

{"first_name":"kratika",
"last_name":"maheshwari",
"username":"abc@a.il",
"password":"1aA2@634"
}

5. API for PUT request:
localhost:5001/v1/uer/self
Basic Authentication is needed (provide username and password)
Request Header should be like this-

{"first_name":"kratikaa",
"last_name":"maheshwari",
"password":"1aA2@6346"
}
6. APIs for Questions/Answers/Files

7. npm run dev
8. npm run test

SNS is triggered in case of-
1. Answer posted
2. Answer updated
3. Answer Deleted

