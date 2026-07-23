# WPMS Release 1.2 — AI Receptionist Foundation

## Added
- AI Receptionist navigation and workspace
- Conversation queue with Open, Escalated, and Resolved statuses
- Intent classification for appointments, boarding, pricing, vaccines, hours, and staff requests
- Suggested customer replies
- Suggested next actions
- Confidence scoring
- Staff escalation workflow
- Safe response simulator
- Demo-mode persistence
- Supabase AI receptionist conversation table and RLS

## Safety boundary
This foundation operates in assist mode. It does not automatically send messages, cancel appointments, change bookings, or charge customers.

## Test checklist
1. Open AI Receptionist.
2. Search and filter conversations.
3. Resolve and escalate conversations.
4. Enter sample customer questions in Response Studio.
5. Confirm intent, reply, action, confidence, and escalation recommendation.
6. Refresh and confirm status persistence.
