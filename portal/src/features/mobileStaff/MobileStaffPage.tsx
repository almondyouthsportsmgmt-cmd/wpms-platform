import { useMemo, useState } from "react";
import { CheckCircle2, Clock3, MapPin, RefreshCw, Smartphone, TimerReset } from "lucide-react";
import { AppButton } from "../../components/common/AppButton";
import { AppCard } from "../../components/common/AppCard";
import type { MobileTaskStatus } from "./mobileStaffTypes";
import { useMobileStaff } from "./useMobileStaff";

const employees=["Ashley Morgan","Jordan Lee","Lisa Almond"];
const nextStatus=(status:MobileTaskStatus):MobileTaskStatus=>status==="Pending"?"In Progress":"Completed";
const fmt=(iso:string)=>new Intl.DateTimeFormat("en-US",{hour:"numeric",minute:"2-digit"}).format(new Date(iso));
export function MobileStaffPage(){
 const {tasks,shift,loading,error,refresh,setStatus,toggleShift}=useMobileStaff(); const [employee,setEmployee]=useState("Ashley Morgan"); const [notice,setNotice]=useState("");
 const assigned=useMemo(()=>tasks.filter(t=>t.employeeName===employee),[tasks,employee]); const pending=assigned.filter(t=>t.status==="Pending").length; const inProgress=assigned.filter(t=>t.status==="In Progress").length; const completed=assigned.filter(t=>t.status==="Completed").length;
 function show(m:string){setNotice(m);window.setTimeout(()=>setNotice(""),1800)}
 return <div className="mobile-staff-page">
  <section className="page-toolbar"><div className="page-head"><span className="eyebrow">Employee mobile workspace</span><h1>Staff Mobile</h1><p>Fast task execution for grooming, boarding, medications, and pickups.</p></div><div className="toolbar-actions"><AppButton variant="secondary" onClick={()=>void refresh()}><RefreshCw size={17}/> Refresh</AppButton></div></section>
  {notice&&<div className="success-notice">{notice}</div>}
  <section className="mobile-device-shell">
   <div className="mobile-device-top"><div><Smartphone size={20}/><strong>Whimsical Paws Staff</strong></div><span>Live</span></div>
   <div className="mobile-shift-card">
    <div><span className="eyebrow">Current employee</span><select value={employee} onChange={e=>setEmployee(e.target.value)}>{employees.map(e=><option key={e}>{e}</option>)}</select></div>
    <div className="shift-state">{shift?<><strong>Clocked in</strong><span>Since {fmt(shift.clockInAt)}</span></>:<><strong>Not clocked in</strong><span>Start your shift to track time.</span></>}</div>
    <AppButton onClick={()=>void toggleShift(employee)}>{shift?<><TimerReset size={17}/> Clock out</>:<><Clock3 size={17}/> Clock in</>}</AppButton>
   </div>
   <div className="mobile-kpis"><div><span>Pending</span><strong>{pending}</strong></div><div><span>In progress</span><strong>{inProgress}</strong></div><div><span>Completed</span><strong>{completed}</strong></div></div>
   {loading&&<div className="module-state"><div className="paw-loader">🐾</div></div>}
   {!loading&&error&&<div className="form-error">{error}</div>}
   {!loading&&!error&&<div className="mobile-task-list">{assigned.map(task=><AppCard className={`mobile-task-card task-${task.status.toLowerCase().replace(" ","-")}`} key={task.id}>
    <div className="mobile-task-head"><div><span className="task-type">{task.type}</span><h3>{task.petName}</h3><p>{task.title}</p></div><span className="task-time">{task.scheduledTime}</span></div>
    <div className="mobile-task-meta"><span><MapPin size={14}/>{task.location}</span><span>{task.customerName}</span></div>
    {task.notes&&<div className="mobile-task-notes">{task.notes}</div>}
    <div className="mobile-task-actions"><span className={`status-chip status-${task.status.toLowerCase().replace(" ","-")}`}>{task.status}</span>{task.status!=="Completed"&&<AppButton variant="secondary" onClick={()=>void setStatus(task.id,nextStatus(task.status)).then(()=>show("Task updated."))}>{task.status==="Pending"?"Start task":<><CheckCircle2 size={16}/> Complete</>}</AppButton>}</div>
   </AppCard>)}</div>}
  </section>
 </div>
}
