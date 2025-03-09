# environment variables
aws_account_id = "<aws acc id>"
region         = "<aws region>"
project_name   = "topsurvey"
environment    = "dev"

# vpc variables
vpc_cidr                    = "10.0.0.0/16"
public_subnet_az1_cidr      = "10.0.0.0/24"
public_subnet_az2_cidr      = "10.0.1.0/24"
private_app_subnet_az1_cidr = "10.0.2.0/24"
private_app_subnet_az2_cidr = "10.0.3.0/24"

# IAM variable
aws_user_name = "<aws user name>"

# ECS variables
ecr_repository_name = "topsurvey-ecr-st"
image_tag = "latest" 

# route53 variables
domain_name       = "<domain name>"
alternative_names = "*.<domain name>"
record_name       = "topsurvey"

# SNS variables
email = "<email>"