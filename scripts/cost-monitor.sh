#!/bin/bash

# =========================================
# AI Prompt Generator - Cost Monitor Script
# =========================================
# Monitor AWS costs and send alerts
# Run daily via cron: 0 9 * * * /path/to/cost-monitor.sh
# =========================================

set -e

# Configuration
AWS_REGION="${AWS_REGION:-us-east-1}"
PROJECT_NAME="ai-prompt-generator"
BUDGET_LIMIT="10.00"
ALERT_EMAIL="${ALERT_EMAIL:-}"
SLACK_WEBHOOK="${SLACK_WEBHOOK:-}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# =========================================
# Helper Functions
# =========================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

send_slack_alert() {
    if [ -n "$SLACK_WEBHOOK" ]; then
        curl -s -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$1\"}" \
            "$SLACK_WEBHOOK" > /dev/null
    fi
}

# =========================================
# Get Current Month Costs
# =========================================

get_current_costs() {
    log_info "Fetching current month costs..."
    
    START_DATE=$(date -u +%Y-%m-01)
    END_DATE=$(date -u +%Y-%m-%d)
    
    # Get total costs
    COST_DATA=$(aws ce get-cost-and-usage \
        --time-period Start="${START_DATE}",End="${END_DATE}" \
        --granularity MONTHLY \
        --metrics BlendedCost \
        --region us-east-1 \
        2>/dev/null)
    
    CURRENT_COST=$(echo "$COST_DATA" | jq -r '.ResultsByTime[0].Total.BlendedCost.Amount // "0"')
    
    echo "$CURRENT_COST"
}

# =========================================
# Get Cost by Service
# =========================================

get_costs_by_service() {
    log_info "Fetching costs by service..."
    
    START_DATE=$(date -u +%Y-%m-01)
    END_DATE=$(date -u +%Y-%m-%d)
    
    aws ce get-cost-and-usage \
        --time-period Start="${START_DATE}",End="${END_DATE}" \
        --granularity MONTHLY \
        --metrics BlendedCost \
        --group-by Type=DIMENSION,Key=SERVICE \
        --region us-east-1 \
        2>/dev/null | jq -r '.ResultsByTime[0].Groups[] | "\(.Keys[0]): $\(.Metrics.BlendedCost.Amount)"' | \
        while read line; do
            # Only show services with non-zero costs
            AMOUNT=$(echo "$line" | grep -oE '[0-9]+\.[0-9]+' | head -1)
            if [ "$(echo "$AMOUNT > 0.01" | bc -l 2>/dev/null || echo "0")" = "1" ]; then
                echo "  $line"
            fi
        done
}

# =========================================
# Get Forecasted Costs
# =========================================

get_forecast() {
    log_info "Fetching cost forecast..."
    
    START_DATE=$(date -u +%Y-%m-%d)
    END_DATE=$(date -u -v+1m +%Y-%m-01 2>/dev/null || date -u -d "+1 month" +%Y-%m-01)
    
    FORECAST=$(aws ce get-cost-forecast \
        --time-period Start="${START_DATE}",End="${END_DATE}" \
        --granularity MONTHLY \
        --metric BLENDED_COST \
        --region us-east-1 \
        2>/dev/null | jq -r '.Total.Amount // "0"')
    
    echo "$FORECAST"
}

# =========================================
# Check Budget Status
# =========================================

check_budget() {
    log_info "Checking budget status..."
    
    AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    BUDGET_NAME="${PROJECT_NAME}-monthly-budget"
    
    BUDGET_STATUS=$(aws budgets describe-budget \
        --account-id "${AWS_ACCOUNT_ID}" \
        --budget-name "${BUDGET_NAME}" \
        --region us-east-1 \
        2>/dev/null)
    
    if [ -n "$BUDGET_STATUS" ]; then
        BUDGET_LIMIT=$(echo "$BUDGET_STATUS" | jq -r '.Budget.BudgetLimit.Amount')
        ACTUAL_SPEND=$(echo "$BUDGET_STATUS" | jq -r '.Budget.CalculatedSpend.ActualSpend.Amount')
        FORECAST_SPEND=$(echo "$BUDGET_STATUS" | jq -r '.Budget.CalculatedSpend.ForecastedSpend.Amount // "N/A"')
        
        echo "Budget Limit: \$${BUDGET_LIMIT}"
        echo "Actual Spend: \$${ACTUAL_SPEND}"
        echo "Forecasted:   \$${FORECAST_SPEND}"
    else
        log_warning "Budget not found: ${BUDGET_NAME}"
    fi
}

# =========================================
# Generate Cost Report
# =========================================

generate_report() {
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    echo "  💰 AWS Cost Report - $(date '+%Y-%m-%d %H:%M:%S')"
    echo "═══════════════════════════════════════════════════════════════"
    echo ""
    
    CURRENT_COST=$(get_current_costs)
    FORECAST=$(get_forecast)
    
    # Calculate percentage of budget
    PERCENTAGE=$(echo "scale=1; ($CURRENT_COST / $BUDGET_LIMIT) * 100" | bc -l 2>/dev/null || echo "0")
    
    echo "📊 Summary"
    echo "───────────────────────────────────────────────────────────────"
    printf "  Budget Limit:    \$%s\n" "$BUDGET_LIMIT"
    printf "  Current Spend:   \$%.2f (%.1f%%)\n" "$CURRENT_COST" "$PERCENTAGE"
    printf "  Forecasted:      \$%.2f\n" "$FORECAST"
    echo ""
    
    # Visual progress bar
    BAR_LENGTH=40
    FILLED=$(echo "scale=0; ($PERCENTAGE * $BAR_LENGTH) / 100" | bc -l 2>/dev/null || echo "0")
    FILLED=${FILLED:-0}
    
    printf "  ["
    for ((i=0; i<BAR_LENGTH; i++)); do
        if [ $i -lt $FILLED ]; then
            if [ $i -lt $((BAR_LENGTH * 50 / 100)) ]; then
                printf "${GREEN}█${NC}"
            elif [ $i -lt $((BAR_LENGTH * 80 / 100)) ]; then
                printf "${YELLOW}█${NC}"
            else
                printf "${RED}█${NC}"
            fi
        else
            printf "░"
        fi
    done
    printf "] %.1f%%\n" "$PERCENTAGE"
    echo ""
    
    echo "📈 Costs by Service"
    echo "───────────────────────────────────────────────────────────────"
    get_costs_by_service
    echo ""
    
    echo "🎯 Budget Status"
    echo "───────────────────────────────────────────────────────────────"
    check_budget
    echo ""
    
    # Alerts
    echo "⚠️  Alerts"
    echo "───────────────────────────────────────────────────────────────"
    
    # Check thresholds
    if [ "$(echo "$CURRENT_COST >= $BUDGET_LIMIT" | bc -l 2>/dev/null || echo "0")" = "1" ]; then
        log_error "BUDGET EXCEEDED! Current: \$${CURRENT_COST}"
        send_slack_alert "🚨 AWS Budget EXCEEDED! Current spend: \$${CURRENT_COST} / \$${BUDGET_LIMIT}"
    elif [ "$(echo "$CURRENT_COST >= ($BUDGET_LIMIT * 0.8)" | bc -l 2>/dev/null || echo "0")" = "1" ]; then
        log_warning "80% of budget used! Current: \$${CURRENT_COST}"
        send_slack_alert "⚠️ AWS Budget at 80%! Current spend: \$${CURRENT_COST} / \$${BUDGET_LIMIT}"
    elif [ "$(echo "$CURRENT_COST >= ($BUDGET_LIMIT * 0.5)" | bc -l 2>/dev/null || echo "0")" = "1" ]; then
        log_warning "50% of budget used. Current: \$${CURRENT_COST}"
    else
        log_success "Spending within normal range"
    fi
    
    # Check forecast
    if [ "$(echo "$FORECAST > $BUDGET_LIMIT" | bc -l 2>/dev/null || echo "0")" = "1" ]; then
        log_warning "Forecast exceeds budget: \$${FORECAST}"
    fi
    
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    echo ""
}

# =========================================
# Export to CSV
# =========================================

export_csv() {
    OUTPUT_FILE="${1:-cost-report-$(date +%Y%m%d).csv}"
    
    log_info "Exporting cost data to CSV..."
    
    START_DATE=$(date -u +%Y-%m-01)
    END_DATE=$(date -u +%Y-%m-%d)
    
    # Header
    echo "Date,Service,Cost (USD)" > "$OUTPUT_FILE"
    
    # Get daily costs by service
    aws ce get-cost-and-usage \
        --time-period Start="${START_DATE}",End="${END_DATE}" \
        --granularity DAILY \
        --metrics BlendedCost \
        --group-by Type=DIMENSION,Key=SERVICE \
        --region us-east-1 \
        2>/dev/null | jq -r '.ResultsByTime[] | .TimePeriod.Start as $date | .Groups[] | [$date, .Keys[0], .Metrics.BlendedCost.Amount] | @csv' >> "$OUTPUT_FILE"
    
    log_success "Exported to: ${OUTPUT_FILE}"
}

# =========================================
# Setup Daily Monitoring
# =========================================

setup_cron() {
    log_info "Setting up daily cost monitoring..."
    
    SCRIPT_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/cost-monitor.sh"
    CRON_CMD="0 9 * * * ${SCRIPT_PATH} --report >> /tmp/aws-cost-report.log 2>&1"
    
    # Check if already in crontab
    if crontab -l 2>/dev/null | grep -q "cost-monitor.sh"; then
        log_warning "Cron job already exists"
    else
        (crontab -l 2>/dev/null; echo "$CRON_CMD") | crontab -
        log_success "Cron job added - will run daily at 9 AM"
    fi
}

# =========================================
# Main
# =========================================

main() {
    case "${1:-}" in
        --report)
            generate_report
            ;;
        --csv)
            export_csv "$2"
            ;;
        --setup)
            setup_cron
            ;;
        --budget)
            check_budget
            ;;
        --help)
            echo "Usage: $0 [--report|--csv|--setup|--budget|--help]"
            echo ""
            echo "Options:"
            echo "  --report    Generate and display cost report"
            echo "  --csv       Export cost data to CSV file"
            echo "  --setup     Setup daily cron job for monitoring"
            echo "  --budget    Check budget status"
            echo "  --help      Show this help message"
            ;;
        *)
            generate_report
            ;;
    esac
}

main "$@"
