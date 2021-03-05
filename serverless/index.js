
const aws = require("aws-sdk");
var ses = new aws.SES();

var docClient = new aws.DynamoDB.DocumentClient();
exports.handler = (event, context) => {
    
    console.log(event.Records[0].Sns.Message);
    let messagedata=event.Records[0].Sns.Message;
    let messagedata1=JSON.parse(messagedata);
    let a_id=messagedata1.answer_id;
    let eventType=messagedata1.event;
    let subject=a_id+"_"+eventType;
    let username=event.Records[0].Sns.Subject;
    //let messagedata=JSON.parse(messagedata)
   // messagedata=messagedata.replace("\\","")
   // const username="maheshwari.kr@northeastern.edu";
    const sender = "maheshwarikratika2+prod@gmail.com"
    console.log(messagedata)
    
    var params1 = {
    TableName: 'csye6225',
    Key: {
    'id': messagedata
    
  },
    };
    docClient.get(params1,function(err,data){
        if(err || data.Item==undefined){
            console.log(err)
                
            var params2 = {
            TableName: 'csye6225',
            Item: {
            'id': messagedata
            
          },
            }
            docClient.put(params2, function (err, data) {
        
                if (err) {
                   // console.log((err))
                    console.error("Unable to add record in DB");
                    //return err;
                } else {
                    var params = {
                        Destination: { /* required */
                            // CcAddresses: [
                            //   'EMAIL_ADDRESS',
                            //   /* more items */
                            // ],
                            ToAddresses: [
                                username,
                                /* more items */
                            ]
                        },
                        Message: { /* required */
                            Body: { /* required */
                                Html: {
                                    Charset: "UTF-8",
                                    Data: messagedata
                                    // Data: "HTML_FORMAT_BODY"
                                },
                                Text: {
                                    Charset: "UTF-8",
                                    Data: "TEXT_FORMAT_BODY"
                                }
                            },
                            Subject: {
                                Charset: 'UTF-8',
                                Data: subject
                            }
                        },
                        Source: sender, /* required */
                        //   ReplyToAddresses: [
                        //      'EMAIL_ADDRESS',
                        //     /* more items */
                        //   ],
                    };
                     var sendPromise = new aws.SES({ apiVersion: '2010-12-01' }).sendEmail(params).promise();
                     sendPromise.then(
                        function (data) {
                            console.log("This is message ID:",data.MessageId);
                        }).catch(
                            function (err) {
                                console.error(err, err.stack);
                            });
    
                    console.log("Record added to DynamoDB");
                }
    });
        }
        else
        {
            console.log(("Record exists!!"))
        }
    })
    
    
    
    
}
