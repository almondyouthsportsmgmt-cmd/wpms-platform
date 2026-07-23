import { useMemo, useState } from "react";
import { CalendarDays, HeartPulse, Pencil, Plus, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { AppButton } from "../../components/common/AppButton";
import { AppCard } from "../../components/common/AppCard";
import { useCustomers } from "../customers/useCustomers";
import { PetFormModal } from "./PetFormModal";
import type { Pet, PetInput } from "./petTypes";
import { usePets } from "./usePets";

function vaccinationStatus(pet: Pet) {
  const dates = [pet.vaccinationRabiesExpiresOn, pet.vaccinationBordetellaExpiresOn, pet.vaccinationDhppExpiresOn].filter(Boolean);
  if (dates.length === 0) return "Missing";
  const soon = Date.now() + 30 * 24 * 60 * 60 * 1000;
  if (dates.some((date) => new Date(date).getTime() < Date.now())) return "Expired";
  if (dates.some((date) => new Date(date).getTime() <= soon)) return "Due soon";
  return "Current";
}

export function PetsPage() {
  const { pets, loading, error, refresh, save } = usePets();
  const { customers } = useCustomers();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"All" | "Active" | "Inactive">("All");
  const [customerId, setCustomerId] = useState("All");
  const [editing, setEditing] = useState<Pet | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [notice, setNotice] = useState("");

  const customerMap = useMemo(() => new Map(customers.map((customer) => [customer.id, customer])), [customers]);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return pets.filter((pet) => {
      const customer = customerMap.get(pet.customerId);
      const haystack = [pet.name, pet.breed, pet.species, customer?.firstName, customer?.lastName].join(" ").toLowerCase();
      const matchesSearch = !needle || haystack.includes(needle);
      const matchesStatus = status === "All" || (status === "Active" ? pet.isActive : !pet.isActive);
      const matchesCustomer = customerId === "All" || pet.customerId === customerId;
      return matchesSearch && matchesStatus && matchesCustomer;
    });
  }, [customerId, customerMap, pets, query, status]);

  async function handleSave(input: PetInput, id?: string) {
    await save(input, id);
    setNotice(id ? "Pet updated successfully." : "Pet added successfully.");
    window.setTimeout(() => setNotice(""), 2800);
  }

  const currentVaccinations = pets.filter((pet) => vaccinationStatus(pet) === "Current").length;

  return <div className="pets-page">
    <section className="page-toolbar"><div className="page-head"><span className="eyebrow">Pet care records</span><h1>Pets</h1><p>Manage health alerts, behavior, vaccinations, grooming preferences, and family relationships.</p></div><AppButton onClick={() => { setEditing(null); setModalOpen(true); }}><Plus size={18}/> Add pet</AppButton></section>
    {notice && <div className="success-notice">{notice}</div>}
    <section className="customer-summary-grid"><AppCard className="summary-card"><span className="pet-summary-icon">🐾</span><div><span>Total pets</span><strong>{pets.length}</strong></div></AppCard><AppCard className="summary-card"><HeartPulse size={22}/><div><span>Vaccinations current</span><strong>{currentVaccinations}</strong></div></AppCard><AppCard className="summary-card"><CalendarDays size={22}/><div><span>Need attention</span><strong>{pets.length - currentVaccinations}</strong></div></AppCard></section>
    <AppCard className="customer-directory-card">
      <div className="directory-toolbar"><div className="module-search"><Search size={18}/><input aria-label="Search pets" placeholder="Search pet, breed, or owner..." value={query} onChange={(e) => setQuery(e.target.value)}/></div><select aria-label="Filter by customer" value={customerId} onChange={(e) => setCustomerId(e.target.value)}><option value="All">All customers</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.firstName} {customer.lastName}</option>)}</select><select aria-label="Filter pet status" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}><option>All</option><option>Active</option><option>Inactive</option></select><button className="link-button" onClick={() => void refresh()}>Refresh</button></div>
      {loading && <div className="module-state"><div className="paw-loader">🐾</div><p>Loading pets...</p></div>}
      {!loading && error && <div className="module-state error-state"><p>{error}</p><AppButton onClick={() => void refresh()}>Try again</AppButton></div>}
      {!loading && !error && filtered.length === 0 && <div className="module-state"><div className="empty-icon">🐶</div><h2>No pets found</h2><p>Adjust the filters or add the shop’s first pet profile.</p></div>}
      {!loading && !error && filtered.length > 0 && <div className="pet-grid">{filtered.map((pet) => { const customer = customerMap.get(pet.customerId); const vaccine = vaccinationStatus(pet); return <AppCard className="pet-directory-card" key={pet.id}><div className="pet-card-top"><Link to={`/pets/${pet.id}`} className="pet-card-avatar">{pet.photoUrl ? <img src={pet.photoUrl} alt=""/> : pet.species === "Cat" ? "🐈" : "🐕"}</Link><div className="pet-card-copy"><Link to={`/pets/${pet.id}`}><strong>{pet.name}</strong></Link><span>{pet.breed || pet.species}</span><small>{customer ? `${customer.firstName} ${customer.lastName}` : "Owner unavailable"}</small></div><button className="icon-button" aria-label={`Edit ${pet.name}`} onClick={() => { setEditing(pet); setModalOpen(true); }}><Pencil size={16}/></button></div><div className="pet-card-meta"><span>{pet.size}</span><span>{pet.weightPounds ? `${pet.weightPounds} lb` : "Weight not set"}</span><span className={`vaccine-badge vaccine-${vaccine.toLowerCase().replace(" ", "-")}`}>{vaccine}</span></div></AppCard>; })}</div>}
    </AppCard>
    <PetFormModal pet={editing} customers={customers} open={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSave}/>
  </div>;
}
