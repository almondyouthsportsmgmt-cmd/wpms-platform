import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Copy,
  DollarSign,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { AppButton } from "../../components/common/AppButton";
import { AppCard } from "../../components/common/AppCard";
import { GroomingServiceModal } from "./GroomingServiceModal";
import type {
  GroomingService,
  GroomingServiceCategory,
} from "./groomingServiceTypes";
import { useGroomingServices } from "./useGroomingServices";

function durationLabel(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (!hours) return `${remainder} min`;
  if (!remainder) return `${hours} h`;
  return `${hours} h ${remainder} min`;
}

export function GroomingPage() {
  const {
    services,
    loading,
    error,
    refresh,
    save,
    remove,
    duplicate,
    raisePrices,
  } = useGroomingServices();

  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<GroomingService | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState("");
  const [bulkCategory, setBulkCategory] = useState<GroomingServiceCategory | "All">("All");
  const [bulkMode, setBulkMode] = useState<"percent" | "amount">("percent");
  const [bulkValue, setBulkValue] = useState(0);
  const [bulkOpen, setBulkOpen] = useState(false);

  const categories = useMemo(
    () => Array.from(new Set(services.map((item) => item.category))),
    [services],
  );

  const grouped = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = services.filter((service) =>
      [
        service.name,
        service.category,
        service.description,
        service.species,
      ].join(" ").toLowerCase().includes(needle),
    );

    return categories.map((category) => ({
      category,
      items: filtered.filter((item) => item.category === category),
    })).filter((group) => group.items.length > 0);
  }, [categories, query, services]);

  function show(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2400);
  }

  async function handleDelete(service: GroomingService) {
    if (!window.confirm(`Delete "${service.name}"?`)) return;
    await remove(service.id);
    show("Service deleted.");
  }

  async function applyBulkPrice() {
    const ids = services
      .filter((service) =>
        bulkCategory === "All" ? true : service.category === bulkCategory,
      )
      .map((service) => service.id);

    if (ids.length === 0 || bulkValue === 0) return;

    await raisePrices(ids, bulkMode, bulkValue);
    setBulkOpen(false);
    show("Prices updated.");
  }

  return (
    <div className="grooming-services-page">
      <section className="page-toolbar grooming-services-toolbar">
        <div className="page-head">
          <span className="eyebrow">Master service catalog</span>
          <h1>Grooming Services</h1>
          <p>
            Manage service prices and appointment durations from one place.
          </p>
        </div>

        <div className="grooming-toolbar-actions">
          <AppButton variant="secondary" onClick={() => setBulkOpen(true)}>
            <DollarSign size={17} /> Bulk Price Update
          </AppButton>
          <AppButton
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            <Plus size={18} /> Add service
          </AppButton>
        </div>
      </section>

      {notice && <div className="success-notice">{notice}</div>}

      <AppCard className="grooming-services-directory">
        <div className="grooming-services-search">
          <Search size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by service name, group, species, or description..."
          />
          <button type="button" className="link-button" onClick={() => void refresh()}>
            Refresh
          </button>
        </div>

        {loading && (
          <div className="module-state">
            <div className="paw-loader">🐾</div>
            <p>Loading services...</p>
          </div>
        )}

        {!loading && error && (
          <div className="module-state error-state"><p>{error}</p></div>
        )}

        {!loading && !error && grouped.length === 0 && (
          <div className="module-state">
            <h2>No services found</h2>
            <p>Add the first grooming service or adjust the search.</p>
          </div>
        )}

        {!loading && !error && grouped.map((group) => {
          const isCollapsed = collapsed.has(group.category);

          return (
            <section className="grooming-service-group" key={group.category}>
              <header className="grooming-service-group-header">
                <button
                  type="button"
                  onClick={() =>
                    setCollapsed((current) => {
                      const next = new Set(current);
                      if (next.has(group.category)) next.delete(group.category);
                      else next.add(group.category);
                      return next;
                    })
                  }
                >
                  {isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                  <strong>{group.category}</strong>
                  <span>{group.items.length}</span>
                </button>
              </header>

              {!isCollapsed && (
                <div className="grooming-service-list">
                  {group.items.map((service) => (
                    <article className="grooming-service-row" key={service.id}>
                      <div className="grooming-service-copy">
                        <div className="grooming-service-title-line">
                          <strong>{service.name}</strong>
                          {!service.isActive && <span className="service-inactive">Inactive</span>}
                        </div>

                        <div className="grooming-service-meta">
                          <span>{service.appointmentType}</span>
                          <span>
                            Book online:{" "}
                            <b className={service.bookOnline ? "is-enabled" : ""}>
                              {service.bookOnline ? "enabled" : "disabled"}
                            </b>
                          </span>
                          <span>Tax: {service.taxable ? "Yes" : "No"}</span>
                          <span>Species: {service.species}</span>
                        </div>

                        {service.description && <p>{service.description}</p>}
                      </div>

                      <div className="grooming-service-price">
                        <strong>
                          {new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: "USD",
                          }).format(service.price)}
                        </strong>
                        <span>
                          {durationLabel(service.durationMinutes)}
                          {service.bufferMinutes
                            ? ` + ${service.bufferMinutes} min buffer`
                            : ""}
                        </span>
                      </div>

                      <div className="grooming-service-actions">
                        <button
                          type="button"
                          className="icon-button"
                          onClick={() => void handleDelete(service)}
                          aria-label={`Delete ${service.name}`}
                        >
                          <Trash2 size={17} />
                        </button>
                        <button
                          type="button"
                          className="icon-button"
                          onClick={async () => {
                            await duplicate(service);
                            show("Service duplicated.");
                          }}
                          aria-label={`Duplicate ${service.name}`}
                        >
                          <Copy size={17} />
                        </button>
                        <button
                          type="button"
                          className="icon-button"
                          onClick={() => {
                            setEditing(service);
                            setModalOpen(true);
                          }}
                          aria-label={`Edit ${service.name}`}
                        >
                          <Pencil size={17} />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </AppCard>

      <GroomingServiceModal
        service={editing}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={async (input, id) => {
          await save(input, id);
          show(id ? "Service updated." : "Service added.");
        }}
      />

      {bulkOpen && (
        <div className="modal-layer">
          <button
            type="button"
            className="modal-backdrop"
            onClick={() => setBulkOpen(false)}
          />
          <section className="modal-card bulk-price-modal">
            <div className="modal-header">
              <div>
                <span className="eyebrow">Pricing tools</span>
                <h2>Bulk Price Update</h2>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setBulkOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="bulk-price-content">
              <label className="field">
                <span>Service group</span>
                <select
                  value={bulkCategory}
                  onChange={(event) =>
                    setBulkCategory(
                      event.target.value as GroomingServiceCategory | "All",
                    )
                  }
                >
                  <option>All</option>
                  {categories.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>

              <label className="field">
                <span>Adjustment type</span>
                <select
                  value={bulkMode}
                  onChange={(event) =>
                    setBulkMode(event.target.value as "percent" | "amount")
                  }
                >
                  <option value="percent">Increase by percentage</option>
                  <option value="amount">Increase by dollar amount</option>
                </select>
              </label>

              <label className="field">
                <span>{bulkMode === "percent" ? "Percentage" : "Amount"}</span>
                <input
                  type="number"
                  step={bulkMode === "percent" ? "0.1" : "0.01"}
                  value={bulkValue}
                  onChange={(event) => setBulkValue(Number(event.target.value))}
                />
              </label>
            </div>

            <div className="modal-actions">
              <AppButton variant="secondary" onClick={() => setBulkOpen(false)}>
                Cancel
              </AppButton>
              <AppButton onClick={() => void applyBulkPrice()}>
                Apply update
              </AppButton>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
