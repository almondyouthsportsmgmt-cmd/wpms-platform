# WPMS Release 2.1 — CRM & Marketing

## Added
- Customer lifetime value and visit-frequency profiles
- VIP, loyal, new, at-risk, dormant, and prospect segmentation
- Customer tags, referral sources, internal notes, and recommended next visit
- Lead management
- Email, SMS, and combined campaigns
- Audience targeting and scheduling
- Campaign opens, clicks, conversions, and attributed revenue
- Demo-mode persistence
- Idempotent Supabase migration

## Test checklist
1. Open CRM & Marketing.
2. Search and filter customer CRM profiles.
3. Create a campaign.
4. Change its lifecycle status.
5. Add a lead.
6. Refresh and verify persistence.
7. Run migration 020 after migrations 001–019.
