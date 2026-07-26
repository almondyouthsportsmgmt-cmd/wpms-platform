import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { Search, X } from "lucide-react";
import { AppButton } from "../../components/common/AppButton";
import type { Customer } from "../customers/customerTypes";
import type { Pet } from "../pets/petTypes";
import type { BoardingStay, BoardingStayInput } from "./boardingTypes";

type Props = {
  open: boolean;
  customers: Customer[];
  pets: Pet[];
  stay: BoardingStay | null;
  onClose: () => void;
  onSave: (input: BoardingStayInput, id?: string) => Promise<void>;
};

const empty: BoardingStayInput = {
  customerId: "",
  petId: "",
  checkInDate: new Date().toISOString().slice(0, 10),
  checkInTime: "14:00",
  checkOutDate: new Date(Date.now() + 86400000)
    .toISOString()
    .slice(0, 10),
  checkOutTime: "10:00",
  kennelName: "",
  status: "Reserved",
  feedingFrequency: "Twice Daily",
  foodInstructions: "",
  medicationInstructions: "",
  walkInstructions: "",
  playtimeInstructions: "",
  emergencyNotes: "",
  belongings: "",
  dailyRate: 48,
  depositAmount: 0,
  photoUpdatesEnabled: true,
  veterinarianReleaseConfirmed: false,
};

function customerName(customer: Customer) {
  return `${customer.firstName} ${customer.lastName}`.trim();
}

function petLabel(pet: Pet) {
  const breed = pet.breed || pet.species;
  return breed ? `${pet.name} · ${breed}` : pet.name;
}

export function BoardingFormModal({
  open,
  customers,
  pets,
  stay,
  onClose,
  onSave,
}: Props) {
  const [form, setForm] = useState<BoardingStayInput>(empty);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [customerSearch, setCustomerSearch] = useState("");
  const [petSearch, setPetSearch] = useState("");
  const [customerMenuOpen, setCustomerMenuOpen] = useState(false);
  const [petMenuOpen, setPetMenuOpen] = useState(false);

  const activeCustomers = useMemo(
    () => customers.filter((customer) => customer.isActive),
    [customers],
  );

  const activePets = useMemo(
    () => pets.filter((pet) => pet.isActive),
    [pets],
  );

  useEffect(() => {
    if (!open) return;

    const nextForm = stay
      ? {
          customerId: stay.customerId,
          petId: stay.petId,
          checkInDate: stay.checkInDate,
          checkInTime: stay.checkInTime,
          checkOutDate: stay.checkOutDate,
          checkOutTime: stay.checkOutTime,
          kennelName: stay.kennelName,
          status: stay.status,
          feedingFrequency: stay.feedingFrequency,
          foodInstructions: stay.foodInstructions,
          medicationInstructions: stay.medicationInstructions,
          walkInstructions: stay.walkInstructions,
          playtimeInstructions: stay.playtimeInstructions,
          emergencyNotes: stay.emergencyNotes,
          belongings: stay.belongings,
          dailyRate: stay.dailyRate,
          depositAmount: stay.depositAmount,
          photoUpdatesEnabled: stay.photoUpdatesEnabled,
          veterinarianReleaseConfirmed:
            stay.veterinarianReleaseConfirmed,
        }
      : empty;

    setForm(nextForm);

    const selectedCustomer = customers.find(
      (customer) => customer.id === nextForm.customerId,
    );
    const selectedPet = pets.find(
      (pet) => pet.id === nextForm.petId,
    );

    setCustomerSearch(
      selectedCustomer ? customerName(selectedCustomer) : "",
    );
    setPetSearch(selectedPet ? petLabel(selectedPet) : "");
    setCustomerMenuOpen(false);
    setPetMenuOpen(false);
    setError("");
  }, [customers, open, pets, stay]);

  const filteredCustomers = useMemo(() => {
    const needle = customerSearch.trim().toLowerCase();

    if (!needle) return activeCustomers;

    return activeCustomers.filter((customer) =>
      [
        customer.firstName,
        customer.lastName,
        customer.mobilePhone,
        customer.homePhone,
        customer.email,
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [activeCustomers, customerSearch]);

  const filteredPets = useMemo(() => {
    const needle = petSearch.trim().toLowerCase();

    return activePets.filter((pet) => {
      const customer = customers.find(
        (item) => item.id === pet.customerId,
      );

      const matchesCustomer =
        !form.customerId || pet.customerId === form.customerId;

      const matchesSearch =
        !needle ||
        [
          pet.name,
          pet.breed,
          pet.species,
          customer?.firstName,
          customer?.lastName,
        ]
          .join(" ")
          .toLowerCase()
          .includes(needle);

      return matchesCustomer && matchesSearch;
    });
  }, [activePets, customers, form.customerId, petSearch]);

  if (!open) return null;

  function update<K extends keyof BoardingStayInput>(
    key: K,
    value: BoardingStayInput[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function selectCustomer(customer: Customer) {
    const associatedPets = activePets.filter(
      (pet) => pet.customerId === customer.id,
    );
    const firstPet = associatedPets[0] ?? null;

    setForm((current) => ({
      ...current,
      customerId: customer.id,
      petId: firstPet?.id ?? "",
    }));

    setCustomerSearch(customerName(customer));
    setPetSearch(firstPet ? petLabel(firstPet) : "");
    setCustomerMenuOpen(false);

    if (associatedPets.length > 1) {
      setPetMenuOpen(true);
    } else {
      setPetMenuOpen(false);
    }
  }

  function selectPet(pet: Pet) {
    const owner = customers.find(
      (customer) => customer.id === pet.customerId,
    );

    setForm((current) => ({
      ...current,
      petId: pet.id,
      customerId: pet.customerId,
    }));

    setPetSearch(petLabel(pet));
    setCustomerSearch(owner ? customerName(owner) : "");
    setPetMenuOpen(false);
    setCustomerMenuOpen(false);
  }

  function clearCustomerSelection() {
    setForm((current) => ({
      ...current,
      customerId: "",
      petId: "",
    }));
    setCustomerSearch("");
    setPetSearch("");
    setCustomerMenuOpen(true);
  }

  function clearPetSelection() {
    setForm((current) => ({
      ...current,
      petId: "",
    }));
    setPetSearch("");
    setPetMenuOpen(true);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (!form.customerId || !form.petId) {
      setError("Select a customer and pet.");
      return;
    }

    if (!form.checkInDate || !form.checkOutDate) {
      setError("Check-in and check-out dates are required.");
      return;
    }

    if (
      `${form.checkOutDate}T${form.checkOutTime}` <=
      `${form.checkInDate}T${form.checkInTime}`
    ) {
      setError("Check-out must be after check-in.");
      return;
    }

    if (form.dailyRate < 0 || form.depositAmount < 0) {
      setError("Rates and deposits cannot be negative.");
      return;
    }

    setSaving(true);

    try {
      await onSave(form, stay?.id);
      onClose();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to save boarding stay.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-layer" role="presentation">
      <button
        type="button"
        className="modal-backdrop"
        onClick={onClose}
        aria-label="Close boarding form"
      />

      <form className="module-modal boarding-modal" onSubmit={submit}>
        <div className="modal-head">
          <div>
            <span className="eyebrow">Boarding</span>
            <h2>
              {stay ? "Edit stay" : "New boarding reservation"}
            </h2>
          </div>

          <button
            type="button"
            className="icon-button"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {error && <div className="form-error">{error}</div>}

        <div className="form-grid two-column">
          <div className="field searchable-select-field">
            <span>Customer *</span>

            <div className="searchable-select-input">
              <Search size={16} />

              <input
                value={customerSearch}
                placeholder="Type a customer name..."
                autoComplete="off"
                onFocus={() => setCustomerMenuOpen(true)}
                onChange={(event) => {
                  setCustomerSearch(event.target.value);
                  setCustomerMenuOpen(true);

                  if (form.customerId) {
                    setForm((current) => ({
                      ...current,
                      customerId: "",
                      petId: "",
                    }));
                    setPetSearch("");
                  }
                }}
              />

              {customerSearch && (
                <button
                  type="button"
                  onClick={clearCustomerSelection}
                  aria-label="Clear customer"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {customerMenuOpen && (
              <div className="searchable-select-menu">
                {filteredCustomers.length === 0 ? (
                  <div className="searchable-select-empty">
                    No customers found
                  </div>
                ) : (
                  filteredCustomers.map((customer) => (
                    <button
                      type="button"
                      key={customer.id}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => selectCustomer(customer)}
                    >
                      <strong>{customerName(customer)}</strong>
                      <small>
                        {customer.mobilePhone ||
                          customer.email ||
                          "No contact information"}
                      </small>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="field searchable-select-field">
            <span>Pet *</span>

            <div className="searchable-select-input">
              <Search size={16} />

              <input
                value={petSearch}
                placeholder="Type a pet name..."
                autoComplete="off"
                onFocus={() => setPetMenuOpen(true)}
                onChange={(event) => {
                  setPetSearch(event.target.value);
                  setPetMenuOpen(true);

                  if (form.petId) {
                    setForm((current) => ({
                      ...current,
                      petId: "",
                    }));
                  }
                }}
              />

              {petSearch && (
                <button
                  type="button"
                  onClick={clearPetSelection}
                  aria-label="Clear pet"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {petMenuOpen && (
              <div className="searchable-select-menu">
                {filteredPets.length === 0 ? (
                  <div className="searchable-select-empty">
                    No pets found
                  </div>
                ) : (
                  filteredPets.map((pet) => {
                    const owner = customers.find(
                      (customer) => customer.id === pet.customerId,
                    );

                    return (
                      <button
                        type="button"
                        key={pet.id}
                        onMouseDown={(event) =>
                          event.preventDefault()
                        }
                        onClick={() => selectPet(pet)}
                      >
                        <strong>{petLabel(pet)}</strong>
                        <small>
                          Owner:{" "}
                          {owner
                            ? customerName(owner)
                            : "Not available"}
                        </small>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>

          <label className="field">
            <span>Check-in date</span>
            <input
              type="date"
              value={form.checkInDate}
              onChange={(event) =>
                update("checkInDate", event.target.value)
              }
              required
            />
          </label>

          <label className="field">
            <span>Check-in time</span>
            <input
              type="time"
              value={form.checkInTime}
              onChange={(event) =>
                update("checkInTime", event.target.value)
              }
              required
            />
          </label>

          <label className="field">
            <span>Check-out date</span>
            <input
              type="date"
              value={form.checkOutDate}
              onChange={(event) =>
                update("checkOutDate", event.target.value)
              }
              required
            />
          </label>

          <label className="field">
            <span>Check-out time</span>
            <input
              type="time"
              value={form.checkOutTime}
              onChange={(event) =>
                update("checkOutTime", event.target.value)
              }
              required
            />
          </label>

          <label className="field">
            <span>Kennel / suite</span>
            <input
              value={form.kennelName}
              onChange={(event) =>
                update("kennelName", event.target.value)
              }
              placeholder="Suite A1"
            />
          </label>

          <label className="field">
            <span>Status</span>
            <select
              value={form.status}
              onChange={(event) =>
                update(
                  "status",
                  event.target.value as BoardingStayInput["status"],
                )
              }
            >
              {[
                "Reserved",
                "Checked In",
                "In Stay",
                "Ready for Checkout",
                "Checked Out",
                "Cancelled",
              ].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Daily rate</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.dailyRate}
              onChange={(event) =>
                update("dailyRate", Number(event.target.value))
              }
            />
          </label>

          <label className="field">
            <span>Deposit</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.depositAmount}
              onChange={(event) =>
                update(
                  "depositAmount",
                  Number(event.target.value),
                )
              }
            />
          </label>

          <label className="field">
            <span>Feeding frequency</span>
            <select
              value={form.feedingFrequency}
              onChange={(event) =>
                update(
                  "feedingFrequency",
                  event.target
                    .value as BoardingStayInput["feedingFrequency"],
                )
              }
            >
              {[
                "Once Daily",
                "Twice Daily",
                "Three Times Daily",
                "Custom",
              ].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>

          <label className="field checkbox-field">
            <input
              type="checkbox"
              checked={form.photoUpdatesEnabled}
              onChange={(event) =>
                update(
                  "photoUpdatesEnabled",
                  event.target.checked,
                )
              }
            />
            <span>Send photo updates</span>
          </label>

          <label className="field full">
            <span>Food instructions</span>
            <textarea
              value={form.foodInstructions}
              onChange={(event) =>
                update("foodInstructions", event.target.value)
              }
              rows={2}
            />
          </label>

          <label className="field full">
            <span>Medication instructions</span>
            <textarea
              value={form.medicationInstructions}
              onChange={(event) =>
                update(
                  "medicationInstructions",
                  event.target.value,
                )
              }
              rows={2}
            />
          </label>

          <label className="field full">
            <span>Walk instructions</span>
            <textarea
              value={form.walkInstructions}
              onChange={(event) =>
                update("walkInstructions", event.target.value)
              }
              rows={2}
            />
          </label>

          <label className="field full">
            <span>Playtime instructions</span>
            <textarea
              value={form.playtimeInstructions}
              onChange={(event) =>
                update(
                  "playtimeInstructions",
                  event.target.value,
                )
              }
              rows={2}
            />
          </label>

          <label className="field full">
            <span>Belongings</span>
            <textarea
              value={form.belongings}
              onChange={(event) =>
                update("belongings", event.target.value)
              }
              rows={2}
            />
          </label>

          <label className="field full">
            <span>Emergency notes</span>
            <textarea
              value={form.emergencyNotes}
              onChange={(event) =>
                update("emergencyNotes", event.target.value)
              }
              rows={2}
            />
          </label>

          <label className="field checkbox-field full">
            <input
              type="checkbox"
              checked={form.veterinarianReleaseConfirmed}
              onChange={(event) =>
                update(
                  "veterinarianReleaseConfirmed",
                  event.target.checked,
                )
              }
            />
            <span>Veterinarian release confirmed</span>
          </label>
        </div>

        <div className="modal-actions">
          <AppButton
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </AppButton>

          <AppButton disabled={saving}>
            {saving ? "Saving..." : "Save stay"}
          </AppButton>
        </div>
      </form>
    </div>
  );
}
