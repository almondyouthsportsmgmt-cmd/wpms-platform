import { useCallback, useEffect, useState } from "react";
import { listCustomerMemberships, listMembershipPlans, saveCustomerMembership } from "./membershipService";
import type { CustomerMembership, CustomerMembershipInput, MembershipPlan } from "./membershipTypes";

export function useMemberships(){
  const [plans,setPlans]=useState<MembershipPlan[]>([]); const [memberships,setMemberships]=useState<CustomerMembership[]>([]);
  const [loading,setLoading]=useState(true); const [error,setError]=useState("");
  const refresh=useCallback(async()=>{setLoading(true);setError("");try{const [p,m]=await Promise.all([listMembershipPlans(),listCustomerMemberships()]);setPlans(p);setMemberships(m);}catch(e){setError(e instanceof Error?e.message:"Unable to load memberships.");}finally{setLoading(false);}},[]);
  useEffect(()=>{void refresh();},[refresh]);
  async function save(input:CustomerMembershipInput,id?:string){const saved=await saveCustomerMembership(input,id);setMemberships(c=>id?c.map(i=>i.id===id?saved:i):[saved,...c]);return saved;}
  return {plans,memberships,loading,error,refresh,save};
}
