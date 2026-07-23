import { isSupabaseConfigured, supabase } from "../../lib/supabaseClient";
import type { Message, MessageThread } from "./messageTypes";

const THREADS_KEY = "wpms-demo-message-threads";
const MESSAGES_KEY = "wpms-demo-messages";
const now = new Date().toISOString();
const earlier = new Date(Date.now() - 35 * 60_000).toISOString();

const seedThreads: MessageThread[] = [
  { id: "demo-thread-1", customerId: "demo-customer-1", subject: "Bella grooming appointment", lastMessageAt: earlier, unreadCount: 1, isArchived: false, createdAt: earlier, updatedAt: earlier },
  { id: "demo-thread-2", customerId: "demo-customer-2", subject: "Boarding pickup", lastMessageAt: now, unreadCount: 0, isArchived: false, createdAt: now, updatedAt: now },
];
const seedMessages: Message[] = [
  { id: "demo-message-1", threadId: "demo-thread-1", customerId: "demo-customer-1", direction: "Outbound", body: "Hi Sarah, Bella is checked in and doing great.", status: "Delivered", sentAt: new Date(Date.now()-70*60_000).toISOString(), createdAt: new Date(Date.now()-70*60_000).toISOString() },
  { id: "demo-message-2", threadId: "demo-thread-1", customerId: "demo-customer-1", direction: "Inbound", body: "Thank you! Please let me know when she is ready.", status: "Received", sentAt: earlier, createdAt: earlier },
  { id: "demo-message-3", threadId: "demo-thread-2", customerId: "demo-customer-2", direction: "Outbound", body: "Cooper will be ready for pickup at 4:00 PM.", status: "Delivered", sentAt: now, createdAt: now },
];

function readThreads(): MessageThread[] { const raw=localStorage.getItem(THREADS_KEY); if(!raw){localStorage.setItem(THREADS_KEY,JSON.stringify(seedThreads));return seedThreads;} return JSON.parse(raw) as MessageThread[]; }
function readMessages(): Message[] { const raw=localStorage.getItem(MESSAGES_KEY); if(!raw){localStorage.setItem(MESSAGES_KEY,JSON.stringify(seedMessages));return seedMessages;} return JSON.parse(raw) as Message[]; }
function writeThreads(items: MessageThread[]){localStorage.setItem(THREADS_KEY,JSON.stringify(items));}
function writeMessages(items: Message[]){localStorage.setItem(MESSAGES_KEY,JSON.stringify(items));}

function threadFromRow(row: Record<string, unknown>): MessageThread { return { id:String(row.id), customerId:String(row.customer_id), subject:String(row.subject??"Customer conversation"), lastMessageAt:String(row.last_message_at??row.updated_at), unreadCount:Number(row.unread_count??0), isArchived:Boolean(row.is_archived), createdAt:String(row.created_at), updatedAt:String(row.updated_at) }; }
function messageFromRow(row: Record<string, unknown>): Message { return { id:String(row.id), threadId:String(row.thread_id), customerId:String(row.customer_id), direction:String(row.direction) as Message["direction"], body:String(row.body??""), status:String(row.status??"Sent") as Message["status"], sentAt:String(row.sent_at??row.created_at), createdAt:String(row.created_at) }; }

export async function listThreads(): Promise<MessageThread[]> {
  if(!isSupabaseConfigured) return readThreads().filter(t=>!t.isArchived).sort((a,b)=>b.lastMessageAt.localeCompare(a.lastMessageAt));
  const {data,error}=await supabase.from("message_threads").select("*").eq("is_archived",false).order("last_message_at",{ascending:false});
  if(error) throw error; return (data??[]).map(threadFromRow);
}
export async function listMessages(threadId:string): Promise<Message[]> {
  if(!isSupabaseConfigured) return readMessages().filter(m=>m.threadId===threadId).sort((a,b)=>a.sentAt.localeCompare(b.sentAt));
  const {data,error}=await supabase.from("messages").select("*").eq("thread_id",threadId).order("sent_at");
  if(error) throw error; return (data??[]).map(messageFromRow);
}
export async function sendMessage(customerId:string, body:string, threadId?:string): Promise<{thread:MessageThread;message:Message}> {
  const clean=body.trim(); if(!clean) throw new Error("Message cannot be empty."); const stamp=new Date().toISOString();
  if(!isSupabaseConfigured){
    const threads=readThreads(); let thread=threadId?threads.find(t=>t.id===threadId):undefined;
    if(!thread){thread={id:crypto.randomUUID(),customerId,subject:"Customer conversation",lastMessageAt:stamp,unreadCount:0,isArchived:false,createdAt:stamp,updatedAt:stamp};threads.push(thread);} else {thread={...thread,lastMessageAt:stamp,updatedAt:stamp};}
    const message:Message={id:crypto.randomUUID(),threadId:thread.id,customerId,direction:"Outbound",body:clean,status:"Delivered",sentAt:stamp,createdAt:stamp};
    writeThreads(threads.map(t=>t.id===thread!.id?thread!:t)); writeMessages([...readMessages(),message]); return {thread,message};
  }
  let activeThreadId=threadId;
  if(!activeThreadId){const {data,error}=await supabase.from("message_threads").insert({customer_id:customerId,subject:"Customer conversation"}).select("*").single();if(error)throw error;activeThreadId=String(data.id);}
  const {data:messageData,error:messageError}=await supabase.from("messages").insert({thread_id:activeThreadId,customer_id:customerId,direction:"Outbound",body:clean,status:"Sent"}).select("*").single();
  if(messageError)throw messageError;
  const {data:threadData,error:threadError}=await supabase.from("message_threads").update({last_message_at:stamp,updated_at:stamp}).eq("id",activeThreadId).select("*").single();if(threadError)throw threadError;
  return {thread:threadFromRow(threadData),message:messageFromRow(messageData)};
}
export async function markRead(threadId:string){if(!isSupabaseConfigured){writeThreads(readThreads().map(t=>t.id===threadId?{...t,unreadCount:0}:t));return;}const {error}=await supabase.from("message_threads").update({unread_count:0}).eq("id",threadId);if(error)throw error;}
export async function archiveThread(threadId:string){if(!isSupabaseConfigured){writeThreads(readThreads().map(t=>t.id===threadId?{...t,isArchived:true}:t));return;}const {error}=await supabase.from("message_threads").update({is_archived:true}).eq("id",threadId);if(error)throw error;}
