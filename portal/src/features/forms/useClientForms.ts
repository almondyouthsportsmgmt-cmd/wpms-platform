import { useCallback, useEffect, useState } from "react";
import { listClientForms, saveClientForm, updateClientFormStatus } from "./formsService";
import type { ClientForm, ClientFormInput } from "./formsTypes";

export function useClientForms() {
  const [forms, setForms] = useState<ClientForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true); setError("");
    try { setForms(await listClientForms()); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to load forms."); }
    finally { setLoading(false); }
  }, []);

  useEffect(()=>{ void refresh(); }, [refresh]);

  async function save(input: ClientFormInput, id?: string) {
    const saved = await saveClientForm(input, id);
    setForms((current)=> id ? current.map((item)=>item.id===id?saved:item) : [saved, ...current]);
    return saved;
  }

  async function setStatus(id: string, status: ClientForm["status"]) {
    const saved = await updateClientFormStatus(id, status);
    setForms((current)=>current.map((item)=>item.id===id?saved:item));
    return saved;
  }

  return { forms, loading, error, refresh, save, setStatus };
}
