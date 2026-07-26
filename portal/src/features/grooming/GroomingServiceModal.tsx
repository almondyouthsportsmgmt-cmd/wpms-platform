import { useEffect, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { AppButton } from "../../components/common/AppButton";
import type {
  GroomingService,
  GroomingServiceCategory,
  GroomingServiceInput,
} from "./groomingServiceTypes";

const categories: GroomingServiceCategory[] = [
  "Full Groom",
  "Bath & Brush",
  "Cat Grooming",
  "Nail Services",
  "Spa Add-Ons",
  "Other",
];

const blank: GroomingServiceInput = {
  name: "",
  category: "Full Groom",
  description: "",
  appointmentType: "Grooming",
  durationMinutes: 90,
  bufferMinutes: 15,
  price: 0,
  taxable: false,
  bookOnline: true,
  species: "Dog",
  minimumWeight: null,
  maximumWeight: null,
  isActive: true,
  displayOrder: 10,
};

export function GroomingServiceModal({
  service,
  open,
  onClose,
  onSave,
}: {
  service: GroomingService | null;
  open: boolean;
  onClose: () => void;
  onSave: (input: GroomingServiceInput, id?: string) => Promise<void>;
}) {
  const [form, setForm] = useState<GroomingServiceInput>(blank);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setForm(service ? {
      name: service.name,
      category: service.category,
      description: service.description,
      appointmentType: service.appointmentType,
      durationMinutes: service.durationMinutes,
      bufferMinutes: service.bufferMinutes,
      price: service.price,
      taxable: service.taxable,
      bookOnline: service.bookOnline,
      species: service.species,
      minimumWeight: service.minimumWeight,
      maximumWeight: service.maximumWeight,
      isActive: service.isActive,
      displayOrder: service.displayOrder,
    } : blank);
    setError("");
  }, [open, service]);

  if (!open) return null;

  function patch<K extends keyof GroomingServiceInput>(
    key: K,
    value: GroomingServiceInput[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();

    if (!form.name.trim()) {
      setError("Service name is required.");
      return;
    }
    if (form.durationMinutes < 5) {
      setError("Service duration must be at least 5 minutes.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await onSave(
        {
          ...form,
          name: form.name.trim(),
          description: form.description.trim(),
        },
        service?.id,
      );
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save service.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-layer">
      <button type="button" className="modal-backdrop" onClick={onClose} />
      <form className="modal-card grooming-service-modal" onSubmit={submit}>
        <div className="modal-header">
          <div>
            <span className="eyebrow">Service catalog</span>
            <h2>{service ? "Edit service" : "Add service"}</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {error && <div className="form-error">{error}</div>}

        <div className="grooming-service-form">
          <div className="form-grid">
            <label className="field field-wide">
              <span>Service name *</span>
              <input
                autoFocus
                value={form.name}
                onChange={(event) => patch("name", event.target.value)}
              />
            </label>

            <label className="field">
              <span>Service group</span>
              <select
                value={form.category}
                onChange={(event) =>
                  patch("category", event.target.value as GroomingServiceCategory)
                }
              >
                {categories.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>

            <label className="field">
              <span>Appointment type</span>
              <select
                value={form.appointmentType}
                onChange={(event) =>
                  patch(
                    "appointmentType",
                    event.target.value as GroomingServiceInput["appointmentType"],
                  )
                }
              >
                <option>Grooming</option>
                <option>Bath</option>
                <option>Nails</option>
                <option>Other</option>
              </select>
            </label>

            <label className="field">
              <span>Price</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(event) => patch("price", Number(event.target.value))}
              />
            </label>

            <label className="field">
              <span>Service time (minutes)</span>
              <input
                type="number"
                min="5"
                step="5"
                value={form.durationMinutes}
                onChange={(event) =>
                  patch("durationMinutes", Number(event.target.value))
                }
              />
            </label>

            <label className="field">
              <span>Cleanup buffer (minutes)</span>
              <input
                type="number"
                min="0"
                step="5"
                value={form.bufferMinutes}
                onChange={(event) =>
                  patch("bufferMinutes", Number(event.target.value))
                }
              />
            </label>

            <label className="field">
              <span>Species</span>
              <select
                value={form.species}
                onChange={(event) =>
                  patch("species", event.target.value as GroomingServiceInput["species"])
                }
              >
                <option>Dog</option>
                <option>Cat</option>
                <option>All</option>
              </select>
            </label>

            <label className="field">
              <span>Minimum weight</span>
              <input
                type="number"
                min="0"
                value={form.minimumWeight ?? ""}
                onChange={(event) =>
                  patch(
                    "minimumWeight",
                    event.target.value === "" ? null : Number(event.target.value),
                  )
                }
              />
            </label>

            <label className="field">
              <span>Maximum weight</span>
              <input
                type="number"
                min="0"
                value={form.maximumWeight ?? ""}
                onChange={(event) =>
                  patch(
                    "maximumWeight",
                    event.target.value === "" ? null : Number(event.target.value),
                  )
                }
              />
            </label>

            <label className="field field-wide">
              <span>Description</span>
              <textarea
                rows={4}
                value={form.description}
                onChange={(event) => patch("description", event.target.value)}
              />
            </label>

            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={form.bookOnline}
                onChange={(event) => patch("bookOnline", event.target.checked)}
              />
              <span>Available for online booking</span>
            </label>

            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={form.taxable}
                onChange={(event) => patch("taxable", event.target.checked)}
              />
              <span>Taxable service</span>
            </label>

            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => patch("isActive", event.target.checked)}
              />
              <span>Active service</span>
            </label>
          </div>
        </div>

        <div className="modal-actions grooming-service-modal-actions">
          <AppButton type="button" variant="secondary" onClick={onClose}>
            Cancel
          </AppButton>
          <AppButton type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save service"}
          </AppButton>
        </div>
      </form>
    </div>
  );
}
