#!/bin/bash

# =========================================
# AI Prompt Generator - Backup Script
# =========================================
# Creates backups of S3 content and configurations
# Usage: ./backup.sh [environment]
# =========================================

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

ENVIRONMENT="${1:-production}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups/${ENVIRONMENT}/${TIMESTAMP}"
AWS_REGION="${AWS_REGION:-us-east-1}"

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Create backup directory
mkdir -p "${BACKUP_DIR}"

log_info "Starting backup for ${ENVIRONMENT} environment..."

# Get stack outputs
STACK_NAME="ai-prompt-generator-frontend-${ENVIRONMENT}"

BUCKET_NAME=$(aws cloudformation describe-stacks \
    --stack-name "${STACK_NAME}" \
    --query 'Stacks[0].Outputs[?OutputKey==`WebsiteBucketName`].OutputValue' \
    --output text \
    --region "${AWS_REGION}" 2>/dev/null || echo "")

if [ -z "$BUCKET_NAME" ]; then
    log_warning "Could not find bucket name. Stack may not exist."
    exit 1
fi

# Backup S3 content
log_info "Backing up S3 bucket: ${BUCKET_NAME}..."
aws s3 sync "s3://${BUCKET_NAME}/" "${BACKUP_DIR}/s3/" \
    --region "${AWS_REGION}"
log_success "S3 content backed up"

# Backup CloudFormation template
log_info "Backing up CloudFormation configuration..."
aws cloudformation get-template \
    --stack-name "${STACK_NAME}" \
    --query 'TemplateBody' \
    --output text \
    --region "${AWS_REGION}" > "${BACKUP_DIR}/cloudformation-frontend.yaml"

BACKEND_STACK="ai-prompt-generator-backend-${ENVIRONMENT}"
aws cloudformation get-template \
    --stack-name "${BACKEND_STACK}" \
    --query 'TemplateBody' \
    --output text \
    --region "${AWS_REGION}" > "${BACKUP_DIR}/cloudformation-backend.yaml" 2>/dev/null || true
log_success "CloudFormation templates backed up"

# Backup CloudFront configuration
log_info "Backing up CloudFront configuration..."
DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
    --stack-name "${STACK_NAME}" \
    --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' \
    --output text \
    --region "${AWS_REGION}" 2>/dev/null || echo "")

if [ -n "$DISTRIBUTION_ID" ]; then
    aws cloudfront get-distribution-config \
        --id "${DISTRIBUTION_ID}" \
        --output json > "${BACKUP_DIR}/cloudfront-config.json"
    log_success "CloudFront configuration backed up"
fi

# Create backup manifest
cat > "${BACKUP_DIR}/manifest.json" << EOF
{
    "timestamp": "${TIMESTAMP}",
    "environment": "${ENVIRONMENT}",
    "region": "${AWS_REGION}",
    "bucketName": "${BUCKET_NAME}",
    "distributionId": "${DISTRIBUTION_ID}",
    "backupDir": "${BACKUP_DIR}"
}
EOF

# Calculate backup size
BACKUP_SIZE=$(du -sh "${BACKUP_DIR}" | cut -f1)

log_success "Backup completed!"
echo ""
echo "==========================================="
echo "Backup Summary"
echo "==========================================="
echo "Location: ${BACKUP_DIR}"
echo "Size: ${BACKUP_SIZE}"
echo "Environment: ${ENVIRONMENT}"
echo "Timestamp: ${TIMESTAMP}"
echo "==========================================="
echo ""
log_info "To restore, run: ./scripts/restore.sh ${BACKUP_DIR}"
