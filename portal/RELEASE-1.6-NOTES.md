# WPMS Release 1.6 — AI Scheduling Assistant

## Added
- AI scheduling request workspace
- Customer and pet selection
- Service-based duration defaults
- Preferred date, time window, and staff
- Conflict detection against existing appointments
- Staff-role eligibility checks
- Pet preferred-groomer scoring
- Ranked appointment suggestions
- Recommendation reasons and warnings
- Saved plans for staff review
- Safety guardrail preventing automatic booking
- Supabase-ready scheduling-plan table

## Test checklist
1. Select a customer and pet.
2. Generate recommendations for a future date.
3. Confirm existing staff conflicts are excluded.
4. Choose a preferred employee and verify ranking changes.
5. Change service duration and regenerate.
6. Save a selected plan.
7. Refresh and confirm saved-plan count persists.
