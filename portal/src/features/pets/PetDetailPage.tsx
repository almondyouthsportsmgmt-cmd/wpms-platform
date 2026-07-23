import { ArrowLeft, CalendarDays, HeartPulse, Pencil, ShieldAlert, Stethoscope, UserRound } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AppButton } from "../../components/common/AppButton";
import { AppCard } from "../../components/common/AppCard";
import { useCustomers } from "../customers/useCustomers";
import { PetFormModal } from "./PetFormModal";
import type { PetInput } from "./petTypes";
import { usePets } from "./usePets";

function ageFromBirthday(value: string) {
  if (!value) return "Age not recorded";
  const birthday = new Date(value);
  const now = new Date();
  let years = now.getFullYear() - birthday.getFullYear();
  if (now < new Date(now.getFullYear(), birthday.getMonth(), birthday.getDate())) years--;
  return `${Math.max(years, 0)} year${years === 1 ? "" : "s"} old`;
}

export function PetDetailPage() {
  const { id } = useParams();
  const { pets, loading, error, save } = usePets();
  const { customers } = useCustomers();
  const [editing, setEditing] = useState(false);
  const pet = pets.find((item) => item.id === id);
  const customer = customers.find((item) => item.id === pet?.customerId);

  async function handleSave(input: PetInput, petId?: string) { await save(input, petId); }

  if (loading) return <div className="module-state"><div className="paw-loader">🐾</div><p>Loading pet...</p></div>;
  if (error) return <div className="module-state error-state"><p>{error}</p></div>;
  if (!pet) return <div className="module-state"><h2>Pet not found</h2><Link to="/pets">Return to pets</Link></div>;

  const vaccinations = [
    ["Rabies", pet.vaccinationRabiesExpiresOn],
    ["Bordetella", pet.vaccinationBordetellaExpiresOn],
    ["DHPP", pet.vaccinationDhppExpiresOn],
  ];

  return <div className="pet-detail-page">
    <div className="detail-topbar"><Link to="/pets" className="back-link"><ArrowLeft size={16}/> Back to pets</Link><AppButton onClick={() => setEditing(true)}><Pencil size={17}/> Edit pet</AppButton></div>
    <section className="pet-profile-hero"><div className="pet-hero-avatar">{pet.species === "Cat" ? "🐈" : "🐕"}</div><div><span className="eyebrow">Pet profile</span><h1>{pet.name}</h1><p>{pet.breed || pet.species} · {ageFromBirthday(pet.birthday)} · {pet.weightPounds ? `${pet.weightPounds} lb` : "Weight not recorded"}</p></div><span className={`status-badge ${pet.isActive ? "is-active" : "is-inactive"}`}>{pet.isActive ? "Active" : "Inactive"}</span></section>
    <section className="profile-grid">
      <AppCard className="profile-card"><h2>Owner</h2><div className="profile-list"><div><UserRound size={17}/><span><small>Customer</small>{customer ? <Link to={`/customers/${customer.id}`}><strong>{customer.firstName} {customer.lastName}</strong></Link> : <strong>Not found</strong>}</span></div><div><span className="profile-icon-text">P</span><span><small>Preferred groomer</small><strong>{pet.preferredGroomer || "Not assigned"}</strong></span></div></div></AppCard>
      <AppCard className="profile-card"><h2>Veterinary care</h2><div className="profile-list"><div><Stethoscope size={17}/><span><small>Veterinarian</small><strong>{pet.veterinarianName || "Not provided"}</strong></span></div><div><span className="profile-icon-text">#</span><span><small>Microchip</small><strong>{pet.microchipNumber || "Not provided"}</strong></span></div></div></AppCard>
      <AppCard className="profile-card profile-wide"><h2>Vaccinations</h2><div className="vaccination-grid">{vaccinations.map(([name, date]) => { const expired = Boolean(date) && new Date(date).getTime() < Date.now(); return <div key={name} className={`vaccination-item ${expired ? "is-expired" : ""}`}><HeartPulse size={18}/><span><strong>{name}</strong><small>{date ? `Expires ${new Date(date).toLocaleDateString()}` : "No date recorded"}</small></span></div>; })}</div></AppCard>
      <AppCard className="profile-card"><h2>Medical alerts</h2><p className="customer-notes"><ShieldAlert size={18}/>{pet.medicalAlerts || "No medical alerts recorded."}</p><h3>Allergies</h3><p className="customer-notes">{pet.allergies || "No allergies recorded."}</p></AppCard>
      <AppCard className="profile-card"><h2>Behavior</h2><p className="customer-notes">{pet.behaviorNotes || "No behavior notes recorded."}</p><h3>Grooming preferences</h3><p className="customer-notes">{pet.groomingNotes || "No grooming notes recorded."}</p></AppCard>
      <AppCard className="profile-card profile-wide"><h2>Pet timeline</h2><div className="profile-placeholder"><CalendarDays size={24}/><div><strong>Timeline ready for Release 0.4</strong><p>Appointments, grooming visits, boarding stays, payments, photos, and messages will appear here.</p></div></div></AppCard>
    </section>
    <PetFormModal pet={pet} customers={customers} open={editing} onClose={() => setEditing(false)} onSave={handleSave}/>
  </div>;
}
