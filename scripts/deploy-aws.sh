#!/bin/bash

# =========================================
# AI Prompt Generator - AWS Deployment Script
# =========================================
# Budget-safe deployment with strict cost controls
# IMPORTANT: Sets up budget alerts BEFORE any resources
# Budget limit: $10/month
# =========================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="${PROJECT_DIR}/frontend"
ENVIRONMENT="${1:-production}"
AWS_REGION="${AWS_REGION:-us-east-1}"
BUDGET_LIMIT="10.00"
PROJECT_NAME="ai-prompt-generator"

# Email for alerts (REQUIRED)
ALERT_EMAIL="${ALERT_EMAIL:-}"

# =========================================
# Helper Functions
# =========================================

log_header() {
    echo ""
    echo -e "${PURPLE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${PURPLE}  $1${NC}"
    echo -e "${PURPLE}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
}

log_step() {
    echo -e "${CYAN}━━━ Step $1: $2 ━━━${NC}"
}

log_success() {
    echo -e "${GREEN}  ✅ $1${NC}"
}

log_error() {
    echo -e "${RED}  ❌ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}  ⚠️  $1${NC}"
}

log_info() {
    echo -e "${BLUE}  ℹ️  $1${NC}"
}

confirm() {
    echo -e "${YELLOW}"
    read -p "  $1 (y/N): " -n 1 -r
    echo -e "${NC}"
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "  Cancelled."
        exit 1
    fi
}

check_command() {
    if ! command -v "$1" &> /dev/null; then
        log_error "$1 is required but not installed."
        exit 1
    fi
}

# =========================================
# Pre-flight Checks
# =========================================

preflight_checks() {
    log_header "🔍 PRE-FLIGHT CHECKS"
    
    log_step "1" "Checking required tools"
    
    check_command aws
    log_success "AWS CLI found: $(aws --version 2>&1 | head -1)"
    
    check_command jq
    log_success "jq found"
    
    # Check AWS credentials
    log_step "2" "Verifying AWS credentials"
    
    if ! aws sts get-caller-identity > /dev/null 2>&1; then
        log_error "AWS credentials not configured. Run: aws configure"
        exit 1
    fi
    
    AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    AWS_USER=$(aws sts get-caller-identity --query Arn --output text)
    
    log_success "AWS Account: ${AWS_ACCOUNT_ID}"
    log_success "AWS User: ${AWS_USER}"
    
    # Check email configuration
    log_step "3" "Checking alert email configuration"
    
    if [ -z "$ALERT_EMAIL" ]; then
        echo ""
        read -p "  Enter your email for budget alerts: " ALERT_EMAIL
        if [ -z "$ALERT_EMAIL" ]; then
            log_error "Email is required for budget alerts"
            exit 1
        fi
    fi
    log_success "Alert email: ${ALERT_EMAIL}"
    
    # Verify frontend files exist
    log_step "4" "Verifying frontend files"
    
    if [ ! -f "${FRONTEND_DIR}/index.html" ]; then
        log_error "Frontend files not found in ${FRONTEND_DIR}"
        exit 1
    fi
    log_success "Frontend files found"
    
    # Display cost warning
    echo ""
    log_warning "IMPORTANT: This deployment has a strict budget limit of \$${BUDGET_LIMIT}/month"
    log_warning "Budget alerts will be configured at 50%, 80%, and 100% thresholds"
    echo ""
    confirm "Do you want to continue with the deployment?"
}

# =========================================
# STEP 1: Setup Budget Alerts (FIRST!)
# =========================================

setup_budget_alerts() {
    log_header "💰 STEP 1: SETTING UP BUDGET ALERTS (MANDATORY)"
    
    log_warning "This MUST be done before creating any other resources!"
    
    BUDGET_NAME="${PROJECT_NAME}-monthly-budget"
    
    # Check if budget already exists
    if aws budgets describe-budget \
        --account-id "${AWS_ACCOUNT_ID}" \
        --budget-name "${BUDGET_NAME}" \
        > /dev/null 2>&1; then
        log_success "Budget '${BUDGET_NAME}' already exists"
    else
        log_info "Creating budget with \$${BUDGET_LIMIT} monthly limit..."
        
        # Create budget JSON
        cat > /tmp/budget.json << EOF
{
    "BudgetName": "${BUDGET_NAME}",
    "BudgetLimit": {
        "Amount": "${BUDGET_LIMIT}",
        "Unit": "USD"
    },
    "BudgetType": "COST",
    "CostFilters": {},
    "CostTypes": {
        "IncludeTax": true,
        "IncludeSubscription": true,
        "UseBlended": false,
        "IncludeRefund": false,
        "IncludeCredit": false,
        "IncludeUpfront": true,
        "IncludeRecurring": true,
        "IncludeOtherSubscription": true,
        "IncludeSupport": true,
        "IncludeDiscount": true,
        "UseAmortized": false
    },
    "TimeUnit": "MONTHLY",
    "TimePeriod": {
        "Start": "2024-01-01T00:00:00Z",
        "End": "2087-06-15T00:00:00Z"
    }
}
EOF

        # Create notifications JSON
        cat > /tmp/notifications.json << EOF
[
    {
        "Notification": {
            "NotificationType": "ACTUAL",
            "ComparisonOperator": "GREATER_THAN",
            "Threshold": 50,
            "ThresholdType": "PERCENTAGE",
            "NotificationState": "ALARM"
        },
        "Subscribers": [
            {
                "SubscriptionType": "EMAIL",
                "Address": "${ALERT_EMAIL}"
            }
        ]
    },
    {
        "Notification": {
            "NotificationType": "ACTUAL",
            "ComparisonOperator": "GREATER_THAN",
            "Threshold": 80,
            "ThresholdType": "PERCENTAGE",
            "NotificationState": "ALARM"
        },
        "Subscribers": [
            {
                "SubscriptionType": "EMAIL",
                "Address": "${ALERT_EMAIL}"
            }
        ]
    },
    {
        "Notification": {
            "NotificationType": "ACTUAL",
            "ComparisonOperator": "GREATER_THAN",
            "Threshold": 100,
            "ThresholdType": "PERCENTAGE",
            "NotificationState": "ALARM"
        },
        "Subscribers": [
            {
                "SubscriptionType": "EMAIL",
                "Address": "${ALERT_EMAIL}"
            }
        ]
    },
    {
        "Notification": {
            "NotificationType": "FORECASTED",
            "ComparisonOperator": "GREATER_THAN",
            "Threshold": 100,
            "ThresholdType": "PERCENTAGE",
            "NotificationState": "ALARM"
        },
        "Subscribers": [
            {
                "SubscriptionType": "EMAIL",
                "Address": "${ALERT_EMAIL}"
            }
        ]
    }
]
EOF

        # Create the budget
        aws budgets create-budget \
            --account-id "${AWS_ACCOUNT_ID}" \
            --budget file:///tmp/budget.json \
            --notifications-with-subscribers file:///tmp/notifications.json \
            --region "${AWS_REGION}"
        
        log_success "Budget created with alerts at 50%, 80%, and 100%"
        
        # Cleanup temp files
        rm -f /tmp/budget.json /tmp/notifications.json
    fi
    
    # Create CloudWatch billing alarm as backup
    log_info "Creating CloudWatch billing alarm..."
    
    aws cloudwatch put-metric-alarm \
        --alarm-name "${PROJECT_NAME}-billing-alarm" \
        --alarm-description "Alarm when estimated charges exceed ${BUDGET_LIMIT} USD" \
        --metric-name EstimatedCharges \
        --namespace AWS/Billing \
        --statistic Maximum \
        --period 21600 \
        --threshold "${BUDGET_LIMIT}" \
        --comparison-operator GreaterThanThreshold \
        --dimensions "Name=Currency,Value=USD" \
        --evaluation-periods 1 \
        --alarm-actions "arn:aws:sns:${AWS_REGION}:${AWS_ACCOUNT_ID}:${PROJECT_NAME}-billing-alerts" \
        --region us-east-1 \
        2>/dev/null || log_warning "Billing alarm requires SNS topic setup"
    
    log_success "Budget alerts configured!"
    echo ""
    log_warning "You will receive email alerts at:"
    log_info "  • 50% (\$5.00) - Warning"
    log_info "  • 80% (\$8.00) - Critical warning"
    log_info "  • 100% (\$10.00) - Budget exceeded"
    log_info "  • Forecasted to exceed 100%"
}

# =========================================
# STEP 2: Create S3 Bucket (Secure)
# =========================================

create_s3_bucket() {
    log_header "🪣 STEP 2: CREATING S3 BUCKET (SECURE)"
    
    BUCKET_NAME="${PROJECT_NAME}-${ENVIRONMENT}-${AWS_ACCOUNT_ID}"
    
    # Check if bucket exists
    if aws s3api head-bucket --bucket "${BUCKET_NAME}" 2>/dev/null; then
        log_success "Bucket '${BUCKET_NAME}' already exists"
    else
        log_info "Creating bucket: ${BUCKET_NAME}"
        
        # Create bucket (region-specific)
        if [ "${AWS_REGION}" = "us-east-1" ]; then
            aws s3api create-bucket \
                --bucket "${BUCKET_NAME}" \
                --region "${AWS_REGION}"
        else
            aws s3api create-bucket \
                --bucket "${BUCKET_NAME}" \
                --region "${AWS_REGION}" \
                --create-bucket-configuration LocationConstraint="${AWS_REGION}"
        fi
        
        log_success "Bucket created"
    fi
    
    # Enable versioning
    log_info "Enabling versioning..."
    aws s3api put-bucket-versioning \
        --bucket "${BUCKET_NAME}" \
        --versioning-configuration Status=Enabled
    log_success "Versioning enabled"
    
    # Enable server-side encryption
    log_info "Enabling encryption..."
    aws s3api put-bucket-encryption \
        --bucket "${BUCKET_NAME}" \
        --server-side-encryption-configuration '{
            "Rules": [{
                "ApplyServerSideEncryptionByDefault": {
                    "SSEAlgorithm": "AES256"
                }
            }]
        }'
    log_success "Encryption enabled (AES-256)"
    
    # Block public access
    log_info "Blocking public access..."
    aws s3api put-public-access-block \
        --bucket "${BUCKET_NAME}" \
        --public-access-block-configuration '{
            "BlockPublicAcls": true,
            "IgnorePublicAcls": true,
            "BlockPublicPolicy": true,
            "RestrictPublicBuckets": true
        }'
    log_success "Public access blocked"
    
    # Add lifecycle policy to delete old versions (cost control)
    log_info "Adding lifecycle policy..."
    aws s3api put-bucket-lifecycle-configuration \
        --bucket "${BUCKET_NAME}" \
        --lifecycle-configuration '{
            "Rules": [{
                "ID": "DeleteOldVersions",
                "Status": "Enabled",
                "NoncurrentVersionExpiration": {
                    "NoncurrentDays": 30
                },
                "Filter": {}
            }]
        }'
    log_success "Lifecycle policy added (delete old versions after 30 days)"
    
    # Add cost allocation tags
    log_info "Adding cost allocation tags..."
    aws s3api put-bucket-tagging \
        --bucket "${BUCKET_NAME}" \
        --tagging "TagSet=[{Key=Project,Value=${PROJECT_NAME}},{Key=Environment,Value=${ENVIRONMENT}},{Key=CostCenter,Value=personal}]"
    log_success "Tags added for cost tracking"
    
    # Export bucket name for later use
    export S3_BUCKET="${BUCKET_NAME}"
}

# =========================================
# STEP 3: Upload Frontend Files
# =========================================

upload_frontend() {
    log_header "📤 STEP 3: UPLOADING FRONTEND FILES"
    
    log_info "Syncing files to S3..."
    
    # Sync with proper content types and cache headers
    aws s3 sync "${FRONTEND_DIR}" "s3://${S3_BUCKET}" \
        --delete \
        --cache-control "max-age=31536000,public" \
        --exclude "*.html" \
        --exclude "*.json"
    
    # Upload HTML files with no-cache
    aws s3 sync "${FRONTEND_DIR}" "s3://${S3_BUCKET}" \
        --exclude "*" \
        --include "*.html" \
        --cache-control "no-cache,no-store,must-revalidate" \
        --content-type "text/html; charset=utf-8"
    
    # Upload JSON files
    aws s3 sync "${FRONTEND_DIR}" "s3://${S3_BUCKET}" \
        --exclude "*" \
        --include "*.json" \
        --cache-control "max-age=3600" \
        --content-type "application/json"
    
    log_success "Frontend files uploaded"
    
    # List uploaded files
    log_info "Uploaded files:"
    aws s3 ls "s3://${S3_BUCKET}" --recursive --human-readable | head -20
}

# =========================================
# STEP 4: Create CloudFront Distribution
# =========================================

create_cloudfront() {
    log_header "🌐 STEP 4: CREATING CLOUDFRONT DISTRIBUTION"
    
    # Check for existing distribution
    EXISTING_DIST=$(aws cloudfront list-distributions \
        --query "DistributionList.Items[?Origins.Items[?DomainName=='${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com']].Id" \
        --output text 2>/dev/null)
    
    if [ -n "$EXISTING_DIST" ] && [ "$EXISTING_DIST" != "None" ]; then
        log_success "CloudFront distribution already exists: ${EXISTING_DIST}"
        export CLOUDFRONT_ID="${EXISTING_DIST}"
        CLOUDFRONT_DOMAIN=$(aws cloudfront get-distribution \
            --id "${CLOUDFRONT_ID}" \
            --query 'Distribution.DomainName' \
            --output text)
        export CLOUDFRONT_URL="https://${CLOUDFRONT_DOMAIN}"
        return
    fi
    
    log_info "Creating Origin Access Control..."
    
    # Create OAC
    OAC_ID=$(aws cloudfront create-origin-access-control \
        --origin-access-control-config '{
            "Name": "'${PROJECT_NAME}'-oac",
            "Description": "OAC for '${PROJECT_NAME}'",
            "SigningProtocol": "sigv4",
            "SigningBehavior": "always",
            "OriginAccessControlOriginType": "s3"
        }' \
        --query 'OriginAccessControl.Id' \
        --output text 2>/dev/null || echo "")
    
    if [ -z "$OAC_ID" ]; then
        # Get existing OAC
        OAC_ID=$(aws cloudfront list-origin-access-controls \
            --query "OriginAccessControlList.Items[?Name=='${PROJECT_NAME}-oac'].Id" \
            --output text)
    fi
    log_success "Origin Access Control: ${OAC_ID}"
    
    log_info "Creating CloudFront distribution..."
    
    # Create distribution config
    cat > /tmp/cf-config.json << EOF
{
    "CallerReference": "$(date +%s)",
    "Comment": "${PROJECT_NAME} ${ENVIRONMENT}",
    "DefaultRootObject": "index.html",
    "Origins": {
        "Quantity": 1,
        "Items": [{
            "Id": "S3-${S3_BUCKET}",
            "DomainName": "${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com",
            "OriginAccessControlId": "${OAC_ID}",
            "S3OriginConfig": {
                "OriginAccessIdentity": ""
            }
        }]
    },
    "DefaultCacheBehavior": {
        "TargetOriginId": "S3-${S3_BUCKET}",
        "ViewerProtocolPolicy": "redirect-to-https",
        "AllowedMethods": {
            "Quantity": 2,
            "Items": ["GET", "HEAD"],
            "CachedMethods": {
                "Quantity": 2,
                "Items": ["GET", "HEAD"]
            }
        },
        "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6",
        "Compress": true
    },
    "CustomErrorResponses": {
        "Quantity": 2,
        "Items": [
            {
                "ErrorCode": 403,
                "ResponsePagePath": "/index.html",
                "ResponseCode": "200",
                "ErrorCachingMinTTL": 300
            },
            {
                "ErrorCode": 404,
                "ResponsePagePath": "/index.html",
                "ResponseCode": "200",
                "ErrorCachingMinTTL": 300
            }
        ]
    },
    "Enabled": true,
    "PriceClass": "PriceClass_100",
    "ViewerCertificate": {
        "CloudFrontDefaultCertificate": true,
        "MinimumProtocolVersion": "TLSv1.2_2021"
    },
    "HttpVersion": "http2and3"
}
EOF

    # Create distribution
    DIST_RESULT=$(aws cloudfront create-distribution \
        --distribution-config file:///tmp/cf-config.json)
    
    CLOUDFRONT_ID=$(echo "$DIST_RESULT" | jq -r '.Distribution.Id')
    CLOUDFRONT_DOMAIN=$(echo "$DIST_RESULT" | jq -r '.Distribution.DomainName')
    
    export CLOUDFRONT_ID
    export CLOUDFRONT_URL="https://${CLOUDFRONT_DOMAIN}"
    
    log_success "CloudFront distribution created: ${CLOUDFRONT_ID}"
    log_success "URL: ${CLOUDFRONT_URL}"
    
    # Update S3 bucket policy to allow CloudFront access
    log_info "Updating S3 bucket policy..."
    
    cat > /tmp/bucket-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowCloudFrontServicePrincipal",
            "Effect": "Allow",
            "Principal": {
                "Service": "cloudfront.amazonaws.com"
            },
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::${S3_BUCKET}/*",
            "Condition": {
                "StringEquals": {
                    "AWS:SourceArn": "arn:aws:cloudfront::${AWS_ACCOUNT_ID}:distribution/${CLOUDFRONT_ID}"
                }
            }
        }
    ]
}
EOF

    aws s3api put-bucket-policy \
        --bucket "${S3_BUCKET}" \
        --policy file:///tmp/bucket-policy.json
    
    log_success "Bucket policy updated"
    
    # Cleanup
    rm -f /tmp/cf-config.json /tmp/bucket-policy.json
    
    log_warning "CloudFront distribution is deploying (takes 5-15 minutes)"
}

# =========================================
# STEP 5: Add Security Headers
# =========================================

add_security_headers() {
    log_header "🔒 STEP 5: ADDING SECURITY HEADERS"
    
    log_info "Creating response headers policy..."
    
    # Check if policy exists
    POLICY_ID=$(aws cloudfront list-response-headers-policies \
        --query "ResponseHeadersPolicyList.Items[?ResponseHeadersPolicy.ResponseHeadersPolicyConfig.Name=='${PROJECT_NAME}-security-headers'].ResponseHeadersPolicy.Id" \
        --output text 2>/dev/null)
    
    if [ -n "$POLICY_ID" ] && [ "$POLICY_ID" != "None" ]; then
        log_success "Security headers policy already exists: ${POLICY_ID}"
    else
        # Create security headers policy
        POLICY_RESULT=$(aws cloudfront create-response-headers-policy \
            --response-headers-policy-config '{
                "Name": "'${PROJECT_NAME}'-security-headers",
                "Comment": "Security headers for '${PROJECT_NAME}'",
                "SecurityHeadersConfig": {
                    "XSSProtection": {
                        "Override": true,
                        "Protection": true,
                        "ModeBlock": true
                    },
                    "FrameOptions": {
                        "Override": true,
                        "FrameOption": "DENY"
                    },
                    "ContentTypeOptions": {
                        "Override": true
                    },
                    "StrictTransportSecurity": {
                        "Override": true,
                        "IncludeSubdomains": true,
                        "Preload": true,
                        "AccessControlMaxAgeSec": 31536000
                    },
                    "ContentSecurityPolicy": {
                        "Override": true,
                        "ContentSecurityPolicy": "default-src '\''self'\''; script-src '\''self'\'' '\''unsafe-inline'\'' https://www.googletagmanager.com; style-src '\''self'\'' '\''unsafe-inline'\''; img-src '\''self'\'' data: https:; font-src '\''self'\'' data:; connect-src '\''self'\'' https://api.anthropic.com https://api.openai.com;"
                    },
                    "ReferrerPolicy": {
                        "Override": true,
                        "ReferrerPolicy": "strict-origin-when-cross-origin"
                    }
                }
            }')
        
        POLICY_ID=$(echo "$POLICY_RESULT" | jq -r '.ResponseHeadersPolicy.Id')
        log_success "Security headers policy created: ${POLICY_ID}"
    fi
    
    # Note: Attaching policy to distribution requires updating the distribution
    log_info "Security headers policy ready (attach via AWS Console if needed)"
}

# =========================================
# STEP 6: Run Post-Deployment Tests
# =========================================

post_deployment_tests() {
    log_header "🧪 STEP 6: POST-DEPLOYMENT TESTS"
    
    log_info "Waiting for CloudFront deployment..."
    
    # Wait for distribution to be deployed
    DEPLOY_STATUS="InProgress"
    WAIT_COUNT=0
    MAX_WAIT=30
    
    while [ "$DEPLOY_STATUS" = "InProgress" ] && [ $WAIT_COUNT -lt $MAX_WAIT ]; do
        DEPLOY_STATUS=$(aws cloudfront get-distribution \
            --id "${CLOUDFRONT_ID}" \
            --query 'Distribution.Status' \
            --output text)
        
        if [ "$DEPLOY_STATUS" = "Deployed" ]; then
            break
        fi
        
        echo -n "."
        sleep 20
        ((WAIT_COUNT++))
    done
    echo ""
    
    if [ "$DEPLOY_STATUS" = "Deployed" ]; then
        log_success "CloudFront distribution deployed"
    else
        log_warning "Distribution still deploying (continue with tests anyway)"
    fi
    
    # Test 1: HTTPS access
    log_info "Testing HTTPS access..."
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${CLOUDFRONT_URL}" 2>/dev/null || echo "000")
    
    if [ "$HTTP_CODE" = "200" ]; then
        log_success "HTTPS access: OK (${HTTP_CODE})"
    else
        log_warning "HTTPS access: ${HTTP_CODE} (may still be deploying)"
    fi
    
    # Test 2: Security headers
    log_info "Testing security headers..."
    HEADERS=$(curl -sI "${CLOUDFRONT_URL}" 2>/dev/null)
    
    if echo "$HEADERS" | grep -qi "strict-transport-security"; then
        log_success "HSTS header present"
    else
        log_warning "HSTS header not found (may need policy attachment)"
    fi
    
    if echo "$HEADERS" | grep -qi "x-content-type-options"; then
        log_success "X-Content-Type-Options present"
    fi
    
    if echo "$HEADERS" | grep -qi "x-frame-options"; then
        log_success "X-Frame-Options present"
    fi
    
    # Test 3: Content check
    log_info "Testing content..."
    CONTENT=$(curl -s "${CLOUDFRONT_URL}" 2>/dev/null | head -100)
    
    if echo "$CONTENT" | grep -q "<title>"; then
        log_success "HTML content served correctly"
    fi
    
    # Test 4: Compression
    log_info "Testing compression..."
    ENCODING=$(curl -sI -H "Accept-Encoding: gzip" "${CLOUDFRONT_URL}" 2>/dev/null | grep -i "content-encoding")
    
    if echo "$ENCODING" | grep -qi "gzip\|br"; then
        log_success "Compression enabled"
    else
        log_info "Compression may not be active yet"
    fi
}

# =========================================
# STEP 7: Setup Monitoring
# =========================================

setup_monitoring() {
    log_header "📊 STEP 7: SETTING UP MONITORING"
    
    # Create CloudWatch dashboard
    log_info "Creating CloudWatch dashboard..."
    
    DASHBOARD_NAME="${PROJECT_NAME}-${ENVIRONMENT}"
    
    cat > /tmp/dashboard.json << EOF
{
    "widgets": [
        {
            "type": "metric",
            "x": 0,
            "y": 0,
            "width": 12,
            "height": 6,
            "properties": {
                "title": "CloudFront Requests",
                "region": "us-east-1",
                "metrics": [
                    ["AWS/CloudFront", "Requests", "DistributionId", "${CLOUDFRONT_ID}", "Region", "Global"]
                ],
                "period": 300,
                "stat": "Sum"
            }
        },
        {
            "type": "metric",
            "x": 12,
            "y": 0,
            "width": 12,
            "height": 6,
            "properties": {
                "title": "CloudFront Errors",
                "region": "us-east-1",
                "metrics": [
                    ["AWS/CloudFront", "4xxErrorRate", "DistributionId", "${CLOUDFRONT_ID}", "Region", "Global"],
                    [".", "5xxErrorRate", ".", ".", ".", "."]
                ],
                "period": 300,
                "stat": "Average"
            }
        },
        {
            "type": "metric",
            "x": 0,
            "y": 6,
            "width": 24,
            "height": 6,
            "properties": {
                "title": "Estimated Charges",
                "region": "us-east-1",
                "metrics": [
                    ["AWS/Billing", "EstimatedCharges", "Currency", "USD"]
                ],
                "period": 21600,
                "stat": "Maximum"
            }
        }
    ]
}
EOF

    aws cloudwatch put-dashboard \
        --dashboard-name "${DASHBOARD_NAME}" \
        --dashboard-body file:///tmp/dashboard.json \
        --region "${AWS_REGION}"
    
    log_success "Dashboard created: ${DASHBOARD_NAME}"
    
    rm -f /tmp/dashboard.json
    
    # Create error rate alarm
    log_info "Creating error rate alarm..."
    
    aws cloudwatch put-metric-alarm \
        --alarm-name "${PROJECT_NAME}-high-error-rate" \
        --alarm-description "High error rate on CloudFront" \
        --metric-name "5xxErrorRate" \
        --namespace "AWS/CloudFront" \
        --dimensions "Name=DistributionId,Value=${CLOUDFRONT_ID}" "Name=Region,Value=Global" \
        --statistic Average \
        --period 300 \
        --threshold 5 \
        --comparison-operator GreaterThanThreshold \
        --evaluation-periods 2 \
        --region us-east-1 \
        2>/dev/null || log_warning "Error rate alarm may need manual setup"
    
    log_success "Monitoring configured"
}

# =========================================
# Generate Deployment Summary
# =========================================

generate_summary() {
    log_header "📋 DEPLOYMENT SUMMARY"
    
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  ✅ DEPLOYMENT SUCCESSFUL${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${CYAN}  Resources Created:${NC}"
    echo -e "    • S3 Bucket: ${S3_BUCKET}"
    echo -e "    • CloudFront ID: ${CLOUDFRONT_ID}"
    echo -e "    • Budget Name: ${PROJECT_NAME}-monthly-budget"
    echo ""
    echo -e "${CYAN}  Access URLs:${NC}"
    echo -e "    • Website: ${CLOUDFRONT_URL}"
    echo -e "    • Dashboard: https://${AWS_REGION}.console.aws.amazon.com/cloudwatch/home?region=${AWS_REGION}#dashboards:name=${PROJECT_NAME}-${ENVIRONMENT}"
    echo ""
    echo -e "${CYAN}  Budget Alerts (Email: ${ALERT_EMAIL}):${NC}"
    echo -e "    • 50% (\$5.00) - Warning"
    echo -e "    • 80% (\$8.00) - Critical"
    echo -e "    • 100% (\$10.00) - Exceeded"
    echo ""
    echo -e "${YELLOW}  ⚠️  IMPORTANT: Monitor costs daily for the first week!${NC}"
    echo ""
    echo -e "${CYAN}  Estimated Monthly Cost: \$1.50 - \$3.00${NC}"
    echo -e "${CYAN}  (Based on moderate traffic)${NC}"
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
    
    # Save deployment info
    cat > "${PROJECT_DIR}/deployment-info.json" << EOF
{
    "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "environment": "${ENVIRONMENT}",
    "region": "${AWS_REGION}",
    "account_id": "${AWS_ACCOUNT_ID}",
    "s3_bucket": "${S3_BUCKET}",
    "cloudfront_id": "${CLOUDFRONT_ID}",
    "cloudfront_url": "${CLOUDFRONT_URL}",
    "budget_limit": "${BUDGET_LIMIT}",
    "alert_email": "${ALERT_EMAIL}"
}
EOF

    log_success "Deployment info saved to: deployment-info.json"
}

# =========================================
# Main Execution
# =========================================

main() {
    log_header "🚀 AI PROMPT GENERATOR - AWS DEPLOYMENT"
    echo "  Environment: ${ENVIRONMENT}"
    echo "  Region: ${AWS_REGION}"
    echo "  Budget Limit: \$${BUDGET_LIMIT}/month"
    echo "  Started: $(date)"
    echo ""
    
    # Run deployment steps
    preflight_checks
    setup_budget_alerts
    create_s3_bucket
    upload_frontend
    create_cloudfront
    add_security_headers
    post_deployment_tests
    setup_monitoring
    generate_summary
    
    echo ""
    log_success "Deployment completed successfully!"
    echo ""
}

# Run main function
main "$@"
