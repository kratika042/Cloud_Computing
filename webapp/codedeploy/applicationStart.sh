#!/bin/bash
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
    -a fetch-config \
    -m ec2 \
    -c file:/home/ubuntu/csye6225/webapp/cloudwatch-config.json \
    -s
# sudo -s
cd 
cd csye6225/webapp/ && forever start app.js
# sudo chown ubuntu /home/ubuntu/csye6225/webapp/csye6225.log
# sudo chmod 664 /home/ubuntu/csye6225/webapp/csye6225.log
# sudo forever start /home/ubuntu/csye6225/webapp/app.js
#cd csye6225/webapp/ && forever start app.js