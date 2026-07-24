import { useMemo, useState } from "react";
import { ClipboardSignature, FileCheck2, FileClock, RefreshCw, Search } from "lucide-react";
import { AppButton } from "../../components/common/AppButton";
import { AppCard } from "../../components/common/AppCard";
import { useCustomers } from "../customers/useCustomers";
import { usePets } from "../pets/usePets";
import type { ClientForm, ClientFormInput, FormType } from "./formsTypes";
import { useClientForms } from "./useClientForms";

const types: FormType[] = ["Grooming Consent","Boarding Agreement","Medication Authorization","New Client Intake","Vaccination Waiver"];
const statusClass=(value:string)=>value.toLowerCase().replaceAll(" ","-");

export function ClientFormsPage() {
  const { forms, loading, error, refresh, save, setStatus } = useClientForms();
  const { customers } = useCustomers();
  const { pets } = usePets();
  const [query,setQuery]=useState("");
  const [status,setStatusFilter]=useState("All");
  const [type,setType]=useState("All");
  const [notice,setNotice]=useState("");
  const [customerId,setCustomerId]=useState("");
  const [petId,setPetId]=useState("");
  const [formType,setFormType]=useState<FormType>("Grooming Consent");

  const customerMap=useMemo(()=>new Map(customers.map((item)=>[item.id,item])),[customers]);
  const petMap=useMemo(()=>new Map(pets.map((item)=>[item.id,item])),[pets]);
  const customerPets=pets.filter((pet)=>!customerId||pet.customerId===customerId);
  const filtered=forms.filter((form)=>{
    const customer=customerMap.get(form.customerId); const pet=petMap.get(form.petId); const needle=query.trim().toLowerCase();
    const text=[customer?.firstName,customer?.lastName,pet?.name,form.title,form.formType,form.status].join(" ").toLowerCase();
    return (!needle||text.includes(needle))&&(status==="All"||form.status===status)&&(type==="All"||form.formType===type);
  });
  const signed=forms.filter((item)=>item.status==="Signed").length;
  const awaiting=forms.filter((item)=>item.status==="Sent").length;
  const expired=forms.filter((item)=>item.status==="Expired").length;

  function show(message:string){setNotice(message);window.setTimeout(()=>setNotice(""),2200);}
  async function createForm(){
    if(!customerId||!petId){show("Select a customer and pet.");return;}
    const customer=customerMap.get(customerId); const pet=petMap.get(petId); const expires=new Date(Date.now()+7*86400000).toISOString();
    const input:ClientFormInput={customerId,petId,formType,title:`${pet?.name??"Pet"} ${formType}`,status:"Draft",sentAt:"",expiresAt:expires,signerName:customer?`${customer.firstName} ${customer.lastName}`:"",signerEmail:customer?.email??"",notes:""};
    await save(input); show("Digital form created.");
  }

  return <div className="forms-page">
    <section className="page-toolbar"><div className="page-head"><span className="eyebrow">Paperless operations</span><h1>Client Forms</h1><p>Create, send, sign, and track grooming and boarding agreements.</p></div><div className="toolbar-actions"><AppButton variant="secondary" onClick={()=>void refresh()}><RefreshCw size={17}/> Refresh</AppButton></div></section>
    {notice&&<div className="success-notice">{notice}</div>}
    <section className="appointment-summary-grid">
      <AppCard className="summary-card"><ClipboardSignature size={22}/><div><span>Total forms</span><strong>{forms.length}</strong></div></AppCard>
      <AppCard className="summary-card"><FileCheck2 size={22}/><div><span>Signed</span><strong>{signed}</strong></div></AppCard>
      <AppCard className="summary-card"><FileClock size={22}/><div><span>Awaiting signature</span><strong>{awaiting}</strong></div></AppCard>
      <AppCard className="summary-card"><span className="summary-emoji">⚠️</span><div><span>Expired</span><strong>{expired}</strong></div></AppCard>
    </section>
    <AppCard className="form-builder-card"><div className="card-heading"><div><span className="eyebrow">Quick create</span><h2>New digital agreement</h2></div></div><div className="form-builder-grid">
      <select aria-label="Customer" value={customerId} onChange={(e)=>{setCustomerId(e.target.value);setPetId("");}}><option value="">Select customer</option>{customers.filter(c=>c.isActive).map(c=><option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}</select>
      <select aria-label="Pet" value={petId} onChange={(e)=>setPetId(e.target.value)}><option value="">Select pet</option>{customerPets.filter(p=>p.isActive).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
      <select aria-label="Form type" value={formType} onChange={(e)=>setFormType(e.target.value as FormType)}>{types.map(v=><option key={v}>{v}</option>)}</select>
      <AppButton onClick={()=>void createForm()}>Create form</AppButton>
    </div></AppCard>
    <section className="module-controls"><div className="module-search"><Search size={18}/><input aria-label="Search forms" placeholder="Search customer, pet, type, or status..." value={query} onChange={(e)=>setQuery(e.target.value)}/></div><select value={type} onChange={(e)=>setType(e.target.value)}><option>All</option>{types.map(v=><option key={v}>{v}</option>)}</select><select value={status} onChange={(e)=>setStatusFilter(e.target.value)}><option>All</option>{["Draft","Sent","Signed","Declined","Expired"].map(v=><option key={v}>{v}</option>)}</select></section>
    {loading&&<div className="module-state"><div className="paw-loader">🐾</div><p>Loading forms...</p></div>}
    {!loading&&error&&<div className="module-state error-state"><p>{error}</p></div>}
    {!loading&&!error&&filtered.length===0&&<AppCard className="empty-state"><div className="empty-icon">📄</div><h2>No forms found</h2><p>Create the first digital agreement or adjust your filters.</p></AppCard>}
    {!loading&&!error&&filtered.length>0&&<section className="forms-grid">{filtered.map((form)=>{const customer=customerMap.get(form.customerId);const pet=petMap.get(form.petId);return <AppCard className="client-form-card" key={form.id}><div className="client-form-head"><div><span className="eyebrow">{form.formType}</span><h3>{form.title}</h3><p>{customer?`${customer.firstName} ${customer.lastName}`:"Customer"} · {pet?.name??"Pet"}</p></div><span className={`status-chip status-${statusClass(form.status)}`}>{form.status}</span></div><div className="client-form-meta"><div><span>Signer</span><strong>{form.signerName||"Not set"}</strong></div><div><span>Email</span><strong>{form.signerEmail||"Not set"}</strong></div><div><span>Expires</span><strong>{form.expiresAt?new Date(form.expiresAt).toLocaleDateString():"No expiration"}</strong></div><div><span>Signed</span><strong>{form.signedAt?new Date(form.signedAt).toLocaleDateString():"Not signed"}</strong></div></div><div className="client-form-actions">{form.status==="Draft"&&<AppButton variant="secondary" onClick={()=>void setStatus(form.id,"Sent").then(()=>show("Form sent."))}>Send</AppButton>}{form.status==="Sent"&&<AppButton onClick={()=>void setStatus(form.id,"Signed").then(()=>show("Signature recorded."))}>Mark signed</AppButton>}{!['Signed','Expired','Declined'].includes(form.status)&&<AppButton variant="ghost" onClick={()=>void setStatus(form.id,"Expired").then(()=>show("Form expired."))}>Expire</AppButton>}</div></AppCard>})}</section>}
  </div>;
}
