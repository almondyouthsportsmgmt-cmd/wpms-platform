import { useMemo, useState, type FormEvent } from "react";
import {
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  Hotel,
  Pencil,
  RefreshCw,
  Search,
  Sparkles,
  UsersRound,
  Wrench,
} from "lucide-react";
import { AppButton } from "../../components/common/AppButton";
import { AppCard } from "../../components/common/AppCard";
import { useCustomers } from "../customers/useCustomers";
import { usePets } from "../pets/usePets";
import type {
  Kennel,
  KennelInput,
  KennelStatus,
  KennelType,
} from "./kennelTypes";
import { useKennels } from "./useKennels";

const statuses: KennelStatus[] = [
  "Available",
  "Reserved",
  "Occupied",
  "Cleaning",
  "Maintenance",
];

const types: KennelType[] = [
  "Standard",
  "Luxury",
  "Cat Condo",
  "Isolation",
  "Daycare",
];

const blank: KennelInput = {
  name: "",
  zone: "",
  type: "Standard",
  capacity: 1,
  status: "Available",
  petIds: [],
  customerId: "",
  checkInDate: "",
  checkOutDate: "",
  price: 0,
  notes: "",
};

function statusClass(status: string) {
  return status.toLowerCase().replaceAll(" ", "-");
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function daysUntil(date: string) {
  if (!date) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(`${date}T00:00:00`);
  return Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
}

export function KennelMapPage() {
  const { kennels, loading, error, refresh, save } = useKennels();
  const { customers } = useCustomers();
  const { pets } = usePets();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [zone, setZone] = useState("All");
  const [editing, setEditing] = useState<Kennel | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<KennelInput>({ ...blank });
  const [notice, setNotice] = useState("");

  const customerMap = useMemo(
    () => new Map(customers.map((item) => [item.id, item])),
    [customers],
  );

  const petMap = useMemo(
    () => new Map(pets.map((item) => [item.id, item])),
    [pets],
  );

  const zones = useMemo(
    () =>
      Array.from(new Set(kennels.map((item) => item.zone)))
        .filter(Boolean)
        .sort(),
    [kennels],
  );

  const today = new Date().toISOString().slice(0, 10);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return kennels.filter((item) => {
      const assignedPets = item.petIds
        .map((petId) => petMap.get(petId))
        .filter(Boolean);

      const owner = customerMap.get(item.customerId);

      const haystack = [
        item.name,
        item.zone,
        item.type,
        item.status,
        ...assignedPets.map((pet) => pet?.name),
        owner?.firstName,
        owner?.lastName,
      ]
        .join(" ")
        .toLowerCase();

      const matchesQuery = !needle || haystack.includes(needle);
      const matchesStatus =
        status === "All" || item.status === status;
      const matchesZone = zone === "All" || item.zone === zone;

      return matchesQuery && matchesStatus && matchesZone;
    });
  }, [customerMap, kennels, petMap, query, status, zone]);

  const summary = useMemo(() => {
    const available = kennels.filter(
      (item) => item.status === "Available",
    ).length;

    const occupied = kennels.filter(
      (item) => item.status === "Occupied",
    ).length;

    const arrivals = kennels.filter(
      (item) =>
        item.checkInDate === today &&
        ["Reserved", "Occupied"].includes(item.status),
    ).length;

    const departures = kennels.filter(
      (item) =>
        item.checkOutDate === today &&
        ["Reserved", "Occupied"].includes(item.status),
    ).length;

    const cleaning = kennels.filter((item) =>
      ["Cleaning", "Maintenance"].includes(item.status),
    ).length;

    const dailyRevenue = kennels
      .filter((item) =>
        ["Reserved", "Occupied"].includes(item.status),
      )
      .reduce((sum, item) => sum + item.price, 0);

    return {
      available,
      occupied,
      arrivals,
      departures,
      cleaning,
      dailyRevenue,
    };
  }, [kennels, today]);

  function show(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  }

  function openEditor(item?: Kennel) {
    setEditing(item ?? null);

    setForm(
      item
        ? {
            name: item.name,
            zone: item.zone,
            type: item.type,
            capacity: item.capacity,
            status: item.status,
            petIds: [...item.petIds],
            customerId: item.customerId,
            checkInDate: item.checkInDate,
            checkOutDate: item.checkOutDate,
            price: item.price,
            notes: item.notes,
          }
        : { ...blank },
    );

    setModalOpen(true);
  }

  function closeEditor() {
    setModalOpen(false);
    setEditing(null);
    setForm({ ...blank });
  }

  function update<K extends keyof KennelInput>(
    key: K,
    value: KennelInput[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();

    if (!form.name.trim() || !form.zone.trim()) return;

    await save(form, editing?.id);

    show(editing ? "Kennel updated." : "Kennel added.");
    closeEditor();
  }

  async function quickStatus(
    kennel: Kennel,
    nextStatus: KennelStatus,
  ) {
    await save(
      {
        name: kennel.name,
        zone: kennel.zone,
        type: kennel.type,
        capacity: kennel.capacity,
        status: nextStatus,
        petIds:
          nextStatus === "Available" ||
          nextStatus === "Cleaning" ||
          nextStatus === "Maintenance"
            ? []
            : [...kennel.petIds],
        customerId:
          nextStatus === "Available" ||
          nextStatus === "Cleaning" ||
          nextStatus === "Maintenance"
            ? ""
            : kennel.customerId,
        checkInDate:
          nextStatus === "Available" ? "" : kennel.checkInDate,
        checkOutDate:
          nextStatus === "Available" ? "" : kennel.checkOutDate,
        price: kennel.price,
        notes: kennel.notes,
      },
      kennel.id,
    );

    show(`${kennel.name} updated to ${nextStatus}.`);
  }

  return (
    <div className="kennel-page kennel-map-v2">
      <section className="page-toolbar">
        <div className="page-head">
          <span className="eyebrow">Boarding operations</span>
          <h1>Kennel Map</h1>
          <p>
            Track occupancy, pricing, shared-pet capacity,
            arrivals, departures, cleaning, and maintenance.
          </p>
        </div>

        <div className="toolbar-actions">
          <AppButton
            variant="secondary"
            onClick={() => void refresh()}
          >
            <RefreshCw size={17} /> Refresh
          </AppButton>

          <AppButton onClick={() => openEditor()}>
            + Add kennel
          </AppButton>
        </div>
      </section>

      {notice && <div className="success-notice">{notice}</div>}

      <section className="kennel-summary-grid">
        <AppCard className="summary-card">
          <Hotel size={22} />
          <div>
            <span>Available</span>
            <strong>{summary.available}</strong>
          </div>
        </AppCard>

        <AppCard className="summary-card">
          <UsersRound size={22} />
          <div>
            <span>Occupied</span>
            <strong>{summary.occupied}</strong>
          </div>
        </AppCard>

        <AppCard className="summary-card">
          <CalendarCheck size={22} />
          <div>
            <span>Check-ins today</span>
            <strong>{summary.arrivals}</strong>
          </div>
        </AppCard>

        <AppCard className="summary-card">
          <CalendarClock size={22} />
          <div>
            <span>Check-outs today</span>
            <strong>{summary.departures}</strong>
          </div>
        </AppCard>

        <AppCard className="summary-card">
          <Wrench size={22} />
          <div>
            <span>Cleaning / maintenance</span>
            <strong>{summary.cleaning}</strong>
          </div>
        </AppCard>

        <AppCard className="summary-card">
          <span className="summary-emoji">💵</span>
          <div>
            <span>Daily kennel revenue</span>
            <strong>{formatCurrency(summary.dailyRevenue)}</strong>
          </div>
        </AppCard>
      </section>

      <section className="module-controls kennel-map-controls">
        <div className="module-search">
          <Search size={18} />
          <input
            aria-label="Search kennel map"
            placeholder="Search kennel, zone, pet, or owner..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <select
          aria-label="Filter kennel zone"
          value={zone}
          onChange={(event) => setZone(event.target.value)}
        >
          <option>All</option>
          {zones.map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>

        <select
          aria-label="Filter kennel status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option>All</option>
          {statuses.map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </section>

      {loading && (
        <div className="module-state">
          <div className="paw-loader">🐾</div>
          <p>Loading kennel map...</p>
        </div>
      )}

      {!loading && error && (
        <div className="module-state error-state">
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <AppCard className="empty-state">
          <div className="empty-icon">🏨</div>
          <h2>No kennels found</h2>
          <p>
            Add the first kennel or adjust your search and filters.
          </p>
        </AppCard>
      )}

      {!loading && !error && filtered.length > 0 && (
        <section className="kennel-floor-grid">
          {filtered.map((item) => {
            const assignedPets = item.petIds
              .map((petId) => petMap.get(petId))
              .filter(Boolean);

            const owner = customerMap.get(item.customerId);
            const remaining = daysUntil(item.checkOutDate);

            return (
              <AppCard
                className={`kennel-floor-card kennel-${statusClass(
                  item.status,
                )}`}
                key={item.id}
              >
                <div className="kennel-floor-card-top">
                  <div>
                    <span className="kennel-zone-label">
                      {item.zone}
                    </span>
                    <h3>{item.name}</h3>
                  </div>

                  <button
                    className="icon-button"
                    onClick={() => openEditor(item)}
                    aria-label={`Edit ${item.name}`}
                  >
                    <Pencil size={16} />
                  </button>
                </div>

                <div className="kennel-status-row">
                  <span
                    className={`status-chip status-${statusClass(
                      item.status,
                    )}`}
                  >
                    {item.status}
                  </span>

                  <strong>{formatCurrency(item.price)}/night</strong>
                </div>

                <div className="kennel-capacity-display">
                  <span>
                    {assignedPets.length} / {item.capacity} pets
                  </span>
                  <div>
                    <i
                      style={{
                        width: `${Math.min(
                          100,
                          (assignedPets.length /
                            Math.max(item.capacity, 1)) *
                            100,
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="kennel-occupant-panel">
                  {assignedPets.length > 0 ? (
                    <>
                      <div className="kennel-pet-stack">
                        {assignedPets.slice(0, 3).map((pet) => (
                          <span key={pet?.id}>
                            {pet?.species === "Cat" ? "🐈" : "🐕"}
                          </span>
                        ))}
                      </div>

                      <div>
                        <strong>
                          {assignedPets
                            .map((pet) => pet?.name)
                            .join(", ")}
                        </strong>
                        <span>
                          {owner
                            ? `${owner.firstName} ${owner.lastName}`
                            : "Owner unavailable"}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <Sparkles size={20} />
                      <div>
                        <strong>No pets assigned</strong>
                        <span>
                          Ready for a boarding reservation.
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <div className="kennel-stay-details">
                  <div>
                    <span>Check in</span>
                    <strong>{item.checkInDate || "—"}</strong>
                  </div>

                  <div>
                    <span>Check out</span>
                    <strong>{item.checkOutDate || "—"}</strong>
                  </div>

                  <div>
                    <span>Stay remaining</span>
                    <strong>
                      {remaining === null
                        ? "—"
                        : remaining < 0
                          ? "Past due"
                          : remaining === 0
                            ? "Today"
                            : `${remaining} day${
                                remaining === 1 ? "" : "s"
                              }`}
                    </strong>
                  </div>
                </div>

                {item.notes && (
                  <p className="kennel-floor-notes">{item.notes}</p>
                )}

                <div className="kennel-quick-actions">
                  {item.status === "Reserved" && (
                    <AppButton
                      variant="secondary"
                      onClick={() =>
                        void quickStatus(item, "Occupied")
                      }
                    >
                      Check in
                    </AppButton>
                  )}

                  {item.status === "Occupied" && (
                    <AppButton
                      variant="secondary"
                      onClick={() =>
                        void quickStatus(item, "Cleaning")
                      }
                    >
                      Check out
                    </AppButton>
                  )}

                  {item.status === "Cleaning" && (
                    <AppButton
                      variant="secondary"
                      onClick={() =>
                        void quickStatus(item, "Available")
                      }
                    >
                      Mark clean
                    </AppButton>
                  )}

                  {item.status === "Maintenance" && (
                    <AppButton
                      variant="secondary"
                      onClick={() =>
                        void quickStatus(item, "Available")
                      }
                    >
                      Return to service
                    </AppButton>
                  )}

                  {item.status === "Available" && (
                    <span className="kennel-ready-label">
                      <CheckCircle2 size={16} /> Ready
                    </span>
                  )}
                </div>
              </AppCard>
            );
          })}
        </section>
      )}

      {modalOpen && (
        <div className="modal-layer" role="presentation">
          <button
            type="button"
            className="modal-backdrop"
            onClick={closeEditor}
            aria-label="Close kennel editor"
          />

          <form
            className="module-modal kennel-modal"
            onSubmit={submit}
            role="dialog"
            aria-modal="true"
            aria-labelledby="kennel-modal-title"
          >
            <div className="modal-head">
              <div>
                <span className="eyebrow">Kennel setup</span>
                <h2 id="kennel-modal-title">
                  {editing ? "Edit kennel" : "Add kennel"}
                </h2>
              </div>

              <button
                type="button"
                className="icon-button"
                onClick={closeEditor}
                aria-label="Close kennel editor"
              >
                ×
              </button>
            </div>

            <div className="form-grid two-column">
              <label className="field">
                <span>Name</span>
                <input
                  value={form.name}
                  onChange={(event) =>
                    update("name", event.target.value)
                  }
                  required
                />
              </label>

              <label className="field">
                <span>Zone</span>
                <input
                  value={form.zone}
                  onChange={(event) =>
                    update("zone", event.target.value)
                  }
                  required
                />
              </label>

              <label className="field">
                <span>Type</span>
                <select
                  value={form.type}
                  onChange={(event) =>
                    update(
                      "type",
                      event.target.value as KennelType,
                    )
                  }
                >
                  {types.map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Capacity</span>
                <input
                  type="number"
                  min="1"
                  value={form.capacity}
                  onChange={(event) => {
                    const capacity = Number(event.target.value);

                    setForm((current) => ({
                      ...current,
                      capacity,
                      petIds: current.petIds.slice(0, capacity),
                    }));
                  }}
                />
              </label>

              <label className="field">
                <span>Status</span>
                <select
                  value={form.status}
                  onChange={(event) =>
                    update(
                      "status",
                      event.target.value as KennelStatus,
                    )
                  }
                >
                  {statuses.map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Price per night</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(event) =>
                    update("price", Number(event.target.value))
                  }
                />
              </label>

              <label className="field">
                <span>Customer</span>
                <select
                  value={form.customerId}
                  onChange={(event) => {
                    const customerId = event.target.value;

                    setForm((current) => ({
                      ...current,
                      customerId,
                      petIds: current.petIds.filter((petId) =>
                        pets.some(
                          (pet) =>
                            pet.id === petId &&
                            pet.customerId === customerId,
                        ),
                      ),
                    }));
                  }}
                >
                  <option value="">None</option>
                  {customers.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.firstName} {item.lastName}
                    </option>
                  ))}
                </select>
              </label>

              <fieldset className="field kennel-pet-selector">
                <legend>Pets sharing this kennel</legend>

                <div className="kennel-pet-options">
                  {pets
                    .filter(
                      (pet) =>
                        !form.customerId ||
                        pet.customerId === form.customerId,
                    )
                    .map((pet) => {
                      const checked = form.petIds.includes(pet.id);
                      const atCapacity =
                        !checked &&
                        form.petIds.length >= form.capacity;

                      return (
                        <label key={pet.id}>
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={atCapacity}
                            onChange={(event) => {
                              const nextPetIds = event.target.checked
                                ? [...form.petIds, pet.id]
                                : form.petIds.filter(
                                    (petId) => petId !== pet.id,
                                  );

                              setForm((current) => ({
                                ...current,
                                petIds: nextPetIds,
                                customerId:
                                  current.customerId ||
                                  pet.customerId,
                              }));
                            }}
                          />

                          <span>
                            <strong>{pet.name}</strong>
                            <small>{pet.breed || pet.species}</small>
                          </span>
                        </label>
                      );
                    })}
                </div>

                <small className="kennel-capacity-note">
                  Selected {form.petIds.length} of {form.capacity}
                </small>
              </fieldset>

              <label className="field">
                <span>Check in</span>
                <input
                  type="date"
                  value={form.checkInDate}
                  onChange={(event) =>
                    update("checkInDate", event.target.value)
                  }
                />
              </label>

              <label className="field">
                <span>Check out</span>
                <input
                  type="date"
                  value={form.checkOutDate}
                  onChange={(event) =>
                    update("checkOutDate", event.target.value)
                  }
                />
              </label>

              <label className="field full">
                <span>Notes</span>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(event) =>
                    update("notes", event.target.value)
                  }
                />
              </label>
            </div>

            <div className="modal-actions">
              <AppButton
                type="button"
                variant="secondary"
                onClick={closeEditor}
              >
                Cancel
              </AppButton>

              <AppButton type="submit">Save kennel</AppButton>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
