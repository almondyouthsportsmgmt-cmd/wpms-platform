import { isSupabaseConfigured, supabase } from "../../lib/supabaseClient";
import type { CustomerMembership, CustomerMembershipInput, MembershipPlan } from "./membershipTypes";

const PLAN_KEY = "wpms-demo-membership-plans";
const MEMBER_KEY = "wpms-demo-memberships";

const plansSeed: MembershipPlan[] = [
  { id:"plan-basic", name:"Fresh Paws", description:"Everyday grooming savings", billingFrequency:"Monthly", price:19.99, groomingDiscountPercent:10, boardingDiscountPercent:5, includedNailTrims:1, includedBaths:0, loyaltyPointsMultiplier:1.25, isActive:true },
  { id:"plan-plus", name:"Pampered Pet", description:"Best value for frequent guests", billingFrequency:"Monthly", price:39.99, groomingDiscountPercent:15, boardingDiscountPercent:10, includedNailTrims:2, includedBaths:1, loyaltyPointsMultiplier:1.5, isActive:true },
  { id:"plan-vip", name:"Whimsical VIP", description:"Premium all-around care benefits", billingFrequency:"Annual", price:399, groomingDiscountPercent:20, boardingDiscountPercent:15, includedNailTrims:12, includedBaths:6, loyaltyPointsMultiplier:2, isActive:true },
];

function readPlans(): MembershipPlan[] {
  const raw = localStorage.getItem(PLAN_KEY);
  if (!raw) { localStorage.setItem(PLAN_KEY, JSON.stringify(plansSeed)); return plansSeed; }
  return JSON.parse(raw) as MembershipPlan[];
}
function readMembers(): CustomerMembership[] {
  const raw = localStorage.getItem(MEMBER_KEY);
  return raw ? JSON.parse(raw) as CustomerMembership[] : [];
}
function writeMembers(items: CustomerMembership[]) { localStorage.setItem(MEMBER_KEY, JSON.stringify(items)); }

export async function listMembershipPlans(): Promise<MembershipPlan[]> {
  if (!isSupabaseConfigured) return readPlans();
  const { data, error } = await supabase.from("membership_plans").select("*").order("price");
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id:r.id,name:r.name,description:r.description ?? "",billingFrequency:r.billing_frequency,price:Number(r.price),
    groomingDiscountPercent:Number(r.grooming_discount_percent),boardingDiscountPercent:Number(r.boarding_discount_percent),
    includedNailTrims:Number(r.included_nail_trims),includedBaths:Number(r.included_baths),
    loyaltyPointsMultiplier:Number(r.loyalty_points_multiplier),isActive:Boolean(r.is_active)
  })) as MembershipPlan[];
}

export async function listCustomerMemberships(): Promise<CustomerMembership[]> {
  if (!isSupabaseConfigured) return readMembers();
  const { data, error } = await supabase.from("customer_memberships").select("*").order("created_at", { ascending:false });
  if (error) throw error;
  return (data ?? []).map((r) => ({ id:r.id,customerId:r.customer_id,planId:r.plan_id,status:r.status,startDate:r.start_date,renewalDate:r.renewal_date,loyaltyPoints:Number(r.loyalty_points),notes:r.notes ?? "",createdAt:r.created_at,updatedAt:r.updated_at })) as CustomerMembership[];
}

export async function saveCustomerMembership(input: CustomerMembershipInput, id?: string): Promise<CustomerMembership> {
  if (!isSupabaseConfigured) {
    const items = readMembers(); const now = new Date().toISOString();
    const saved: CustomerMembership = id
      ? { ...(items.find(i=>i.id===id) as CustomerMembership), ...input, updatedAt:now }
      : { ...input, id:crypto.randomUUID(), createdAt:now, updatedAt:now };
    writeMembers(id ? items.map(i=>i.id===id?saved:i) : [saved,...items]); return saved;
  }
  const row = { customer_id:input.customerId, plan_id:input.planId, status:input.status, start_date:input.startDate, renewal_date:input.renewalDate, loyalty_points:input.loyaltyPoints, notes:input.notes || null };
  const q = id ? supabase.from("customer_memberships").update(row).eq("id",id) : supabase.from("customer_memberships").insert(row);
  const { data, error } = await q.select("*").single(); if (error) throw error;
  return { id:data.id,customerId:data.customer_id,planId:data.plan_id,status:data.status,startDate:data.start_date,renewalDate:data.renewal_date,loyaltyPoints:Number(data.loyalty_points),notes:data.notes ?? "",createdAt:data.created_at,updatedAt:data.updated_at };
}
