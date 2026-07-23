import { ArrowLeft, Mail, MapPin, Phone, ShieldAlert } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useState } from "react";
import { AppCard } from "../../components/common/AppCard";
import { useCustomers } from "./useCustomers";
import { usePets } from "../pets/usePets";
import { PetFormModal } from "../pets/PetFormModal";
import type { PetInput } from "../pets/petTypes";

export function CustomerDetailPage() {
  const { id } = useParams();
  const { customers, loading, error } = useCustomers();
  const customer = customers.find((item) => item.id === id);
  const { pets, save: savePet } = usePets();
  const [petModalOpen, setPetModalOpen] = useState(false);
  const customerPets = pets.filter((pet) => pet.customerId === id);
  async function handlePetSave(input: PetInput, petId?: string) { await savePet(input, petId); }

  if (loading) return <div className="module-state"><div className="paw-loader">🐾</div><p>Loading customer...</p></div>;
  if (error) return <div className="module-state error-state"><p>{error}</p></div>;
  if (!customer) return <div className="module-state"><h2>Customer not found</h2><Link to="/customers">Return to customers</Link></div>;

  return (
    <div className="customer-detail-page">
      <Link to="/customers" className="back-link"><ArrowLeft size={16} /> Back to customers</Link>
      <section className="customer-profile-hero">
        <div className="profile-avatar">{customer.firstName[0]}{customer.lastName[0]}</div>
        <div><span className="eyebrow">Customer profile</span><h1>{customer.firstName} {customer.lastName}</h1><p>{customer.isActive ? "Active customer" : "Inactive customer"}</p></div>
      </section>
      <section className="profile-grid">
        <AppCard className="profile-card"><h2>Contact information</h2><div className="profile-list"><div><Phone size={17} /><span><small>Mobile</small><strong>{customer.mobilePhone}</strong></span></div><div><Mail size={17} /><span><small>Email</small><strong>{customer.email || "Not provided"}</strong></span></div><div><MapPin size={17} /><span><small>Address</small><strong>{[customer.streetAddress, customer.city, customer.state, customer.zipCode].filter(Boolean).join(", ") || "Not provided"}</strong></span></div></div></AppCard>
        <AppCard className="profile-card"><h2>Emergency contact</h2><div className="profile-list"><div><ShieldAlert size={17} /><span><small>Name</small><strong>{customer.emergencyContactName || "Not provided"}</strong></span></div><div><Phone size={17} /><span><small>Phone</small><strong>{customer.emergencyContactPhone || "Not provided"}</strong></span></div><div><span className="profile-icon-text">R</span><span><small>Relationship</small><strong>{customer.emergencyRelationship || "Not provided"}</strong></span></div></div></AppCard>
        <AppCard className="profile-card profile-wide"><div className="card-heading"><h2>Pets</h2><button className="link-button" onClick={() => setPetModalOpen(true)}>+ Add pet</button></div>{customerPets.length === 0 ? <div className="profile-placeholder"><span>🐶</span><div><strong>No pets added yet</strong><p>Create the first pet profile for this customer.</p></div></div> : <div className="customer-pet-list">{customerPets.map((pet) => <Link key={pet.id} to={`/pets/${pet.id}`} className="customer-pet-item"><span className="customer-pet-avatar">{pet.species === "Cat" ? "🐈" : "🐕"}</span><span><strong>{pet.name}</strong><small>{pet.breed || pet.species}</small></span><span className={`status-badge ${pet.isActive ? "is-active" : "is-inactive"}`}>{pet.isActive ? "Active" : "Inactive"}</span></Link>)}</div>}</AppCard>
        <AppCard className="profile-card"><h2>Preferences</h2><dl className="profile-definition"><div><dt>Preferred contact</dt><dd>{customer.preferredContactMethod}</dd></div><div><dt>Marketing</dt><dd>{customer.marketingOptIn ? "Opted in" : "Opted out"}</dd></div></dl></AppCard>
        <AppCard className="profile-card"><h2>Notes</h2><p className="customer-notes">{customer.notes || "No notes recorded."}</p></AppCard>
      </section>
      <PetFormModal pet={null} customers={customers} defaultCustomerId={customer.id} open={petModalOpen} onClose={() => setPetModalOpen(false)} onSave={handlePetSave}/>
    </div>
  );
}
