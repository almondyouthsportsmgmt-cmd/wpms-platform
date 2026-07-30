import { useCallback, useEffect, useMemo, useState } from "react";
import { approveAppointmentRequest, declineAppointmentRequest, listAppointmentRequests } from "./appointmentRequestService";
import type { AppointmentRequest } from "./appointmentRequestTypes";

export function useAppointmentRequests() {
  const [requests, setRequests] = useState<AppointmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState("");
  const [error, setError] = useState("");
  const refresh = useCallback(async () => {
    setLoading(true); setError("");
    try { setRequests(await listAppointmentRequests()); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to load appointment requests."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void refresh(); const handler=()=>void refresh(); window.addEventListener("wpms:appointment-requests-updated",handler); window.addEventListener("wpms:appointment-request-received",handler); return()=>{window.removeEventListener("wpms:appointment-requests-updated",handler);window.removeEventListener("wpms:appointment-request-received",handler);}; }, [refresh]);
  const pending = useMemo(() => requests.filter((item) => item.status === "Pending Review"), [requests]);
  async function run(id:string, action:()=>Promise<AppointmentRequest>) { setWorkingId(id);setError("");try{const result=await action();await refresh();return result;}catch(caught){setError(caught instanceof Error?caught.message:"Unable to review request.");throw caught;}finally{setWorkingId("");} }
  return { requests, pending, loading, workingId, error, refresh, approve:(id:string,by="")=>run(id,()=>approveAppointmentRequest(id,by)), decline:(id:string,by="")=>run(id,()=>declineAppointmentRequest(id,by)) };
}
