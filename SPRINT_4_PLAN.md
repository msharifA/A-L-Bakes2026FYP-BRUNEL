# Sprint 4: AWS Integration & Evaluation Testing

**Student:** 2376659
**Duration:** January 2026 - February 2026
**Goal:** Complete AWS service integration and conduct all evaluation metrics testing

---

## Sprint Overview

| Category | Target |
|----------|--------|
| AWS SES/SNS Integration | Replace Gmail with AWS email services |
| CloudWatch Monitoring | TTFB <600ms, ≥99.5% uptime |
| Usability Testing | SUS ≥80, Task completion ≥90% |
| Accessibility | WCAG 2.1 AA compliance |
| Data Integrity | ≥98% order writes, ≥95% payment success |

---

## Week 1: AWS SES Email Integration

### Tasks
- [ ] Verify domain in AWS SES (albakes.co.uk or use sandbox)
- [ ] Create SES email templates for:
  - [ ] Order confirmation
  - [ ] Password reset (replace current Gmail)
  - [ ] Admin new order notification
- [ ] Update `server/services/email.service.js` to use AWS SES
- [ ] Test email delivery in sandbox mode
- [ ] Request SES production access (if needed)

### Deliverables
- Working order confirmation emails via SES
- Password reset emails via SES
- Screenshot evidence of SES console

---

## Week 2: AWS SNS Admin Notifications

### Tasks
- [ ] Create SNS topic: `albakes-admin-notifications`
- [ ] Subscribe admin email/SMS to topic
- [ ] Create notification triggers for:
  - [ ] New order placed
  - [ ] Low stock alerts (optional)
  - [ ] Daily sales summary
- [ ] Integrate SNS publish into order controller
- [ ] Test notification delivery

### Deliverables
- Admin receives instant order notifications
- SNS topic configuration screenshot
- Notification logs

---

## Week 3: CloudWatch Monitoring & Performance

### Tasks
- [ ] Create CloudWatch dashboard: `ALBakes-Production`
- [ ] Configure alarms:
  - [ ] TTFB >600ms alert
  - [ ] Error rate >1% alert
  - [ ] Uptime monitoring
- [ ] Enable detailed EB metrics
- [ ] Run load testing (Apache Bench or similar)
- [ ] Document baseline performance metrics

### Metrics to Capture
| Metric | Target | Method |
|--------|--------|--------|
| TTFB (95th percentile) | <600ms | CloudWatch |
| Uptime | ≥99.5% | CloudWatch |
| API response time | <500ms | Custom logging |
| Database query time | <100ms | RDS metrics |

### Deliverables
- CloudWatch dashboard screenshot
- Performance report (PDF)
- Load test results

---

## Week 4: Usability Testing (SUS Survey)

### Participant Requirements
- Minimum 5 participants
- Mix of: bakery owner (1), potential customers (4)
- Age range: 18-65

### Test Scenarios
1. **Browse & Add to Cart** (2 min)
   - Find "Chocolate Cake", add to cart with customisation

2. **Complete Checkout** (3 min)
   - Enter details, review order, complete Stripe payment

3. **Track Order** (1 min)
   - View order status after purchase

4. **Admin: Manage Order** (2 min)
   - Login as admin, update order status

5. **Password Reset** (2 min)
   - Request reset, complete flow

### Measurements
| Metric | Target | How to Measure |
|--------|--------|----------------|
| Task Completion Rate | ≥90% | Pass/fail per task |
| SUS Score | ≥80 | Post-test questionnaire |
| Time on Task | Baseline | Stopwatch |
| Error Rate | <10% | Count mistakes |

### SUS Questionnaire (10 questions, 1-5 scale)
1. I think I would like to use this system frequently
2. I found the system unnecessarily complex
3. I thought the system was easy to use
4. I think I would need technical support to use this system
5. I found the various functions well integrated
6. I thought there was too much inconsistency
7. I imagine most people would learn to use this quickly
8. I found the system very cumbersome to use
9. I felt very confident using the system
10. I needed to learn a lot before I could get going

### Deliverables
- Completed SUS surveys (5+)
- Task completion log
- Video recordings (optional)
- Summary report with scores

---

## Week 5: Accessibility Audit (WCAG 2.1 AA)

### Tools
- [ ] axe DevTools (Chrome extension)
- [ ] WAVE Web Accessibility Evaluator
- [ ] Lighthouse Accessibility audit
- [ ] Manual keyboard navigation test

### Pages to Audit
1. Home page
2. Product listing (Menu)
3. Product detail
4. Cart
5. Checkout flow
6. Order success
7. Admin dashboard
8. Login/Register pages

### WCAG 2.1 AA Checklist
- [ ] Colour contrast ratio ≥4.5:1
- [ ] All images have alt text
- [ ] Form fields have labels
- [ ] Focus indicators visible
- [ ] Keyboard navigation works
- [ ] Error messages are clear
- [ ] Page titles are descriptive
- [ ] Headings are hierarchical

### Deliverables
- Lighthouse reports (PDF)
- axe scan results
- Fixes implemented
- Final compliance score

---

## Week 6: Data Integrity & Final Testing

### Order Write Success Rate (Target: ≥98%)
```sql
-- Query to run on RDS
SELECT
  COUNT(*) as total_attempts,
  COUNT(CASE WHEN status != 'failed' THEN 1 END) as successful,
  ROUND(COUNT(CASE WHEN status != 'failed' THEN 1 END)::decimal / COUNT(*) * 100, 2) as success_rate
FROM orders
WHERE created_at > NOW() - INTERVAL '30 days';
```

### Payment Success Rate (Target: ≥95%)
- Export Stripe dashboard data
- Calculate: (Successful payments / Total attempts) × 100
- Exclude genuine declines (insufficient funds, etc.)

### Final Checklist
- [ ] All 5+ SUS surveys completed
- [ ] CloudWatch metrics exported
- [ ] Stripe payment report exported
- [ ] Database integrity verified
- [ ] Accessibility fixes deployed
- [ ] All evidence screenshots saved

---

## Instagram Comparison Evidence

### Cognitive Load Documentation
Create side-by-side comparison showing:

| Aspect | Instagram DMs | A&L Bakes Platform |
|--------|--------------|-------------------|
| Order placement | 5+ back-and-forth messages | 3 clicks |
| Payment | Manual bank transfer | Instant Stripe |
| Order tracking | Ask via DM | Self-service page |
| Order history | Scroll through DMs | Dashboard view |
| Delivery scheduling | Negotiate via chat | Calendar picker |
| Customisation | Describe in text | Form fields |

### Evidence to Collect
- [ ] 3-5 Instagram DM order screenshots (anonymised)
- [ ] Time comparison (DM: ~15 min vs Website: ~3 min)
- [ ] Error examples from DM orders
- [ ] Customer feedback quotes

---

## Deliverables Summary

| Deliverable | Format | Due |
|-------------|--------|-----|
| SES Integration | Code + screenshots | Week 1 |
| SNS Integration | Code + screenshots | Week 2 |
| CloudWatch Dashboard | Screenshots + PDF | Week 3 |
| SUS Survey Results | Spreadsheet + Report | Week 4 |
| Accessibility Report | PDF + Lighthouse | Week 5 |
| Data Integrity Report | SQL output + analysis | Week 6 |
| Instagram Comparison | Screenshots + table | Week 6 |

---

## Success Criteria

Sprint 4 is complete when:
- [x] Gmail replaced with AWS SES
- [x] SNS admin notifications working
- [x] CloudWatch shows TTFB <600ms, uptime ≥99.5%
- [x] SUS score ≥80 from 5+ participants
- [x] Task completion rate ≥90%
- [x] WCAG 2.1 AA compliance verified
- [x] Order write success ≥98%
- [x] Payment success ≥95%
- [x] All evidence documented for dissertation

---

## Notes

**Notion Board Structure:**
```
Sprint 4
├── Backlog
├── In Progress
├── Review
├── Done
└── Blocked
```

**Risk Mitigation:**
- SES sandbox limits: Request production access early
- Participant recruitment: Use Brunel students + family
- CloudWatch costs: Set budget alerts

**Contact:**
- Supervisor: Dr Nura Abubakar
- AWS Support: via console ticket
