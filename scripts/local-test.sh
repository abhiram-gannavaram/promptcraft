#!/bin/bash

# =========================================
# AI Prompt Generator - Local Testing Suite
# =========================================
# Comprehensive automated testing for local development
# Run: chmod +x scripts/local-test.sh && ./scripts/local-test.sh
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
TEST_REPORT_DIR="${PROJECT_DIR}/test-reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOCAL_PORT="${LOCAL_PORT:-8080}"

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_SKIPPED=0

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

log_section() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}  📋 $1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

log_test() {
    echo -e "${BLUE}  🧪 Testing: $1${NC}"
}

log_pass() {
    echo -e "${GREEN}  ✅ PASS: $1${NC}"
    ((TESTS_PASSED++))
}

log_fail() {
    echo -e "${RED}  ❌ FAIL: $1${NC}"
    ((TESTS_FAILED++))
}

log_skip() {
    echo -e "${YELLOW}  ⏭️  SKIP: $1${NC}"
    ((TESTS_SKIPPED++))
}

log_info() {
    echo -e "${BLUE}  ℹ️  $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}  ⚠️  $1${NC}"
}

check_command() {
    if command -v "$1" &> /dev/null; then
        return 0
    else
        return 1
    fi
}

# =========================================
# Pre-flight Checks
# =========================================

preflight_checks() {
    log_header "🚀 PRE-FLIGHT CHECKS"
    
    log_test "Checking required tools..."
    
    # Check Node.js
    if check_command node; then
        NODE_VERSION=$(node --version)
        log_pass "Node.js installed: ${NODE_VERSION}"
    else
        log_fail "Node.js not installed"
        echo "  Install with: brew install node (macOS) or download from nodejs.org"
    fi
    
    # Check npm
    if check_command npm; then
        NPM_VERSION=$(npm --version)
        log_pass "npm installed: v${NPM_VERSION}"
    else
        log_fail "npm not installed"
    fi
    
    # Check Python
    if check_command python3; then
        PYTHON_VERSION=$(python3 --version)
        log_pass "Python installed: ${PYTHON_VERSION}"
    else
        log_skip "Python not installed (optional)"
    fi
    
    # Check Git
    if check_command git; then
        GIT_VERSION=$(git --version | cut -d' ' -f3)
        log_pass "Git installed: v${GIT_VERSION}"
    else
        log_fail "Git not installed"
    fi
    
    # Check AWS CLI (optional for local testing)
    if check_command aws; then
        AWS_VERSION=$(aws --version 2>&1 | cut -d' ' -f1)
        log_pass "AWS CLI installed: ${AWS_VERSION}"
    else
        log_skip "AWS CLI not installed (needed for deployment)"
    fi
    
    # Check project structure
    log_test "Checking project structure..."
    
    REQUIRED_FILES=(
        "frontend/index.html"
        "frontend/css/styles.css"
        "frontend/js/app.js"
        "package.json"
    )
    
    for file in "${REQUIRED_FILES[@]}"; do
        if [ -f "${PROJECT_DIR}/${file}" ]; then
            log_pass "Found: ${file}"
        else
            log_fail "Missing: ${file}"
        fi
    done
    
    # Create test report directory
    mkdir -p "${TEST_REPORT_DIR}"
}

# =========================================
# Install Dependencies
# =========================================

install_dependencies() {
    log_header "📦 INSTALLING DEPENDENCIES"
    
    cd "${PROJECT_DIR}"
    
    if [ -f "package.json" ]; then
        log_info "Installing npm dependencies..."
        npm install 2>&1 | tail -5
        log_pass "Dependencies installed"
    else
        log_fail "package.json not found"
    fi
    
    # Install additional testing tools if not present
    if ! check_command http-server; then
        log_info "Installing http-server globally..."
        npm install -g http-server 2>&1 | tail -2
    fi
}

# =========================================
# HTML Validation
# =========================================

validate_html() {
    log_section "HTML VALIDATION"
    
    HTML_FILES=$(find "${FRONTEND_DIR}" -name "*.html" 2>/dev/null)
    
    for html_file in $HTML_FILES; do
        filename=$(basename "$html_file")
        log_test "Validating: ${filename}"
        
        # Check for DOCTYPE
        if head -1 "$html_file" | grep -qi "<!DOCTYPE html>"; then
            log_pass "${filename}: DOCTYPE present"
        else
            log_fail "${filename}: DOCTYPE missing"
        fi
        
        # Check for lang attribute
        if grep -q '<html.*lang=' "$html_file"; then
            log_pass "${filename}: lang attribute present"
        else
            log_fail "${filename}: lang attribute missing"
        fi
        
        # Check for meta charset
        if grep -q 'charset=' "$html_file"; then
            log_pass "${filename}: charset defined"
        else
            log_fail "${filename}: charset missing"
        fi
        
        # Check for viewport meta
        if grep -q 'viewport' "$html_file"; then
            log_pass "${filename}: viewport meta present"
        else
            log_fail "${filename}: viewport meta missing"
        fi
        
        # Check for title
        if grep -q '<title>' "$html_file"; then
            log_pass "${filename}: title present"
        else
            log_fail "${filename}: title missing"
        fi
        
        # Check for closing tags
        OPEN_DIVS=$(grep -o '<div' "$html_file" | wc -l)
        CLOSE_DIVS=$(grep -o '</div>' "$html_file" | wc -l)
        if [ "$OPEN_DIVS" -eq "$CLOSE_DIVS" ]; then
            log_pass "${filename}: div tags balanced (${OPEN_DIVS}/${CLOSE_DIVS})"
        else
            log_warning "${filename}: div tags may be unbalanced (${OPEN_DIVS} open, ${CLOSE_DIVS} close)"
        fi
    done
}

# =========================================
# CSS Validation
# =========================================

validate_css() {
    log_section "CSS VALIDATION"
    
    CSS_FILES=$(find "${FRONTEND_DIR}" -name "*.css" 2>/dev/null)
    
    for css_file in $CSS_FILES; do
        filename=$(basename "$css_file")
        log_test "Validating: ${filename}"
        
        # Check for syntax errors (basic check)
        OPEN_BRACES=$(grep -o '{' "$css_file" | wc -l)
        CLOSE_BRACES=$(grep -o '}' "$css_file" | wc -l)
        if [ "$OPEN_BRACES" -eq "$CLOSE_BRACES" ]; then
            log_pass "${filename}: braces balanced (${OPEN_BRACES})"
        else
            log_fail "${filename}: braces unbalanced (${OPEN_BRACES} open, ${CLOSE_BRACES} close)"
        fi
        
        # Check for CSS variables (modern CSS)
        if grep -q ':root' "$css_file"; then
            log_pass "${filename}: CSS variables defined"
        else
            log_skip "${filename}: no CSS variables (optional)"
        fi
        
        # Check for responsive design
        if grep -q '@media' "$css_file"; then
            MEDIA_COUNT=$(grep -c '@media' "$css_file")
            log_pass "${filename}: ${MEDIA_COUNT} media queries found"
        else
            log_warning "${filename}: no media queries (responsive design issue?)"
        fi
        
        # Check file size
        FILE_SIZE=$(wc -c < "$css_file")
        if [ "$FILE_SIZE" -lt 500000 ]; then
            log_pass "${filename}: size OK (${FILE_SIZE} bytes)"
        else
            log_warning "${filename}: large file (${FILE_SIZE} bytes) - consider minification"
        fi
    done
}

# =========================================
# JavaScript Validation
# =========================================

validate_javascript() {
    log_section "JAVASCRIPT VALIDATION"
    
    JS_FILES=$(find "${FRONTEND_DIR}" -name "*.js" 2>/dev/null)
    
    for js_file in $JS_FILES; do
        filename=$(basename "$js_file")
        log_test "Validating: ${filename}"
        
        # Check for strict mode
        if head -5 "$js_file" | grep -q "'use strict'\|\"use strict\""; then
            log_pass "${filename}: strict mode enabled"
        else
            log_skip "${filename}: strict mode not found (optional)"
        fi
        
        # Check for console.log (should be removed in production)
        CONSOLE_COUNT=$(grep -c 'console.log' "$js_file" 2>/dev/null || echo "0")
        if [ "$CONSOLE_COUNT" -gt 0 ]; then
            log_warning "${filename}: ${CONSOLE_COUNT} console.log statements found (remove for production)"
        else
            log_pass "${filename}: no console.log statements"
        fi
        
        # Check for hardcoded API keys (security!)
        if grep -qi 'api[_-]?key.*=.*["\x27][a-zA-Z0-9]' "$js_file"; then
            log_fail "${filename}: POTENTIAL HARDCODED API KEY FOUND!"
        else
            log_pass "${filename}: no hardcoded API keys detected"
        fi
        
        # Check for eval (security risk)
        if grep -q 'eval(' "$js_file"; then
            log_warning "${filename}: eval() found (potential security risk)"
        else
            log_pass "${filename}: no eval() usage"
        fi
        
        # Check for innerHTML without sanitization
        if grep -q '\.innerHTML\s*=' "$js_file"; then
            log_warning "${filename}: innerHTML assignment found (ensure input is sanitized)"
        fi
        
        # Syntax check with Node.js
        if check_command node; then
            if node --check "$js_file" 2>/dev/null; then
                log_pass "${filename}: syntax valid"
            else
                log_fail "${filename}: syntax error detected"
            fi
        fi
    done
    
    # Run ESLint if available
    if check_command npx && [ -f "${PROJECT_DIR}/node_modules/.bin/eslint" ]; then
        log_test "Running ESLint..."
        cd "${PROJECT_DIR}"
        if npx eslint "${FRONTEND_DIR}/js/" --format compact 2>/dev/null | head -10; then
            log_pass "ESLint completed"
        else
            log_skip "ESLint configuration not found"
        fi
    fi
}

# =========================================
# Security Checks
# =========================================

security_checks() {
    log_section "SECURITY CHECKS"
    
    log_test "Checking for exposed secrets..."
    
    # Check for API keys in code
    SENSITIVE_PATTERNS=(
        "sk-[a-zA-Z0-9]{32,}"
        "AKIA[A-Z0-9]{16}"
        "api[_-]?key.*['\"][a-zA-Z0-9]{20,}"
        "password.*['\"][^'\"]{8,}"
        "secret.*['\"][a-zA-Z0-9]{16,}"
    )
    
    SECRETS_FOUND=0
    for pattern in "${SENSITIVE_PATTERNS[@]}"; do
        if grep -rE "$pattern" "${FRONTEND_DIR}" 2>/dev/null | grep -v "example\|sample\|placeholder"; then
            log_fail "Potential secret found matching pattern: ${pattern}"
            ((SECRETS_FOUND++))
        fi
    done
    
    if [ "$SECRETS_FOUND" -eq 0 ]; then
        log_pass "No exposed secrets detected in frontend code"
    fi
    
    # Check .env file not in frontend
    if [ -f "${FRONTEND_DIR}/.env" ]; then
        log_fail ".env file found in frontend directory (security risk!)"
    else
        log_pass "No .env file in frontend directory"
    fi
    
    # Check .gitignore
    if [ -f "${PROJECT_DIR}/.gitignore" ]; then
        if grep -q ".env" "${PROJECT_DIR}/.gitignore"; then
            log_pass ".env is in .gitignore"
        else
            log_fail ".env is NOT in .gitignore (add it!)"
        fi
        
        if grep -q "node_modules" "${PROJECT_DIR}/.gitignore"; then
            log_pass "node_modules is in .gitignore"
        else
            log_fail "node_modules is NOT in .gitignore"
        fi
    else
        log_fail ".gitignore not found"
    fi
    
    # Check for HTTPS enforcement ready
    log_test "Checking HTTPS readiness..."
    if grep -r "http://" "${FRONTEND_DIR}" 2>/dev/null | grep -v "localhost\|127.0.0.1\|http://www.w3.org"; then
        log_warning "Found http:// URLs (ensure these are changed to https:// for production)"
    else
        log_pass "No insecure http:// URLs found"
    fi
    
    # Check Content Security Policy hints
    if grep -q "Content-Security-Policy" "${FRONTEND_DIR}/index.html" 2>/dev/null; then
        log_pass "CSP meta tag found in HTML"
    else
        log_skip "CSP should be added via CloudFront headers"
    fi
}

# =========================================
# Accessibility Checks
# =========================================

accessibility_checks() {
    log_section "ACCESSIBILITY CHECKS"
    
    HTML_FILE="${FRONTEND_DIR}/index.html"
    
    if [ ! -f "$HTML_FILE" ]; then
        log_fail "index.html not found"
        return
    fi
    
    log_test "Checking accessibility features..."
    
    # Check for alt attributes on images
    IMAGES=$(grep -c '<img' "$HTML_FILE" 2>/dev/null || echo "0")
    IMAGES_WITH_ALT=$(grep -c '<img[^>]*alt=' "$HTML_FILE" 2>/dev/null || echo "0")
    if [ "$IMAGES" -eq "$IMAGES_WITH_ALT" ]; then
        log_pass "All images have alt attributes (${IMAGES}/${IMAGES})"
    else
        log_fail "Some images missing alt attributes (${IMAGES_WITH_ALT}/${IMAGES})"
    fi
    
    # Check for form labels
    INPUTS=$(grep -cE '<input|<textarea|<select' "$HTML_FILE" 2>/dev/null || echo "0")
    LABELS=$(grep -c '<label' "$HTML_FILE" 2>/dev/null || echo "0")
    if [ "$LABELS" -gt 0 ]; then
        log_pass "Form labels present (${LABELS} labels for ${INPUTS} inputs)"
    else
        log_warning "No <label> elements found"
    fi
    
    # Check for ARIA attributes
    if grep -q 'aria-' "$HTML_FILE"; then
        ARIA_COUNT=$(grep -c 'aria-' "$HTML_FILE")
        log_pass "ARIA attributes present (${ARIA_COUNT} found)"
    else
        log_warning "No ARIA attributes found"
    fi
    
    # Check for skip link
    if grep -qi 'skip' "$HTML_FILE"; then
        log_pass "Skip link appears to be present"
    else
        log_warning "Skip link not found (recommended for accessibility)"
    fi
    
    # Check for role attributes
    if grep -q 'role=' "$HTML_FILE"; then
        log_pass "Role attributes present"
    else
        log_skip "Role attributes not found (semantic HTML may suffice)"
    fi
    
    # Check heading hierarchy
    H1_COUNT=$(grep -c '<h1' "$HTML_FILE" 2>/dev/null || echo "0")
    if [ "$H1_COUNT" -eq 1 ]; then
        log_pass "Single H1 heading found"
    elif [ "$H1_COUNT" -eq 0 ]; then
        log_fail "No H1 heading found"
    else
        log_warning "Multiple H1 headings found (${H1_COUNT}) - should have only 1"
    fi
}

# =========================================
# Performance Checks
# =========================================

performance_checks() {
    log_section "PERFORMANCE CHECKS"
    
    log_test "Checking file sizes..."
    
    # Check HTML size
    if [ -f "${FRONTEND_DIR}/index.html" ]; then
        HTML_SIZE=$(wc -c < "${FRONTEND_DIR}/index.html")
        if [ "$HTML_SIZE" -lt 100000 ]; then
            log_pass "HTML size OK: ${HTML_SIZE} bytes"
        else
            log_warning "HTML file large: ${HTML_SIZE} bytes - consider optimization"
        fi
    fi
    
    # Check CSS size
    if [ -f "${FRONTEND_DIR}/css/styles.css" ]; then
        CSS_SIZE=$(wc -c < "${FRONTEND_DIR}/css/styles.css")
        if [ "$CSS_SIZE" -lt 200000 ]; then
            log_pass "CSS size OK: ${CSS_SIZE} bytes"
        else
            log_warning "CSS file large: ${CSS_SIZE} bytes - consider minification"
        fi
    fi
    
    # Check JS size
    if [ -f "${FRONTEND_DIR}/js/app.js" ]; then
        JS_SIZE=$(wc -c < "${FRONTEND_DIR}/js/app.js")
        if [ "$JS_SIZE" -lt 500000 ]; then
            log_pass "JS size OK: ${JS_SIZE} bytes"
        else
            log_warning "JS file large: ${JS_SIZE} bytes - consider minification"
        fi
    fi
    
    # Check for image optimization opportunities
    log_test "Checking image optimization..."
    LARGE_IMAGES=$(find "${FRONTEND_DIR}" -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" \) -size +500k 2>/dev/null | wc -l)
    if [ "$LARGE_IMAGES" -gt 0 ]; then
        log_warning "${LARGE_IMAGES} image(s) over 500KB - consider optimization"
    else
        log_pass "No oversized images found"
    fi
    
    # Calculate total frontend size
    TOTAL_SIZE=$(du -sh "${FRONTEND_DIR}" 2>/dev/null | cut -f1)
    log_info "Total frontend size: ${TOTAL_SIZE}"
}

# =========================================
# SEO Checks
# =========================================

seo_checks() {
    log_section "SEO CHECKS"
    
    HTML_FILE="${FRONTEND_DIR}/index.html"
    
    if [ ! -f "$HTML_FILE" ]; then
        log_fail "index.html not found"
        return
    fi
    
    log_test "Checking SEO elements..."
    
    # Check meta description
    if grep -q 'name="description"' "$HTML_FILE"; then
        log_pass "Meta description present"
    else
        log_fail "Meta description missing"
    fi
    
    # Check Open Graph tags
    if grep -q 'og:title' "$HTML_FILE"; then
        log_pass "Open Graph tags present"
    else
        log_warning "Open Graph tags missing (recommended for social sharing)"
    fi
    
    # Check Twitter Cards
    if grep -q 'twitter:' "$HTML_FILE"; then
        log_pass "Twitter Card tags present"
    else
        log_warning "Twitter Card tags missing"
    fi
    
    # Check canonical URL
    if grep -q 'rel="canonical"' "$HTML_FILE"; then
        log_pass "Canonical URL present"
    else
        log_skip "Canonical URL not set (add after deployment)"
    fi
    
    # Check robots.txt
    if [ -f "${FRONTEND_DIR}/robots.txt" ]; then
        log_pass "robots.txt present"
    else
        log_fail "robots.txt missing"
    fi
    
    # Check sitemap.xml
    if [ -f "${FRONTEND_DIR}/sitemap.xml" ]; then
        log_pass "sitemap.xml present"
    else
        log_fail "sitemap.xml missing"
    fi
    
    # Check favicon
    if [ -f "${FRONTEND_DIR}/images/favicon.svg" ] || [ -f "${FRONTEND_DIR}/favicon.ico" ]; then
        log_pass "Favicon present"
    else
        log_warning "Favicon missing"
    fi
    
    # Check structured data
    if grep -q 'application/ld+json' "$HTML_FILE"; then
        log_pass "Structured data (JSON-LD) present"
    else
        log_warning "Structured data missing (recommended for SEO)"
    fi
}

# =========================================
# Local Server Test
# =========================================

test_local_server() {
    log_section "LOCAL SERVER TEST"
    
    # Check if port is available
    if lsof -i ":${LOCAL_PORT}" > /dev/null 2>&1; then
        log_warning "Port ${LOCAL_PORT} is already in use"
        log_info "Checking if existing server is serving our files..."
        
        if curl -s "http://localhost:${LOCAL_PORT}" | grep -q "AI Prompt Generator\|prompt"; then
            log_pass "Local server already running and serving correct content"
            return 0
        else
            log_fail "Port ${LOCAL_PORT} is in use by another application"
            return 1
        fi
    fi
    
    log_test "Starting local server on port ${LOCAL_PORT}..."
    
    cd "${FRONTEND_DIR}"
    
    # Start server in background
    if check_command npx; then
        npx http-server -p "${LOCAL_PORT}" -s &
        SERVER_PID=$!
    elif check_command python3; then
        python3 -m http.server "${LOCAL_PORT}" &
        SERVER_PID=$!
    else
        log_fail "No suitable server available (install Node.js or Python)"
        return 1
    fi
    
    # Wait for server to start
    sleep 2
    
    # Test server is responding
    log_test "Testing server response..."
    
    if curl -s -o /dev/null -w "%{http_code}" "http://localhost:${LOCAL_PORT}" | grep -q "200"; then
        log_pass "Server responding with 200 OK"
    else
        log_fail "Server not responding correctly"
    fi
    
    # Test page content
    RESPONSE=$(curl -s "http://localhost:${LOCAL_PORT}")
    
    if echo "$RESPONSE" | grep -q "<title>"; then
        log_pass "HTML title tag present in response"
    else
        log_fail "HTML title tag not found"
    fi
    
    # Stop server
    kill $SERVER_PID 2>/dev/null
    log_info "Local server stopped"
    
    log_pass "Local server test completed"
}

# =========================================
# NPM Audit (Security)
# =========================================

npm_security_audit() {
    log_section "NPM SECURITY AUDIT"
    
    cd "${PROJECT_DIR}"
    
    if [ ! -f "package-lock.json" ] && [ ! -f "package.json" ]; then
        log_skip "No package.json found"
        return
    fi
    
    log_test "Running npm audit..."
    
    AUDIT_OUTPUT=$(npm audit 2>&1)
    
    if echo "$AUDIT_OUTPUT" | grep -q "found 0 vulnerabilities"; then
        log_pass "No vulnerabilities found"
    elif echo "$AUDIT_OUTPUT" | grep -q "found.*low"; then
        log_warning "Low severity vulnerabilities found - run 'npm audit' for details"
    elif echo "$AUDIT_OUTPUT" | grep -q "found.*moderate\|high\|critical"; then
        log_fail "Security vulnerabilities found - run 'npm audit fix' to resolve"
        echo "$AUDIT_OUTPUT" | grep -E "Severity:|found" | head -10
    else
        log_info "Unable to determine audit status"
    fi
}

# =========================================
# Lighthouse Audit (if available)
# =========================================

lighthouse_audit() {
    log_section "LIGHTHOUSE AUDIT"
    
    if ! check_command lighthouse; then
        log_skip "Lighthouse not installed (npm install -g lighthouse)"
        log_info "To install: npm install -g lighthouse"
        return
    fi
    
    # Start local server for Lighthouse
    cd "${FRONTEND_DIR}"
    npx http-server -p "${LOCAL_PORT}" -s &
    SERVER_PID=$!
    sleep 3
    
    log_test "Running Lighthouse audit..."
    
    LIGHTHOUSE_REPORT="${TEST_REPORT_DIR}/lighthouse-${TIMESTAMP}.html"
    
    lighthouse "http://localhost:${LOCAL_PORT}" \
        --output=html \
        --output-path="${LIGHTHOUSE_REPORT}" \
        --chrome-flags="--headless" \
        --quiet \
        2>/dev/null
    
    if [ -f "$LIGHTHOUSE_REPORT" ]; then
        log_pass "Lighthouse report generated: ${LIGHTHOUSE_REPORT}"
    else
        log_warning "Lighthouse audit completed but report may have issues"
    fi
    
    # Stop server
    kill $SERVER_PID 2>/dev/null
}

# =========================================
# Generate Test Report
# =========================================

generate_report() {
    log_header "📊 TEST REPORT"
    
    TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED + TESTS_SKIPPED))
    PASS_RATE=0
    if [ "$TOTAL_TESTS" -gt 0 ]; then
        PASS_RATE=$((TESTS_PASSED * 100 / TOTAL_TESTS))
    fi
    
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "  ${GREEN}✅ Passed: ${TESTS_PASSED}${NC}"
    echo -e "  ${RED}❌ Failed: ${TESTS_FAILED}${NC}"
    echo -e "  ${YELLOW}⏭️  Skipped: ${TESTS_SKIPPED}${NC}"
    echo -e "  ${BLUE}📊 Total: ${TOTAL_TESTS}${NC}"
    echo -e "  ${PURPLE}📈 Pass Rate: ${PASS_RATE}%${NC}"
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
    
    # Write report to file
    REPORT_FILE="${TEST_REPORT_DIR}/test-report-${TIMESTAMP}.txt"
    
    cat > "$REPORT_FILE" << EOF
AI Prompt Generator - Test Report
Generated: $(date)
========================================

SUMMARY
-------
Passed:  ${TESTS_PASSED}
Failed:  ${TESTS_FAILED}
Skipped: ${TESTS_SKIPPED}
Total:   ${TOTAL_TESTS}
Pass Rate: ${PASS_RATE}%

NEXT STEPS
----------
EOF

    if [ "$TESTS_FAILED" -gt 0 ]; then
        echo "1. Review failed tests above" >> "$REPORT_FILE"
        echo "2. Fix issues before deployment" >> "$REPORT_FILE"
        echo "3. Re-run tests to verify fixes" >> "$REPORT_FILE"
        
        echo ""
        echo -e "${RED}⚠️  Some tests failed. Review issues above before deployment.${NC}"
    else
        echo "1. All tests passed - ready for deployment!" >> "$REPORT_FILE"
        echo "2. Run: ./scripts/deploy-aws.sh production" >> "$REPORT_FILE"
        
        echo ""
        echo -e "${GREEN}🎉 All tests passed! Ready for deployment.${NC}"
    fi
    
    echo ""
    log_info "Report saved: ${REPORT_FILE}"
    echo ""
}

# =========================================
# Main Execution
# =========================================

main() {
    log_header "🧪 AI PROMPT GENERATOR - LOCAL TESTING SUITE"
    echo "  Started: $(date)"
    echo "  Project: ${PROJECT_DIR}"
    
    # Run all checks
    preflight_checks
    install_dependencies
    validate_html
    validate_css
    validate_javascript
    security_checks
    accessibility_checks
    performance_checks
    seo_checks
    test_local_server
    npm_security_audit
    
    # Optional: Lighthouse audit (takes longer)
    if [ "${RUN_LIGHTHOUSE:-false}" = "true" ]; then
        lighthouse_audit
    else
        log_info "Skipping Lighthouse (set RUN_LIGHTHOUSE=true to enable)"
    fi
    
    # Generate final report
    generate_report
    
    # Exit with appropriate code
    if [ "$TESTS_FAILED" -gt 0 ]; then
        exit 1
    else
        exit 0
    fi
}

# Run main function
main "$@"
