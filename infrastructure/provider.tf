provider "aws"{
	profile=var.user_profile
	region=var.aws_region
}



resource "aws_vpc" "vpc"{
	cidr_block=var.vpc_cidr
	enable_dns_hostnames= true
	enable_dns_support= true
	assign_generated_ipv6_cidr_block= false
	tags={
		Name="vpc"
	}
}

resource "aws_security_group" "elb" {
  name        = "elb"
  vpc_id      = aws_vpc.vpc.id
  description = "Load Balancer SG"

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "elbSG"
  }
}

resource "aws_security_group" "ssl-sg" {
  vpc_id       = aws_vpc.vpc.id
  name         = "ssl-sg"
  description  = "ssl-sg"
  
  ingress {
    cidr_blocks = [ "0.0.0.0/0" ]
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
  } 
  egress {
  from_port = 0
  to_port = 0
  cidr_blocks= ["0.0.0.0/0"]
  protocol = "-1"
  }
  tags={
    Name = "ssl-sg"
  }
}



# Create the Security Group
resource "aws_security_group" "application" {
  vpc_id       = aws_vpc.vpc.id
  name         = "application"
  description  = "application"
  
  # allow ingress of port 22
  # ingress {
  #   cidr_blocks = [ "0.0.0.0/0" ]
  #   from_port   = 22
  #   to_port     = 22
  #   protocol    = "tcp"
  # } 
  
  # ingress {
  #   cidr_blocks = [ "0.0.0.0/0" ]
  #   from_port   = 40
  #   to_port     = 40
  #   protocol    = "tcp"
  # } 
  # ingress {
  #   cidr_blocks = [ "0.0.0.0/0" ]  
  #   from_port   = 883
  #   to_port     = 883
  #   protocol    = "tcp"
  # } 
  ingress {
    #cidr_blocks = [ "0.0.0.0/0" ]
    from_port   = 5002
    to_port     = 5002
    protocol    = "tcp"
    security_groups=["${aws_security_group.elb.id}"]
  }  
  egress {
  from_port = 0
  to_port = 0
  cidr_blocks= ["0.0.0.0/0"]
  protocol = "-1"
  }
tags = {
   Name = "application"
   Description = "application"
}
} # end resource

resource "aws_security_group" "database"{
  vpc_id       = aws_vpc.vpc.id
  name         = "database"
  description  = "database"
  
  ingress {
    from_port = 3306
    to_port = 3306
    security_groups = ["${aws_security_group.application.id}"]
    description = "Allow traffic from application security group"
    protocol = "tcp"
  }
  egress {
  from_port = 0
  to_port = 0
  cidr_blocks= ["0.0.0.0/0"]
  protocol = "-1"
  }
  tags={
    Name= "database"
    Description= "database"
  }

}

resource "aws_s3_bucket" "webapp_bucket" {
  bucket = var.bucket_name
  acl = "public-read"
  force_destroy = true
  versioning {
    enabled = true
  }

lifecycle_rule {
    enabled = true
    transition {
      days = 30
      storage_class = "STANDARD_IA"
    }
  }
  
server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }
}

resource "aws_s3_bucket_public_access_block" "public_access_block" {
  bucket = aws_s3_bucket.webapp_bucket.id
  ignore_public_acls = true
}

#Creating IAM Policy

resource "aws_iam_policy" "WebAppS3" {
  name = "WebAppS3"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "ec2:*",
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:PutObjectAcl"
      ],
      "Effect": "Allow",
      "Resource": "arn:aws:s3:::${aws_s3_bucket.webapp_bucket.bucket}/*"
    }
  ]
}
EOF
}

#Creating Code Deploy policy

resource "aws_iam_policy" "CodeDeploy-EC2-S3"{
  name="CodeDeploy-EC2-S3"
  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
      {
          "Action": [
              "s3:Get*",
              "s3:List*"
          ],
          "Effect": "Allow",
          "Resource": "arn:aws:s3:::${var.cd_bucket}/*"
      }
  ]
}
EOF
}

#Creating Github policy

resource "aws_iam_policy" "GH-Upload-To-S3"{
  name="GH-Upload-To-S3"
  
  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
      {
          "Effect": "Allow",
          "Action": [
              "s3:PutObject",
              "s3:Get*",
              "s3:List*"
          ],
          "Resource": [
              "arn:aws:s3:::${var.cd_bucket}/*"
          ]
      }
  ]
}
EOF
}


resource "aws_iam_policy" "GH-Update-Lambda"{
  name="GH-Update-Lambda"
  
  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
      {
          "Sid":"VisualEditor0",
          "Effect": "Allow",
          "Action": [
              "Lambda:UpdateFunctionCode",
              "Lambda:GetFunction"
              
          ],
          "Resource": 
              "arn:aws:lambda:*:108867826646:function:*"
          
      },
      {
        "Sid":"VisualEditor1",
        "Effect": "Allow",
        "Action": "Lambda:ListFunctions",
        "Resource": "*"
      }
  ]
}
EOF
}

resource "aws_iam_policy" "gh-ec2-ami" {
  name = "gh-ec2-ami"
  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:AttachVolume",
        "ec2:AuthorizeSecurityGroupIngress",
        "ec2:CopyImage",
        "ec2:CreateImage",
        "ec2:CreateKeypair",
        "ec2:CreateSecurityGroup",
        "ec2:CreateSnapshot",
        "ec2:CreateTags",
        "ec2:CreateVolume",
        "ec2:DeleteKeyPair",
        "ec2:DeleteSecurityGroup",
        "ec2:DeleteSnapshot",
        "ec2:DeleteVolume",
        "ec2:DeregisterImage",
        "ec2:DescribeImageAttribute",
        "ec2:DescribeImages",
        "ec2:DescribeInstances",
        "ec2:DescribeInstanceStatus",
        "ec2:DescribeRegions",
        "ec2:DescribeSecurityGroups",
        "ec2:DescribeSnapshots",
        "ec2:DescribeSubnets",
        "ec2:DescribeTags",
        "ec2:DescribeVolumes",
        "ec2:DetachVolume",
        "ec2:GetPasswordData",
        "ec2:ModifyImageAttribute",
        "ec2:ModifyInstanceAttribute",
        "ec2:ModifySnapshotAttribute",
        "ec2:RegisterImage",
        "ec2:RunInstances",
        "ec2:StopInstances",
        "ec2:TerminateInstances"
      ],
      "Resource": "*"
    }
  ]
}
EOF
}

#Creating Github Code Deploy policy

resource "aws_iam_policy" "GH-Code-Deploy"{
  name="GH-Code-Deploy"
  
  policy = <<EOF
{
"Version": "2012-10-17",
"Statement": [
  {
    "Effect": "Allow",
    "Action": [
      "codedeploy:RegisterApplicationRevision",
      "codedeploy:GetApplicationRevision"
    ],
    "Resource": [
      "arn:aws:codedeploy:${var.aws_region}:${var.aws_account_id}:application:${aws_codedeploy_app.csye6225-webapp.name}"
      ]
  },
  {
    "Effect": "Allow",
    "Action": [
      "codedeploy:CreateDeployment",
      "codedeploy:GetDeployment"
    ],
    "Resource": [
      "*"
    ]
  },
  {
    "Effect": "Allow",
    "Action": [
      "codedeploy:GetDeploymentConfig"
    ],
    "Resource": [
      "arn:aws:codedeploy:${var.aws_region}:${var.aws_account_id}:deploymentconfig:CodeDeployDefault.OneAtATime",
      "arn:aws:codedeploy:${var.aws_region}:${var.aws_account_id}:deploymentconfig:CodeDeployDefault.HalfAtATime",
      "arn:aws:codedeploy:${var.aws_region}:${var.aws_account_id}:deploymentconfig:CodeDeployDefault.AllAtOnce"
        ]
  }
]
}
EOF
}
# line 237 "arn:aws:codedeploy:${var.aws_region}:${var.aws_account_id}:application:${var.code_deploy_application}"
      


# "arn:aws:codedeploy:${var.aws_region}:${var.aws_account_id}:deploymentconfig:CodeDeployDefault.OneAtATime",
#         "arn:aws:codedeploy:${var.aws_region}:${var.aws_account_id}:deploymentconfig:CodeDeployDefault.HalfAtATime",
#         "arn:aws:codedeploy:${var.aws_region}:${var.aws_account_id}:deploymentconfig:CodeDeployDefault.AllAtOnce"
     

#Attaching policies to ghactions iam user

resource "aws_iam_user_policy_attachment" "github_attach_GH-Upload-To-S3" {
  user       = "ghactions"
  policy_arn = "${aws_iam_policy.GH-Upload-To-S3.arn}"
}
resource "aws_iam_user_policy_attachment" "github_attach_GH-Code-Deploy" {
  user       = "ghactions"
  policy_arn = "${aws_iam_policy.GH-Code-Deploy.arn}"
}
resource "aws_iam_user_policy_attachment" "github_attach_gh-ec2-ami" {
  user       = "ghactions"
  policy_arn = "${aws_iam_policy.gh-ec2-ami.arn}"
}

resource "aws_iam_user_policy_attachment" "github_attach_lambda" {
  user       = "ghactions"
  policy_arn = "${aws_iam_policy.GH-Update-Lambda.arn}"
}
#creating iam role



resource "aws_iam_role" "CodeDeployEC2ServiceRole" {
  name = "CodeDeployEC2ServiceRole"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}
#creating iam role

resource "aws_iam_role" "CodeDeployServiceRole" {
  name = "CodeDeployServiceRole"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "codedeploy.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

#Attaching Role to IAM Policy
resource "aws_iam_role_policy_attachment" "CodeDeploy_Role_Policy_Attachment" {
  role       = "${aws_iam_role.CodeDeployServiceRole.name}"
  policy_arn =  "arn:aws:iam::aws:policy/service-role/AWSCodeDeployRole"
}

#Attaching Role to IAM Policy
resource "aws_iam_role_policy_attachment" "EC2ServiceRole-Attach-CodeDeploy-EC2-S3" {
  role       = "${aws_iam_role.CodeDeployEC2ServiceRole.name}"
  policy_arn = "${aws_iam_policy.CodeDeploy-EC2-S3.arn}"
}
resource "aws_iam_role_policy_attachment" "EC2ServiceRole-Attach-WebAppS3" {
  role       = "${aws_iam_role.CodeDeployEC2ServiceRole.name}"
  policy_arn = "${aws_iam_policy.WebAppS3.arn}"
}

resource "aws_iam_role_policy_attachment" "EC2ServiceRole-Attach-CloudWatchAgent" {
  role       = "${aws_iam_role.CodeDeployEC2ServiceRole.name}"
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

resource "aws_iam_role_policy_attachment" "EC2ServiceRole-Attach-CodeDeploy-EC2-SNS" {
  role       = "${aws_iam_role.CodeDeployEC2ServiceRole.name}"
  policy_arn = "arn:aws:iam::aws:policy/AmazonSNSFullAccess"
}


resource "aws_iam_policy" "lambda-log" {
  name = "lambda-log"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Effect": "Allow",
      "Resource":"arn:aws:logs:*:*:*"
    }
  ]
}
EOF
}

resource "aws_iam_role_policy_attachment" "lambdaServiceLogAttachment" {
  role = aws_iam_role.iam_for_lambda.name
  policy_arn = aws_iam_policy.lambda-log.arn
}

#Creating IAM Role
#4
# resource "aws_iam_role" "EC2-CSYE6225" {
#   name = "EC2-CSYE6225"

#   assume_role_policy = <<EOF
# {
#   "Version": "2012-10-17",
#   "Statement": [
#     {
#       "Action": "sts:AssumeRole",
#       "Principal": {
#         "Service": "ec2.amazonaws.com"
#       },
#       "Effect": "Allow",
#       "Sid": ""
#     }
#   ]
# }
# EOF
# }

#Attaching Role to IAM Policy
#1
# resource "aws_iam_role_policy_attachment" "EC2ServiceRole-Attach-ec2_s3_policy" {
#   role       = "${aws_iam_role.EC2-CSYE6225.name}"
#   policy_arn = "${aws_iam_policy.WebAppS3.arn}"
#}

#Creating IAM Instance Profile
#2
# resource "aws_iam_instance_profile" "ec2_profile" {
#   name = "ec2_profile"
#   role = "${aws_iam_role.EC2-CSYE6225.name}"
# }

resource "aws_db_parameter_group" "pg-mysql" {
  name   = "pg-mysql"
  family = "mysql5.7"

  parameter {
    name  = "performance_schema"
    value = "1"
    apply_method = "pending-reboot"
  }

}

resource "aws_kms_key" "kmskey"{
  description = "KMS Key"
  deletion_window_in_days = 10
}


#Creating RDS Instance

resource "aws_db_instance" "mysql" {
  identifier           = "csye6225-f20"
  allocated_storage    = 5
  storage_type         = "gp2"
  engine               = "mysql"
  engine_version       = "5.7"
  instance_class       = "db.t3.micro"
  name                 = var.rds_name
  username             = var.rds_username
  password             = var.rds_password
  multi_az             = false
  publicly_accessible  = false
  db_subnet_group_name = "${aws_db_subnet_group.subnet_rds.name}"
  parameter_group_name = "${aws_db_parameter_group.pg-mysql.id}"
  vpc_security_group_ids   = ["${aws_security_group.database.id}"]
  skip_final_snapshot = true
  storage_encrypted = true
  apply_immediately = "true"
  kms_key_id = aws_kms_key.kmskey.arn

}


resource "aws_db_subnet_group" "subnet_rds" {
  name       = "subnet_rds"
  subnet_ids = ["${aws_subnet.subnet1.id}","${aws_subnet.subnet2.id}","${aws_subnet.subnet3.id}"]

}

#Creating DynamoDB Table

resource "aws_dynamodb_table" "csye6225" {
  name           = var.dynamo_name
  read_capacity  = 5
  write_capacity = 5
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }
}

#resource "aws_key_pair" "ec2_key" {
#key_name = "ec2_key"
#public_key = "${file("~/Downloads/name.pem")}"
#}

#Creating IAM Instance Profile

resource "aws_iam_instance_profile" "ec2_application_instance" {
  name = "ec2_application_instance"
  role = "${aws_iam_role.CodeDeployEC2ServiceRole.name}"
}

resource "aws_instance" "ec2_ssl" {

  ami = var.ami_id
  instance_type = "t2.micro"
  associate_public_ip_address = true
  key_name = var.key_val
  subnet_id = "${aws_subnet.subnet1.id}"
  vpc_security_group_ids = [ "${aws_security_group.application.id}" , "${aws_security_group.ssl-sg.id}"]
  tags = {
     Name = "ec2_ssl"
   }
}





#Creating EC2 Instance
#3
# resource "aws_instance" "ec2_application_instance" {
#   ami           = var.ami_id
#   instance_type = "t2.micro"
#   associate_public_ip_address = true
#   # key_name = "${aws_key_pair.ec2_key.key_name}"
#   key_name = var.key_val
#   iam_instance_profile = "${aws_iam_instance_profile.ec2_application_instance.name}" 
#   vpc_security_group_ids = [ "${aws_security_group.application.id}" ]
#   ebs_block_device {
#     device_name = "/dev/sdg"
#     volume_size = 20
#     volume_type = "gp2"
#     delete_on_termination = true
#   }
#   user_data = <<-EOF
#         #!/bin/bash
#         sudo apt-get update
#         sudo apt-get install unzip
#         mkdir -p /home/ubuntu/csye6225/webapp/
#         sudo chown -R ubuntu:ubuntu home/ubuntu/csye6225
#         sudo echo "DATABASE_NAME= ${var.rds_name}" >> /home/ubuntu/csye6225/.env
#         sudo echo "DATABASE_USERNAME= ${var.rds_username}" >> /home/ubuntu/csye6225/.env
#         sudo echo "DATABASE_PASSWORD= ${aws_db_instance.mysql.password}" >> /home/ubuntu/csye6225/.env
#         sudo echo "DATABASE_HOSTNAME= ${aws_db_instance.mysql.endpoint}" | sed s/:3306//g  >> /home/ubuntu/csye6225/.env
#         sudo echo "WEBAPP_S3_BUCKET= ${aws_s3_bucket.webapp_bucket.bucket}" >> /home/ubuntu/csye6225/.env
#         cd /home/ubuntu/csye6225/webapp/
#         GLOBIGNORE=*.env
#         EOF
#   subnet_id = "${aws_subnet.subnet1.id}"
# #  public_dns ="${aws_route53_record.dns_record.name}"
#   tags = {
#     Name = "ec2_application_instance"
#   }
  
#   depends_on = [
#     aws_iam_instance_profile.ec2_application_instance,
    
#     aws_db_instance.mysql,
#     aws_s3_bucket.webapp_bucket
#   ]
# }

data "aws_route53_zone" "dns_record" {
  name = var.dns_zone_name
  private_zone = false
}

resource "aws_route53_record" "dns_record" {
  zone_id = data.aws_route53_zone.dns_record.id
  name    = var.dns_record_name
  type    = "A"
  #ttl     = "60"
  #records = [aws_instance.ec2_application_instance.public_ip]
  alias {
    name                   = aws_alb.lb.dns_name
    zone_id                = aws_alb.lb.zone_id
    evaluate_target_health = false 
  }
  # depends_on =[
  #   aws_instance.ec2_application_instance
  # ]
}


resource "aws_codedeploy_app" "csye6225-webapp" {
  # compute_platform = "EC2/On-Premises"
  name = "csye6225-webapp"
}


resource "aws_codedeploy_deployment_group" "csye6225-webapp-deployment"{
  app_name= "${aws_codedeploy_app.csye6225-webapp.name}"
  deployment_group_name = "csye6225-webapp-deployment"
  deployment_config_name = "CodeDeployDefault.AllAtOnce"
  service_role_arn      = "${aws_iam_role.CodeDeployServiceRole.arn}"
  autoscaling_groups = [aws_autoscaling_group.WebServerGroup.name]

  deployment_style {
    deployment_type   = "IN_PLACE"
  }
  # auto_rollback_configuration {
  #   enabled = true
  #   events  = ["DEPLOYMENT_FAILURE"]
  # }
  # load_balancer_info {
  #     target_group_info {
  #         name = aws_alb_target_group.AutoScalingTargetGroup.name
  #     }
  # }

  # deployment_style {
  #   deployment_option = "WITH_TRAFFIC_CONTROL"
  #   deployment_type   = "IN_PLACE"
  # }
}



resource "aws_alb" "lb" {
  name                       = "lb"
  internal                   = false
  security_groups            = ["${aws_security_group.elb.id}"]
  subnets                    = ["${aws_subnet.subnet1.id}","${aws_subnet.subnet2.id}","${aws_subnet.subnet3.id}"]
  enable_deletion_protection = false
}


resource "aws_alb_target_group" "AutoScalingTargetGroup" {
  name     = "AutoScalingTargetGroup"
  port     = 5002
  protocol = "HTTP"
  vpc_id   = aws_vpc.vpc.id
  deregistration_delay = 10
  
}


resource "aws_lb_listener" "listener" {
  load_balancer_arn = "${aws_alb.lb.arn}"
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-2016-08"
  certificate_arn   = "arn:aws:acm:${var.aws_region}:${var.aws_account_id}:certificate/${var.certName}"

  default_action {
    type             = "forward"
    target_group_arn = "${aws_alb_target_group.AutoScalingTargetGroup.arn}"
  }
}



#Launch Config
resource "aws_launch_configuration" "asg_launch_config" {
  name          = "asg_launch_config"
  image_id      = var.ami_id
  instance_type = "t2.micro"
  associate_public_ip_address = true
  iam_instance_profile = "${aws_iam_instance_profile.ec2_application_instance.name}" 
  key_name = var.key_val
  security_groups = ["${aws_security_group.application.id}"]
  ebs_block_device {
    device_name = "/dev/sdg"
    volume_size = 20
    volume_type = "gp2"
    delete_on_termination = true
  }
  lifecycle {
    create_before_destroy = true
  }
  user_data = <<-EOF
        #!/bin/bash
        sudo apt-get update
        sudo apt-get install unzip
        mkdir -p /home/ubuntu/csye6225/webapp/
        sudo chown -R ubuntu:ubuntu home/ubuntu/csye6225
        sudo echo "DATABASE_NAME= ${var.rds_name}" >> /home/ubuntu/csye6225/.env
        sudo echo "DATABASE_USERNAME= ${var.rds_username}" >> /home/ubuntu/csye6225/.env
        sudo echo "DATABASE_PASSWORD= ${aws_db_instance.mysql.password}" >> /home/ubuntu/csye6225/.env
        sudo echo "DATABASE_HOSTNAME= ${aws_db_instance.mysql.endpoint}" | sed s/:3306//g  >> /home/ubuntu/csye6225/.env
        sudo echo "WEBAPP_S3_BUCKET= ${aws_s3_bucket.webapp_bucket.bucket}" >> /home/ubuntu/csye6225/.env
        cd /home/ubuntu/csye6225/webapp/
        GLOBIGNORE=*.env
        EOF
        
  #subnet_id = "${aws_subnet.subnet1.id}"
  
  depends_on = [
    aws_iam_instance_profile.ec2_application_instance,
    aws_db_instance.mysql,
    aws_s3_bucket.webapp_bucket
  ]

}

resource "aws_autoscaling_group" "WebServerGroup" {
  name = "WebServerGroup"
  min_size = 3
  max_size = 5
  desired_capacity = 3
  default_cooldown = 60
  launch_configuration=aws_launch_configuration.asg_launch_config.name
  
  vpc_zone_identifier=["${aws_subnet.subnet1.id}","${aws_subnet.subnet2.id}","${aws_subnet.subnet3.id}"]
  lifecycle {
    create_before_destroy = true
  }
  tag {
    key = "Name"
    value = "ec2_application_instance"
    propagate_at_launch = true
  }
}

resource "aws_autoscaling_policy" "WebServerScaleUpPolicy" {
  name                   = "WebServerScaleUpPolicy"
  scaling_adjustment     = 1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 60
  autoscaling_group_name = aws_autoscaling_group.WebServerGroup.name
}


resource "aws_autoscaling_policy" "WebServerScaleDownPolicy" {
  name                   = "WebServerScaleDownPolicy"
  scaling_adjustment     = -1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 60
  autoscaling_group_name = aws_autoscaling_group.WebServerGroup.name
}

resource "aws_cloudwatch_metric_alarm" "CPUAlarmHigh" {
  alarm_name                = "CPUAlarmHigh"
  comparison_operator       = "GreaterThanThreshold"
  evaluation_periods        = "2"
  metric_name               = "CPUUtilization"
  namespace                 = "AWS/EC2"
  period                    = "60"
  statistic                 = "Average"
  threshold                 = "5"
  alarm_description         = "Scale-up if CPU > 5% for 1 minute"
  dimensions = {
    AutoScalingGroupName = "${aws_autoscaling_group.WebServerGroup.name}"
  }
  alarm_actions = ["${aws_autoscaling_policy.WebServerScaleUpPolicy.arn}"]
}


resource "aws_cloudwatch_metric_alarm" "CPUAlarmLow" {
  alarm_name                = "CPUAlarmLow"
  comparison_operator       = "LessThanThreshold"
  evaluation_periods        = "2"
  metric_name               = "CPUUtilization"
  namespace                 = "AWS/EC2"
  period                    = "60"
  statistic                 = "Average"
  threshold                 = "3"
  alarm_description         = "Scale-down if CPU < 3% for 1 minute"
  dimensions = {
    AutoScalingGroupName = "${aws_autoscaling_group.WebServerGroup.name}"
  }
  alarm_actions = ["${aws_autoscaling_policy.WebServerScaleDownPolicy.arn}"]
}


resource "aws_autoscaling_attachment" "WebServerGroup_AutoScalingTargetGroup_attachment" {
  autoscaling_group_name = "${aws_autoscaling_group.WebServerGroup.id}"
  alb_target_group_arn   = "${aws_alb_target_group.AutoScalingTargetGroup.arn}"
}

resource "aws_iam_role" "iam_for_lambda" {
  name = "iam_for_lambda"
  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

resource "aws_iam_role_policy_attachment" "iam_lambda_policy_attach_sns" {
  role       = "${aws_iam_role.iam_for_lambda.name}"
  policy_arn =  "arn:aws:iam::aws:policy/AmazonSESFullAccess"
}

resource "aws_iam_role_policy_attachment" "iam_lambda_policy_attach_dynamodb" {
  role       = "${aws_iam_role.iam_for_lambda.name}"
  policy_arn =  "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess"
}
////////////////////////////////////////////////////////////

resource "aws_sns_topic" "sns_topic" {
  name = "sns_topic"
}

resource "aws_lambda_function" "lambda_function" {
  filename      = "csye6225_lambda_file.zip"
  function_name = "lambda_function"
  role          = aws_iam_role.iam_for_lambda.arn
  handler       = "index.handler"

  runtime = "nodejs12.x"

  # environment {
  #   variables = {
  #     foo = "bar"
  #   }
  # }
}

resource "aws_lambda_permission" "lambda_sns_permission" {
  statement_id  = "AllowExecutionFromSNS"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda_function.function_name
  principal     = "sns.amazonaws.com"
  source_arn    = aws_sns_topic.sns_topic.arn
}


resource "aws_sns_topic_subscription" "sns_topic_subs" {
 // provider  = "aws.sns2sqs"
  topic_arn = aws_sns_topic.sns_topic.arn
  protocol  = "lambda"
  endpoint  = aws_lambda_function.lambda_function.arn
  depends_on = ["aws_sns_topic.sns_topic"]
}

///////////////////////////////////////////////////////////


data "aws_availability_zones" "az" {
  state = "available"
}

resource "aws_subnet" "subnet1" {
  vpc_id     = aws_vpc.vpc.id
  availability_zone =data.aws_availability_zones.az.names[0]
  cidr_block = var.subnet1

  tags = {
    Name = "Subnet 1"
  }
}

resource "aws_subnet" "subnet2" {
  vpc_id     = "${aws_vpc.vpc.id}"
  availability_zone = "${data.aws_availability_zones.az.names[1]}"
  cidr_block = "${var.subnet2}"

  tags = {
    Name = "Subnet 2"
  }
}

resource "aws_subnet" "subnet3" {
  vpc_id     = "${aws_vpc.vpc.id}"
  availability_zone = "${data.aws_availability_zones.az.names[2]}"
  cidr_block = "${var.subnet3}"

  tags = {
    Name = "Subnet 3"
  }
}

resource "aws_internet_gateway" "gateway" {
  vpc_id = "${aws_vpc.vpc.id}"

  tags = {
    Name = "gateway"
  }
}


resource "aws_route_table" "routing_table" {
  vpc_id = "${aws_vpc.vpc.id}"

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = "${aws_internet_gateway.gateway.id}"
  }

}


resource "aws_route_table_association" "sub1" {
  subnet_id      = "${aws_subnet.subnet1.id}"
  route_table_id = "${aws_route_table.routing_table.id}"
}

resource "aws_route_table_association" "sub2" {
  subnet_id      = "${aws_subnet.subnet2.id}"
  route_table_id = "${aws_route_table.routing_table.id}"
}

resource "aws_route_table_association" "sub3" {
  subnet_id      = "${aws_subnet.subnet3.id}"
  route_table_id = "${aws_route_table.routing_table.id}"
}
