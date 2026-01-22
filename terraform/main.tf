# PromtCraft - AI Prompt Enhancement Tool
# Terraform Infrastructure Configuration

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# For CloudFront certificate (must be us-east-1)
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

# Variables
variable "aws_region" {
  default = "us-east-1"
}

variable "project_name" {
  default = "promtcraft"
}

variable "environment" {
  default = "production"
}

variable "domain_name" {
  default = "promtcraft.in"
}

variable "budget_limit" {
  default = "10"
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

locals {
  account_id = data.aws_caller_identity.current.account_id
  name_prefix = "${var.project_name}-${var.environment}"
}

# S3 Bucket for static website
resource "aws_s3_bucket" "website" {
  bucket = "${local.name_prefix}-${local.account_id}"
  
  tags = {
    Name        = "${var.project_name} Website"
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_s3_bucket_website_configuration" "website" {
  bucket = aws_s3_bucket.website.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }
}

resource "aws_s3_bucket_public_access_block" "website" {
  bucket = aws_s3_bucket.website.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "website" {
  bucket = aws_s3_bucket.website.id
  depends_on = [aws_s3_bucket_public_access_block.website]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.website.arn}/*"
      }
    ]
  })
}

# DynamoDB Tables
resource "aws_dynamodb_table" "prompts" {
  name         = "${local.name_prefix}-prompts"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "pk"
  range_key    = "sk"

  attribute {
    name = "pk"
    type = "S"
  }

  attribute {
    name = "sk"
    type = "S"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  tags = {
    Name        = "${var.project_name} Prompts"
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_dynamodb_table" "ratelimit" {
  name         = "${local.name_prefix}-ratelimit"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "ip"

  attribute {
    name = "ip"
    type = "S"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  tags = {
    Name        = "${var.project_name} Rate Limit"
    Environment = var.environment
    Project     = var.project_name
  }
}

# IAM Role for Lambda
resource "aws_iam_role" "lambda" {
  name = "${local.name_prefix}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Project = var.project_name
  }
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "lambda_dynamodb" {
  name = "DynamoDBAccess"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          aws_dynamodb_table.prompts.arn,
          aws_dynamodb_table.ratelimit.arn
        ]
      }
    ]
  })
}

# Lambda Function
data "archive_file" "lambda" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda"
  output_path = "${path.module}/.terraform/lambda.zip"
}

resource "aws_lambda_function" "api" {
  filename         = data.archive_file.lambda.output_path
  function_name    = "${local.name_prefix}-api"
  role            = aws_iam_role.lambda.arn
  handler         = "index.handler"
  source_code_hash = data.archive_file.lambda.output_base64sha256
  runtime         = "nodejs20.x"
  memory_size     = 256
  timeout         = 30

  environment {
    variables = {
      PROMPTS_TABLE    = aws_dynamodb_table.prompts.name
      RATE_LIMIT_TABLE = aws_dynamodb_table.ratelimit.name
    }
  }

  tags = {
    Name        = "${var.project_name} API"
    Environment = var.environment
    Project     = var.project_name
  }
}

# API Gateway
resource "aws_apigatewayv2_api" "api" {
  name          = "${local.name_prefix}-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["POST", "OPTIONS"]
    allow_headers = ["Content-Type"]
  }

  tags = {
    Project = var.project_name
  }
}

resource "aws_apigatewayv2_stage" "prod" {
  api_id      = aws_apigatewayv2_api.api.id
  name        = "prod"
  auto_deploy = true

  tags = {
    Project = var.project_name
  }
}

resource "aws_apigatewayv2_integration" "lambda" {
  api_id             = aws_apigatewayv2_api.api.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.api.invoke_arn
  integration_method = "POST"
}

resource "aws_apigatewayv2_route" "post" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "POST /generate-prompt"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.api.execution_arn}/*/*"
}

# Route 53 Hosted Zone
resource "aws_route53_zone" "main" {
  name = var.domain_name

  tags = {
    Project = var.project_name
  }
}

# ACM Certificate
resource "aws_acm_certificate" "main" {
  provider          = aws.us_east_1
  domain_name       = var.domain_name
  subject_alternative_names = ["*.${var.domain_name}"]
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Project = var.project_name
  }
}

resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.main.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = aws_route53_zone.main.zone_id
}

resource "aws_acm_certificate_validation" "main" {
  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.main.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "main" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  aliases             = [var.domain_name]
  price_class         = "PriceClass_100"

  origin {
    domain_name = aws_s3_bucket_website_configuration.website.website_endpoint
    origin_id   = "S3Origin"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3Origin"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }

  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.main.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  depends_on = [aws_acm_certificate_validation.main]

  tags = {
    Project = var.project_name
  }
}

# Route 53 A Record
resource "aws_route53_record" "main" {
  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.main.domain_name
    zone_id                = aws_cloudfront_distribution.main.hosted_zone_id
    evaluate_target_health = false
  }
}

# Budget Alert
resource "aws_budgets_budget" "monthly" {
  name         = "${local.name_prefix}-monthly-budget"
  budget_type  = "COST"
  limit_amount = var.budget_limit
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 50
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = ["your-email@example.com"]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = ["your-email@example.com"]
  }
}

# Outputs
output "website_url" {
  value = "https://${var.domain_name}"
}

output "cloudfront_url" {
  value = "https://${aws_cloudfront_distribution.main.domain_name}"
}

output "api_endpoint" {
  value = "${aws_apigatewayv2_api.api.api_endpoint}/prod/generate-prompt"
}

output "s3_bucket" {
  value = aws_s3_bucket.website.id
}

output "nameservers" {
  value = aws_route53_zone.main.name_servers
}
