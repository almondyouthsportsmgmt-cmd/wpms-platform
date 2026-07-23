import { useCallback, useEffect, useState } from "react";
import { clockIn, clockOut, getActiveShift, listMobileTasks, updateMobileTaskStatus } from "./mobileStaffService";
import type { MobileTask, MobileTaskStatus, ShiftSession } from "./mobileStaffTypes";
export function useMobileStaff(){
 const [tasks,setTasks]=useState<MobileTask[]>([]); const [shift,setShift]=useState<ShiftSession|null>(null); const [loading,setLoading]=useState(true); const [error,setError]=useState("");
 const refresh=useCallback(async()=>{setLoading(true);setError("");try{const [t,s]=await Promise.all([listMobileTasks(),getActiveShift()]);setTasks(t);setShift(s);}catch(e){setError(e instanceof Error?e.message:"Unable to load mobile workspace.");}finally{setLoading(false)}},[]);
 useEffect(()=>{void refresh()},[refresh]);
 async function setStatus(id:string,status:MobileTaskStatus){const updated=await updateMobileTaskStatus(id,status);setTasks(c=>c.map(i=>i.id===id?updated:i));}
 async function toggleShift(employeeName:string){if(shift){await clockOut(shift);setShift(null);}else{setShift(await clockIn(employeeName));}}
 return {tasks,shift,loading,error,refresh,setStatus,toggleShift};
}
