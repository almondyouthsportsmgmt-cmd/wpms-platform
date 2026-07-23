import { useMemo, useState } from "react";
import { Bot, CheckCircle2, CircleAlert, RefreshCw, Search, Sparkles, UserRoundCheck } from "lucide-react";
import { AppButton } from "../../components/common/AppButton";
import { AppCard } from "../../components/common/AppCard";
import { generateReceptionistReply } from "./aiReceptionistService";
import type { ReceptionistConversationStatus, ReceptionistReply } from "./aiReceptionistTypes";
import { useAiReceptionist } from "./useAiReceptionist";

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function AiReceptionistPage() {
  const { conversations, loading, error, refresh, setStatus } = useAiReceptionist();
  const [query, setQuery] = useState("");
  const [status, setStatusFilter] = useState("All");
  const [testMessage, setTestMessage] = useState("Do you have a grooming appointment Tuesday morning?");
  const [reply, setReply] = useState<ReceptionistReply>(() => generateReceptionistReply(testMessage));
  const [notice, setNotice] = useState("");

  const filtered = useMemo(() => conversations.filter((conversation) => {
    const needle = query.trim().toLowerCase();
    const matchesQuery = !needle || [
      conversation.customerName,
      conversation.customerPhone,
      conversation.intent,
      conversation.summary,
      conversation.lastMessage,
    ].join(" ").toLowerCase().includes(needle);
    return matchesQuery && (status === "All" || conversation.status === status);
  }), [conversations, query, status]);

  const open = conversations.filter((item) => item.status === "Open").length;
  const escalated = conversations.filter((item) => item.status === "Escalated").length;
  const resolved = conversations.filter((item) => item.status === "Resolved").length;

  function show(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  }

  async function changeStatus(id: string, next: ReceptionistConversationStatus) {
    await setStatus(id, next, next === "Escalated" ? "Lisa" : "AI Receptionist");
    show(`Conversation marked ${next.toLowerCase()}.`);
  }

  return (
    <div className="ai-receptionist-page">
      <section className="page-toolbar">
        <div className="page-head">
          <span className="eyebrow">Automation & client care</span>
          <h1>AI Receptionist</h1>
          <p>Classify questions, prepare replies, surface next actions, and route conversations to staff.</p>
        </div>
        <div className="toolbar-actions">
          <AppButton variant="secondary" onClick={() => void refresh()}><RefreshCw size={17}/> Refresh</AppButton>
        </div>
      </section>

      {notice && <div className="success-notice">{notice}</div>}

      <section className="appointment-summary-grid">
        <AppCard className="summary-card"><Bot size={22}/><div><span>Open conversations</span><strong>{open}</strong></div></AppCard>
        <AppCard className="summary-card"><CircleAlert size={22}/><div><span>Escalated to staff</span><strong>{escalated}</strong></div></AppCard>
        <AppCard className="summary-card"><CheckCircle2 size={22}/><div><span>Resolved</span><strong>{resolved}</strong></div></AppCard>
        <AppCard className="summary-card"><Sparkles size={22}/><div><span>Automation mode</span><strong>Assist</strong></div></AppCard>
      </section>

      <section className="ai-receptionist-layout">
        <div>
          <section className="module-controls">
            <div className="module-search"><Search size={18}/><input aria-label="Search AI receptionist conversations" placeholder="Search customer, intent, or message..." value={query} onChange={(event) => setQuery(event.target.value)} /></div>
            <select aria-label="Filter conversation status" value={status} onChange={(event) => setStatusFilter(event.target.value)}>
              <option>All</option><option>Open</option><option>Escalated</option><option>Resolved</option>
            </select>
          </section>

          {loading && <div className="module-state"><div className="paw-loader">🐾</div><p>Loading receptionist conversations...</p></div>}
          {!loading && error && <div className="module-state error-state"><p>{error}</p></div>}
          {!loading && !error && filtered.length === 0 && <AppCard className="empty-state"><div className="empty-icon">🤖</div><h2>No conversations found</h2><p>Adjust the search or status filter.</p></AppCard>}

          {!loading && !error && filtered.length > 0 && (
            <div className="ai-conversation-list">
              {filtered.map((conversation) => (
                <AppCard className="ai-conversation-card" key={conversation.id}>
                  <div className="ai-conversation-head">
                    <div>
                      <div className="ai-customer-line"><strong>{conversation.customerName}</strong><span>{conversation.channel}</span></div>
                      <small>{conversation.customerPhone} · {formatTime(conversation.lastMessageAt)}</small>
                    </div>
                    <span className={`ai-status ai-status-${conversation.status.toLowerCase()}`}>{conversation.status}</span>
                  </div>
                  <div className="ai-intent-row"><span>Detected intent</span><strong>{conversation.intent}</strong></div>
                  <blockquote>{conversation.lastMessage}</blockquote>
                  <p>{conversation.summary}</p>
                  <div className="ai-card-footer">
                    <span>Assigned to: <strong>{conversation.assignedTo}</strong></span>
                    <div>
                      {conversation.status !== "Resolved" && <AppButton variant="secondary" onClick={() => void changeStatus(conversation.id, "Resolved")}>Resolve</AppButton>}
                      {conversation.status !== "Escalated" && <AppButton variant="secondary" onClick={() => void changeStatus(conversation.id, "Escalated")}><UserRoundCheck size={16}/> Escalate</AppButton>}
                    </div>
                  </div>
                </AppCard>
              ))}
            </div>
          )}
        </div>

        <AppCard className="ai-simulator-card">
          <div className="ai-simulator-head"><div className="ai-bot-orb"><Bot size={24}/></div><div><span className="eyebrow">Response studio</span><h2>Test the receptionist</h2></div></div>
          <label className="field"><span>Customer message</span><textarea rows={5} value={testMessage} onChange={(event) => setTestMessage(event.target.value)} /></label>
          <AppButton onClick={() => setReply(generateReceptionistReply(testMessage))}><Sparkles size={17}/> Generate response</AppButton>
          <div className="ai-response-preview">
            <div><span>Intent</span><strong>{reply.intent}</strong></div>
            <p>{reply.reply}</p>
            <dl>
              <div><dt>Suggested action</dt><dd>{reply.suggestedAction}</dd></div>
              <div><dt>Confidence</dt><dd>{Math.round(reply.confidence * 100)}%</dd></div>
              <div><dt>Staff review</dt><dd>{reply.shouldEscalate ? "Required" : "Optional"}</dd></div>
            </dl>
          </div>
          <div className="ai-guardrail-note"><CircleAlert size={17}/><p>Foundation mode prepares responses and recommendations. It does not automatically send messages or modify appointments.</p></div>
        </AppCard>
      </section>
    </div>
  );
}
