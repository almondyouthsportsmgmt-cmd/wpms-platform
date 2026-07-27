import { useMemo, useState, type FormEvent } from "react";
import { ArrowRight, Mail, MessageSquareText, Search, Send, UserPlus, XCircle } from "lucide-react";
import { AppButton } from "../../../components/common/AppButton";
import type { CustomerInput } from "../../customers/customerTypes";
import type { MessageLead } from "./leadTypes";
import { useLeads } from "./useLeads";

const format = (value: string) => new Intl.DateTimeFormat("en-US", {
  month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
}).format(new Date(value));

function splitName(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  return { firstName: parts[0] ?? "Lead", lastName: parts.slice(1).join(" ") || "Customer" };
}

type Props = {
  onConvert: (lead: MessageLead, input: CustomerInput) => Promise<void>;
};

export default function NewLeadsPanel({ onConvert }: Props) {
  const { leads, activeLead, activeLeadId, loading, error, select, reply, update, close } = useLeads();
  const [query, setQuery] = useState("");
  const [body, setBody] = useState("");
  const [converting, setConverting] = useState(false);
  const [notice, setNotice] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return leads.filter((lead) => [lead.displayName, lead.phone, lead.email, lead.messages.at(-1)?.body].join(" ").toLowerCase().includes(needle));
  }, [leads, query]);

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  }

  async function submitReply(event: FormEvent) {
    event.preventDefault();
    if (!activeLead || !body.trim()) return;
    await reply(activeLead.id, body);
    setBody("");
    flash("Reply sent.");
  }

  async function convert() {
    if (!activeLead) return;
    setConverting(true);
    const name = splitName(activeLead.displayName);
    const preferred = activeLead.channel === "Email" ? "Email" : "Text";
    try {
      await onConvert(activeLead, {
        ...name,
        mobilePhone: activeLead.phone,
        homePhone: "",
        email: activeLead.email,
        streetAddress: "",
        city: "",
        state: "FL",
        zipCode: "",
        emergencyContactName: "",
        emergencyContactPhone: "",
        emergencyRelationship: "",
        preferredContactMethod: preferred,
        marketingOptIn: false,
        notes: ["Converted from Messages → New Leads.", activeLead.notes].filter(Boolean).join("\n"),
        isActive: true,
      });
      flash("Lead converted to customer.");
    } finally { setConverting(false); }
  }

  return (
    <section className="lead-workspace">
      <aside className="lead-list-panel">
        <div className="module-search"><Search size={18}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, phone, email, or message..."/></div>
        {loading && <div className="module-state compact"><div className="paw-loader">🐾</div></div>}
        {!loading && filtered.length === 0 && <div className="lead-empty"><MessageSquareText size={28}/><strong>No new leads</strong><span>Unknown SMS and email senders appear here.</span></div>}
        <div className="lead-list">
          {filtered.map((lead) => (
            <button type="button" key={lead.id} className={`lead-list-item ${lead.id === activeLeadId ? "is-active" : ""}`} onClick={() => select(lead.id)}>
              <div className="lead-channel-icon">{lead.channel === "Email" ? <Mail size={17}/> : <MessageSquareText size={17}/>}</div>
              <div><strong>{lead.displayName || "New lead"}</strong><span>{lead.phone || lead.email}</span><small>{lead.messages.at(-1)?.body}</small></div>
              {lead.unreadCount > 0 && <em>{lead.unreadCount}</em>}
            </button>
          ))}
        </div>
      </aside>

      <div className="lead-detail-panel">
        {notice && <div className="success-notice">{notice}</div>}
        {error && <div className="form-error">{error}</div>}
        {!activeLead ? <div className="conversation-empty large"><span>✨</span><h3>Select a lead</h3><p>Open an unknown-sender conversation to qualify or convert it.</p></div> : <>
          <header className="lead-detail-header">
            <div><span className="eyebrow">New lead · {activeLead.channel}</span><h2>{activeLead.displayName}</h2><p>{activeLead.phone || activeLead.email}</p></div>
            <div className="lead-header-actions">
              <AppButton variant="secondary" onClick={() => void close(activeLead.id)}><XCircle size={16}/> Close</AppButton>
              <AppButton disabled={converting} onClick={() => void convert()}><UserPlus size={16}/>{converting ? "Converting..." : "Convert to customer"}</AppButton>
            </div>
          </header>

          <div className="lead-controls">
            <label className="field"><span>Status</span><select value={activeLead.status} onChange={(e) => void update(activeLead.id, { status: e.target.value as MessageLead["status"] })}><option>New</option><option>Contacted</option><option>Qualified</option><option>Closed</option></select></label>
            <label className="field"><span>Assigned employee</span><input value={activeLead.assignedTo} onChange={(e) => void update(activeLead.id, { assignedTo: e.target.value })} placeholder="Unassigned"/></label>
            <label className="field lead-notes"><span>Lead notes</span><textarea rows={2} value={activeLead.notes} onChange={(e) => void update(activeLead.id, { notes: e.target.value })}/></label>
          </div>

          <div className="conversation-body lead-conversation-body">
            {activeLead.messages.map((message) => <div key={message.id} className={`message-bubble-row ${message.direction === "Outbound" ? "outbound" : "inbound"}`}><div className="message-bubble"><p>{message.body}</p><div><time>{format(message.sentAt)}</time><span>{message.status}</span></div></div></div>)}
          </div>

          <form className="message-composer" onSubmit={submitReply}><textarea rows={3} value={body} onChange={(e) => setBody(e.target.value)} placeholder={`Reply by ${activeLead.channel}...`}/><AppButton disabled={!body.trim()}><Send size={17}/> Send reply</AppButton></form>
          <div className="lead-conversion-note"><ArrowRight size={16}/><span>Converting creates a customer and moves this complete conversation into the normal Inbox.</span></div>
        </>}
      </div>
    </section>
  );
}
