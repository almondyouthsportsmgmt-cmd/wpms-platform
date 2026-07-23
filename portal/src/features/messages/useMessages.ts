import { useCallback, useEffect, useState } from "react";
import { archiveThread, listMessages, listThreads, markRead, sendMessage } from "./messageService";
import type { Message, MessageThread } from "./messageTypes";
export function useMessages(){
 const [threads,setThreads]=useState<MessageThread[]>([]),[messages,setMessages]=useState<Message[]>([]),[activeThreadId,setActiveThreadId]=useState("");
 const [loading,setLoading]=useState(true),[loadingMessages,setLoadingMessages]=useState(false),[error,setError]=useState("");
 const refresh=useCallback(async()=>{setLoading(true);setError("");try{const next=await listThreads();setThreads(next);setActiveThreadId(v=>v||next[0]?.id||"");}catch(e){setError(e instanceof Error?e.message:"Unable to load messages.");}finally{setLoading(false);}},[]);
 useEffect(()=>{void refresh();},[refresh]);
 useEffect(()=>{if(!activeThreadId){setMessages([]);return;}setLoadingMessages(true);void listMessages(activeThreadId).then(async next=>{setMessages(next);await markRead(activeThreadId);setThreads(cur=>cur.map(t=>t.id===activeThreadId?{...t,unreadCount:0}:t));}).catch(e=>setError(e instanceof Error?e.message:"Unable to load conversation.")).finally(()=>setLoadingMessages(false));},[activeThreadId]);
 async function send(customerId:string,body:string,threadId?:string){const result=await sendMessage(customerId,body,threadId);setThreads(cur=>[result.thread,...cur.filter(t=>t.id!==result.thread.id)]);setActiveThreadId(result.thread.id);setMessages(cur=>threadId===activeThreadId||!threadId?[...cur,result.message]:cur);return result;}
 async function archive(id:string){await archiveThread(id);const remaining=threads.filter(t=>t.id!==id);setThreads(remaining);if(activeThreadId===id)setActiveThreadId(remaining[0]?.id??"");}
 return{threads,messages,activeThreadId,setActiveThreadId,loading,loadingMessages,error,refresh,send,archive};
}
