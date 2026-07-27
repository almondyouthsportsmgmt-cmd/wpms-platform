import { AlertTriangle, Mail, PawPrint, Phone, UserRound } from "lucide-react";
import type { Customer } from "../../customers/customerTypes";
import type { Pet } from "../../pets/petTypes";

type Props = {
  customer: Customer | null;
  pets: Pet[];
  includedPetIds: string[];
};

function expired(value: string) {
  if (!value) return false;
  return new Date(`${value}T23:59:59`).getTime() < Date.now();
}

export default function FrontDeskCustomerPanel({ customer, pets, includedPetIds }: Props) {
  if (!customer) {
    return (
      <section className="pos-customer-panel pos-empty-panel">
        <UserRound size={34} />
        <h2>Customer unavailable</h2>
      </section>
    );
  }

  const included = pets.filter((pet) => includedPetIds.includes(pet.id));
  const visiblePets = included.length > 0 ? included : pets;

  return (
    <section className="pos-customer-panel">
      <div className="pos-section-heading">
        <span className="eyebrow">Customer & pets</span>
        <h2>{customer.firstName} {customer.lastName}</h2>
      </div>

      <div className="pos-contact-list">
        <span><Phone size={15} /> {customer.mobilePhone || "No mobile phone"}</span>
        <span><Mail size={15} /> {customer.email || "No email"}</span>
      </div>

      {customer.notes && (
        <div className="pos-customer-notes">
          <strong>Customer notes</strong>
          <p>{customer.notes}</p>
        </div>
      )}

      <div className="pos-pet-list">
        {visiblePets.map((pet) => {
          const vaccineAlert =
            expired(pet.vaccinationRabiesExpiresOn) ||
            expired(pet.vaccinationBordetellaExpiresOn) ||
            expired(pet.vaccinationDhppExpiresOn);

          return (
            <article key={pet.id} className="pos-pet-card">
              <div className="pos-pet-avatar">{pet.avatar || "🐾"}</div>
              <div className="pos-pet-copy">
                <div>
                  <strong>{pet.name}</strong>
                  {includedPetIds.includes(pet.id) && <span className="pos-included-chip">On invoice</span>}
                </div>
                <small>{pet.breed || pet.species} · {pet.size}</small>
                {pet.medicalAlerts && <p><AlertTriangle size={14} /> {pet.medicalAlerts}</p>}
                {vaccineAlert && <p className="pos-warning"><AlertTriangle size={14} /> Vaccination review needed</p>}
              </div>
            </article>
          );
        })}

        {visiblePets.length === 0 && (
          <div className="pos-empty-list"><PawPrint size={22} /> No pets found for this customer.</div>
        )}
      </div>
    </section>
  );
}
