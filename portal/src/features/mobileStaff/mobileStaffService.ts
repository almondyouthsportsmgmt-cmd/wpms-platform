import { isSupabaseConfigured, supabase } from "../../lib/supabaseClient";
import type { MobileTask, MobileTaskStatus, ShiftSession } from "./mobileStaffTypes";

const TASKS_KEY = "wpms-demo-mobile-tasks";
const SHIFT_KEY = "wpms-demo-mobile-shift";
const now = new Date();
const hhmm = (offsetMinutes: number) => new Date(now.getTime() + offsetMinutes * 60000).toTimeString().slice(0, 5);

const seedTasks: MobileTask[] = [
  { id: "mobile-task-1", employeeName: "Ashley Morgan", petName: "Bella", customerName: "Sarah Miller", type: "Grooming", title: "Full groom and nail trim", scheduledTime: hhmm(-20), location: "Grooming Station 2", status: "In Progress", notes: "Use oatmeal lavender shampoo.", updatedAt: new Date().toISOString() },
  { id: "mobile-task-2", employeeName: "Ashley Morgan", petName: "Max", customerName: "John Davis", type: "Pickup", title: "Ready-for-pickup quality check", scheduledTime: hhmm(35), location: "Pickup Area", status: "Pending", notes: "Confirm bandana and report card.", updatedAt: new Date().toISOString() },
  { id: "mobile-task-3", employeeName: "Jordan Lee", petName: "Cooper", customerName: "Lisa Almond", type: "Medication", title: "Evening allergy medication", scheduledTime: hhmm(75), location: "Luxury B2", status: "Pending", notes: "Give with dinner.", updatedAt: new Date().toISOString() },
  { id: "mobile-task-4", employeeName: "Jordan Lee", petName: "Daisy", customerName: "Sarah Miller", type: "Boarding", title: "Outdoor playtime and photo update", scheduledTime: hhmm(105), location: "Play Yard 1", status: "Pending", notes: "Solo play only.", updatedAt: new Date().toISOString() },
];

function readTasks(): MobileTask[] {
  const raw = localStorage.getItem(TASKS_KEY);
  if (!raw) { localStorage.setItem(TASKS_KEY, JSON.stringify(seedTasks)); return seedTasks; }
  return JSON.parse(raw) as MobileTask[];
}
function writeTasks(items: MobileTask[]) { localStorage.setItem(TASKS_KEY, JSON.stringify(items)); }
function rowToTask(row: Record<string, unknown>): MobileTask {
  return { id:String(row.id), employeeName:String(row.employee_name??""), petName:String(row.pet_name??""), customerName:String(row.customer_name??""), type:String(row.task_type) as MobileTask["type"], title:String(row.title??""), scheduledTime:String(row.scheduled_time??"").slice(0,5), location:String(row.location??""), status:String(row.status) as MobileTask["status"], notes:String(row.notes??""), updatedAt:String(row.updated_at) };
}
export async function listMobileTasks(): Promise<MobileTask[]> {
  if (!isSupabaseConfigured) return readTasks().sort((a,b)=>a.scheduledTime.localeCompare(b.scheduledTime));
  const {data,error}=await supabase.from("mobile_staff_tasks").select("*").order("scheduled_time");
  if(error) throw error; return (data??[]).map(rowToTask);
}
export async function updateMobileTaskStatus(id:string,status:MobileTaskStatus): Promise<MobileTask> {
  if(!isSupabaseConfigured){ const items=readTasks(); const found=items.find(i=>i.id===id); if(!found) throw new Error("Task not found."); const updated={...found,status,updatedAt:new Date().toISOString()}; writeTasks(items.map(i=>i.id===id?updated:i)); return updated; }
  const {data,error}=await supabase.from("mobile_staff_tasks").update({status}).eq("id",id).select("*").single(); if(error) throw error; return rowToTask(data);
}
export async function getActiveShift(): Promise<ShiftSession|null> {
  if(!isSupabaseConfigured){ const raw=localStorage.getItem(SHIFT_KEY); return raw?JSON.parse(raw) as ShiftSession:null; }
  const {data,error}=await supabase.from("employee_shift_sessions").select("*").is("clock_out_at",null).order("clock_in_at",{ascending:false}).limit(1).maybeSingle(); if(error) throw error; if(!data) return null;
  return {id:String(data.id),employeeName:String(data.employee_name),clockInAt:String(data.clock_in_at),clockOutAt:data.clock_out_at?String(data.clock_out_at):null,breakMinutes:Number(data.break_minutes??0)};
}
export async function clockIn(employeeName:string): Promise<ShiftSession> {
  if(!isSupabaseConfigured){ const s={id:crypto.randomUUID(),employeeName,clockInAt:new Date().toISOString(),clockOutAt:null,breakMinutes:0}; localStorage.setItem(SHIFT_KEY,JSON.stringify(s)); return s; }
  const {data,error}=await supabase.from("employee_shift_sessions").insert({employee_name:employeeName}).select("*").single(); if(error) throw error; return {id:String(data.id),employeeName:String(data.employee_name),clockInAt:String(data.clock_in_at),clockOutAt:null,breakMinutes:Number(data.break_minutes??0)};
}
export async function clockOut(session:ShiftSession): Promise<ShiftSession> {
  const updated={...session,clockOutAt:new Date().toISOString()};
  if(!isSupabaseConfigured){ localStorage.removeItem(SHIFT_KEY); return updated; }
  const {error}=await supabase.from("employee_shift_sessions").update({clock_out_at:updated.clockOutAt}).eq("id",session.id); if(error) throw error; return updated;
}
