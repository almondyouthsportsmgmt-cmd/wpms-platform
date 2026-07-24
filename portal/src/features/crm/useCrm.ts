import { useCallback, useEffect, useState } from "react";
import { createCampaign, createLead, listCampaigns, listCrmProfiles, listLeads, updateCampaignStatus } from "./crmService";
import type { CampaignInput, CrmProfile, Lead, LeadInput, MarketingCampaign } from "./crmTypes";
export function useCrm(){
 const[profiles,setProfiles]=useState<CrmProfile[]>([]);const[campaigns,setCampaigns]=useState<MarketingCampaign[]>([]);const[leads,setLeads]=useState<Lead[]>([]);const[loading,setLoading]=useState(true);const[error,setError]=useState('');
 const refresh=useCallback(async()=>{setLoading(true);setError('');try{const[p,c,l]=await Promise.all([listCrmProfiles(),listCampaigns(),listLeads()]);setProfiles(p);setCampaigns(c);setLeads(l)}catch(e){setError(e instanceof Error?e.message:'Unable to load CRM data.')}finally{setLoading(false)}},[]);
 useEffect(()=>{void refresh()},[refresh]);
 async function addCampaign(input:CampaignInput){const item=await createCampaign(input);setCampaigns(x=>[item,...x]);return item}
 async function addLead(input:LeadInput){const item=await createLead(input);setLeads(x=>[item,...x]);return item}
 async function setCampaignStatus(id:string,status:MarketingCampaign['status']){const item=await updateCampaignStatus(id,status);setCampaigns(x=>x.map(c=>c.id===id?item:c));return item}
 return{profiles,campaigns,leads,loading,error,refresh,addCampaign,addLead,setCampaignStatus};
}
