# AI Prompt Generator - Cost Tracking Template

## 📊 Monthly Cost Tracker

### Budget: $10.00/month

---

## Current Month: January 2026

| Date | S3 | CloudFront | Route 53 | Other | Daily Total | Running Total |
|------|----:|----------:|----------:|------:|------------:|--------------:|
| 01/01 | $0.00 | $0.00 | $0.00 | $0.00 | $0.00 | $0.00 |
| 01/02 | | | | | | |
| 01/03 | | | | | | |
| 01/04 | | | | | | |
| 01/05 | | | | | | |
| 01/06 | | | | | | |
| 01/07 | | | | | | |
| ... | | | | | | |
| 01/31 | | | | | | |
| **TOTAL** | | | | | | |

---

## Monthly Summary

| Month | Budget | Actual | Variance | Status |
|-------|-------:|-------:|---------:|--------|
| Jan 2026 | $10.00 | | | |
| Feb 2026 | $10.00 | | | |
| Mar 2026 | $10.00 | | | |
| Apr 2026 | $10.00 | | | |
| May 2026 | $10.00 | | | |
| Jun 2026 | $10.00 | | | |
| Jul 2026 | $10.00 | | | |
| Aug 2026 | $10.00 | | | |
| Sep 2026 | $10.00 | | | |
| Oct 2026 | $10.00 | | | |
| Nov 2026 | $10.00 | | | |
| Dec 2026 | $10.00 | | | |

---

## Cost Breakdown by Service

### S3 Costs

| Component | Unit | Price | Usage | Monthly Cost |
|-----------|------|-------|-------|-------------:|
| Storage (Standard) | GB/month | $0.023 | 1 GB | $0.02 |
| PUT/POST requests | 1000 reqs | $0.005 | 10K | $0.05 |
| GET requests | 1000 reqs | $0.0004 | 100K | $0.04 |
| **Subtotal** | | | | **$0.11** |

### CloudFront Costs

| Component | Unit | Price | Usage | Monthly Cost |
|-----------|------|-------|-------|-------------:|
| Data Transfer (first 10TB) | GB | $0.085 | 10 GB | $0.85 |
| HTTPS Requests | 10K reqs | $0.0100 | 300K | $0.30 |
| **Subtotal** | | | | **$1.15** |

### Route 53 Costs (if applicable)

| Component | Unit | Price | Usage | Monthly Cost |
|-----------|------|-------|-------|-------------:|
| Hosted Zone | zone/month | $0.50 | 1 | $0.50 |
| DNS Queries | 1M queries | $0.40 | 0.1M | $0.04 |
| **Subtotal** | | | | **$0.54** |

---

## Alert Thresholds

| Threshold | Amount | Alert Type | Action |
|-----------|-------:|------------|--------|
| 50% | $5.00 | Email | Monitor closely |
| 80% | $8.00 | Email | Review traffic sources |
| 100% | $10.00 | Email | Consider cost reduction |
| Forecast > 100% | >$10.00 | Email | Immediate action needed |

---

## Cost Reduction Strategies

If approaching budget limit:

1. **Increase cache TTL** - Reduce origin requests
2. **Enable compression** - Reduce data transfer
3. **Geo-restrict** - Block high-cost regions
4. **Optimize images** - Reduce file sizes
5. **Remove unused assets** - Clean up S3

---

## Quick Reference Commands

```bash
# Check current costs
./scripts/cost-monitor.sh

# Export to CSV
./scripts/cost-monitor.sh --csv

# View budget status
./scripts/cost-monitor.sh --budget

# AWS Cost Explorer (in browser)
open "https://console.aws.amazon.com/cost-management/home#/cost-explorer"
```

---

## Notes

_Add any notes about unusual costs, traffic spikes, or other observations:_

| Date | Note |
|------|------|
| | |
| | |
| | |
