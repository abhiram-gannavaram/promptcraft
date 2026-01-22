#!/bin/bash

# =========================================
# AI Prompt Generator - Deployment Script
# =========================================
# Usage: ./deploy.sh [environment]
# Environments: development, staging, production
# =========================================

set -e  # Exit on error
set -o pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="${1:-production}"
AWS_REGION="${AWS_REGION:-us-east-1}"
STACK_PREFIX="ai-prompt-generator"

# =========================================
# Helper Functions
# =========================================

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials not configured. Run 'aws configure' first."
        exit 1
    fi
    
    # Check jq
    if ! command -v jq &> /dev/null; then
        log_warning "jq is not installed. Some features may not work."
    fi
    
    log_success "Prerequisites check passed"
}

validate_environment() {
    case $ENVIRONMENT in
        development|staging|production)
            log_info "Deploying to: $ENVIRONMENT"
            ;;
        *)
            log_error "Invalid environment: $ENVIRONMENT"
            log_info "Valid environments: development, staging, production"
            exit 1
            ;;
    esac
}

# =========================================
# Deployment Functions
# =========================================

deploy_frontend_infrastructure() {
    log_info "Deploying frontend infrastructure..."
    
    FRONTEND_STACK="${STACK_PREFIX}-frontend-${ENVIRONMENT}"
    
    aws cloudformation deploy \
        --template-file infrastructure/cloudformation/main.yaml \
        --stack-name "${FRONTEND_STACK}" \
        --parameter-overrides \
            Environment="${ENVIRONMENT}" \
            EnableWAF=$( [ "$ENVIRONMENT" = "production" ] && echo "true" || echo "false" ) \
            PriceClass="PriceClass_100" \
        --capabilities CAPABILITY_NAMED_IAM \
        --no-fail-on-empty-changeset \
        --region "${AWS_REGION}"
    
    log_success "Frontend infrastructure deployed"
    
    # Get outputs
    BUCKET_NAME=$(aws cloudformation describe-stacks \
        --stack-name "${FRONTEND_STACK}" \
        --query 'Stacks[0].Outputs[?OutputKey==`WebsiteBucketName`].OutputValue' \
        --output text \
        --region "${AWS_REGION}")
    
    DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
        --stack-name "${FRONTEND_STACK}" \
        --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' \
        --output text \
        --region "${AWS_REGION}")
    
    WEBSITE_URL=$(aws cloudformation describe-stacks \
        --stack-name "${FRONTEND_STACK}" \
        --query 'Stacks[0].Outputs[?OutputKey==`WebsiteURL`].OutputValue' \
        --output text \
        --region "${AWS_REGION}")
    
    export BUCKET_NAME DISTRIBUTION_ID WEBSITE_URL
}

deploy_backend_infrastructure() {
    log_info "Deploying backend infrastructure..."
    
    BACKEND_STACK="${STACK_PREFIX}-backend-${ENVIRONMENT}"
    
    # Package and deploy SAM template
    aws cloudformation deploy \
        --template-file infrastructure/cloudformation/backend.yaml \
        --stack-name "${BACKEND_STACK}" \
        --parameter-overrides \
            Environment="${ENVIRONMENT}" \
            AIProvider="claude" \
            RateLimitRequests="100" \
        --capabilities CAPABILITY_NAMED_IAM CAPABILITY_AUTO_EXPAND \
        --no-fail-on-empty-changeset \
        --region "${AWS_REGION}"
    
    log_success "Backend infrastructure deployed"
    
    # Get API endpoint
    API_ENDPOINT=$(aws cloudformation describe-stacks \
        --stack-name "${BACKEND_STACK}" \
        --query 'Stacks[0].Outputs[?OutputKey==`APIEndpoint`].OutputValue' \
        --output text \
        --region "${AWS_REGION}")
    
    export API_ENDPOINT
}

sync_frontend_files() {
    log_info "Syncing frontend files to S3..."
    
    if [ -z "$BUCKET_NAME" ]; then
        log_error "Bucket name not set. Run infrastructure deployment first."
        exit 1
    fi
    
    # Update API endpoint in app.js if set
    if [ -n "$API_ENDPOINT" ]; then
        log_info "Updating API endpoint in app.js..."
        sed -i.bak "s|API_ENDPOINT: '/api/generate-prompt'|API_ENDPOINT: '${API_ENDPOINT}/generate-prompt'|g" frontend/js/app.js
        rm -f frontend/js/app.js.bak
    fi
    
    # Sync HTML files (no cache)
    aws s3 sync frontend/ "s3://${BUCKET_NAME}/" \
        --exclude "*" \
        --include "*.html" \
        --cache-control "no-cache, no-store, must-revalidate" \
        --content-type "text/html; charset=utf-8" \
        --region "${AWS_REGION}"
    
    # Sync CSS files (long cache)
    aws s3 sync frontend/ "s3://${BUCKET_NAME}/" \
        --exclude "*" \
        --include "*.css" \
        --cache-control "public, max-age=31536000, immutable" \
        --content-type "text/css; charset=utf-8" \
        --region "${AWS_REGION}"
    
    # Sync JS files (long cache)
    aws s3 sync frontend/ "s3://${BUCKET_NAME}/" \
        --exclude "*" \
        --include "*.js" \
        --cache-control "public, max-age=31536000, immutable" \
        --content-type "application/javascript; charset=utf-8" \
        --region "${AWS_REGION}"
    
    # Sync other files
    aws s3 sync frontend/ "s3://${BUCKET_NAME}/" \
        --exclude "*.html" \
        --exclude "*.css" \
        --exclude "*.js" \
        --cache-control "public, max-age=604800" \
        --region "${AWS_REGION}"
    
    log_success "Frontend files synced"
}

invalidate_cache() {
    log_info "Invalidating CloudFront cache..."
    
    if [ -z "$DISTRIBUTION_ID" ]; then
        log_warning "Distribution ID not set. Skipping cache invalidation."
        return
    fi
    
    INVALIDATION_ID=$(aws cloudfront create-invalidation \
        --distribution-id "${DISTRIBUTION_ID}" \
        --paths "/*" \
        --query 'Invalidation.Id' \
        --output text \
        --region "${AWS_REGION}")
    
    log_info "Waiting for cache invalidation to complete..."
    
    aws cloudfront wait invalidation-completed \
        --distribution-id "${DISTRIBUTION_ID}" \
        --id "${INVALIDATION_ID}" \
        --region "${AWS_REGION}"
    
    log_success "Cache invalidation completed"
}

update_api_keys() {
    log_info "Checking API keys in Secrets Manager..."
    
    SECRET_NAME="${STACK_PREFIX}/${ENVIRONMENT}/api-keys"
    
    # Check if secret exists
    if aws secretsmanager describe-secret --secret-id "${SECRET_NAME}" --region "${AWS_REGION}" &> /dev/null; then
        log_warning "API keys secret exists. To update, use AWS Console or:"
        log_info "aws secretsmanager update-secret --secret-id ${SECRET_NAME} --secret-string '{\"CLAUDE_API_KEY\":\"your-key\"}'"
    else
        log_warning "API keys secret not found. It will be created by CloudFormation."
        log_info "After deployment, update the secret with your actual API keys."
    fi
}

run_smoke_tests() {
    log_info "Running smoke tests..."
    
    if [ -z "$WEBSITE_URL" ]; then
        log_warning "Website URL not set. Skipping smoke tests."
        return
    fi
    
    # Test homepage
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${WEBSITE_URL}")
    
    if [ "$HTTP_STATUS" -eq 200 ]; then
        log_success "Homepage returned 200 OK"
    else
        log_error "Homepage returned ${HTTP_STATUS}"
    fi
    
    # Test API if endpoint is set
    if [ -n "$API_ENDPOINT" ]; then
        API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${API_ENDPOINT}" || echo "000")
        log_info "API endpoint status: ${API_STATUS}"
    fi
}

print_summary() {
    echo ""
    echo "==========================================="
    echo -e "${GREEN}🎉 Deployment Complete!${NC}"
    echo "==========================================="
    echo ""
    echo "Environment: ${ENVIRONMENT}"
    echo "Region: ${AWS_REGION}"
    echo ""
    
    if [ -n "$WEBSITE_URL" ]; then
        echo -e "Website URL: ${BLUE}${WEBSITE_URL}${NC}"
    fi
    
    if [ -n "$API_ENDPOINT" ]; then
        echo -e "API Endpoint: ${BLUE}${API_ENDPOINT}${NC}"
    fi
    
    if [ -n "$BUCKET_NAME" ]; then
        echo "S3 Bucket: ${BUCKET_NAME}"
    fi
    
    if [ -n "$DISTRIBUTION_ID" ]; then
        echo "CloudFront Distribution: ${DISTRIBUTION_ID}"
    fi
    
    echo ""
    echo "==========================================="
    echo ""
    
    if [ "$ENVIRONMENT" = "production" ]; then
        log_warning "Don't forget to:"
        echo "  1. Update API keys in Secrets Manager"
        echo "  2. Configure custom domain in Route 53 (if applicable)"
        echo "  3. Set up CloudWatch alarms notifications"
        echo "  4. Review WAF rules"
    fi
}

# =========================================
# Main Execution
# =========================================

main() {
    echo ""
    echo "==========================================="
    echo "  AI Prompt Generator - Deployment Script"
    echo "==========================================="
    echo ""
    
    validate_environment
    check_prerequisites
    
    # Deploy infrastructure
    deploy_frontend_infrastructure
    deploy_backend_infrastructure
    
    # Update API keys reminder
    update_api_keys
    
    # Deploy frontend
    sync_frontend_files
    invalidate_cache
    
    # Run tests
    run_smoke_tests
    
    # Print summary
    print_summary
}

# Run main function
main "$@"
