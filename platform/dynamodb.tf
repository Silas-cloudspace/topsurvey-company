# DynamoDB table for surveys
resource "aws_dynamodb_table" "surveys_db" {
  name         = "surveys_db"
  billing_mode = "PAY_PER_REQUEST"  
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S" 
  }

  tags = {
    Name        = "surveys-db"
  }
}

# DynamoDB table for survey responses
resource "aws_dynamodb_table" "survey_responses" {
  name         = "survey_responses"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S" 
  }

  attribute {
    name = "survey_id"
    type = "S" 
  }

  # Global Secondary Index for querying responses by survey_id
  global_secondary_index {
    name               = "survey_id-index"
    hash_key           = "survey_id"
    projection_type    = "ALL"
  }

  tags = {
    Name        = "survey-responses"
  }
}

# Data source to dynamically fetch the service name for DynamoDB
data "aws_vpc_endpoint_service" "dynamodb" {
  service      = "dynamodb"
  service_type = "Gateway"
}

# VPC Endpoint for DynamoDB
resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id            = aws_vpc.vpc.id
  service_name      = data.aws_vpc_endpoint_service.dynamodb.service_name
  vpc_endpoint_type = "Gateway"
  route_table_ids = [
    aws_route_table.private_route_table_az1.id,
    aws_route_table.private_route_table_az2.id
  ]
}
