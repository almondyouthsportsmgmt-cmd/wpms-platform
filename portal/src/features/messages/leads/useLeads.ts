import { useCallback, useEffect, useMemo, useState } from "react";
import { closeLead, getLead, listLeads, markLeadRead, replyToLead, updateLead } from "./leadService";
import type { MessageLead } from "./leadTypes";

export function useLeads() {
  const [leads, setLeads] = useState<MessageLead[]>([]);
  const [activeLeadId, setActiveLeadId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(() => {
    const next = listLeads();
    setLeads(next);
    setActiveLeadId((current) => current && next.some((lead) => lead.id === current) ? current : next[0]?.id ?? "");
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const handle = () => refresh();
    window.addEventListener("wpms:message-leads-updated", handle);
    return () => window.removeEventListener("wpms:message-leads-updated", handle);
  }, [refresh]);

  const activeLead = useMemo(() => activeLeadId ? getLead(activeLeadId) : null, [activeLeadId, leads]);
  const unreadCount = useMemo(() => leads.reduce((sum, lead) => sum + lead.unreadCount, 0), [leads]);

  function select(id: string) {
    setActiveLeadId(id);
    markLeadRead(id);
    refresh();
  }

  async function run(action: () => unknown) {
    setError("");
    try { const result = action(); refresh(); return result; }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to update lead."); throw caught; }
  }

  return {
    leads, activeLead, activeLeadId, loading, error, unreadCount, refresh, select,
    reply: (id: string, body: string) => run(() => replyToLead(id, body)),
    update: (id: string, update: Partial<Pick<MessageLead, "status" | "assignedTo" | "notes" | "displayName">>) => run(() => updateLead(id, update)),
    close: (id: string) => run(() => closeLead(id)),
  };
}
