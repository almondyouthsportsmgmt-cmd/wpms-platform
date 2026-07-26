import { X } from "lucide-react";
import type { CalendarViewSettings } from "../calendarViewSettings";

type Props = {
  open: boolean;
  value: CalendarViewSettings;
  onChange: (value: CalendarViewSettings) => void;
  onClose: () => void;
  onSave: () => void;
};

function hourLabel(hour: number) {
  return new Date(2000, 0, 1, hour).toLocaleTimeString([], {
    hour: "numeric",
  });
}

export default function CalendarHoursModal({
  open,
  value,
  onChange,
  onClose,
  onSave,
}: Props) {
  if (!open) return null;

  return (
    <div className="modal-layer">
      <button
        type="button"
        className="modal-backdrop"
        onClick={onClose}
      />

      <section className="modal-card calendar-hours-modal">
        <div className="modal-header">
          <div>
            <span className="eyebrow">Calendar display</span>
            <h2>Business hours</h2>
          </div>

          <button
            type="button"
            className="icon-button"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <div className="calendar-hours-content">
          <label className="field">
            <span>Opening time</span>
            <select
              value={value.openingHour}
              disabled={value.showClosedHours}
              onChange={(event) =>
                onChange({
                  ...value,
                  openingHour: Number(event.target.value),
                })
              }
            >
              {Array.from({ length: 24 }, (_, hour) => (
                <option key={hour} value={hour}>
                  {hourLabel(hour)}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Closing time</span>
            <select
              value={value.closingHour}
              disabled={value.showClosedHours}
              onChange={(event) =>
                onChange({
                  ...value,
                  closingHour: Number(event.target.value),
                })
              }
            >
              {Array.from({ length: 24 }, (_, index) => index + 1).map(
                (hour) => (
                  <option key={hour} value={hour}>
                    {hour === 24 ? "12 AM" : hourLabel(hour)}
                  </option>
                ),
              )}
            </select>
          </label>

          <label className="field">
            <span>Time interval</span>
            <select
              value={value.slotMinutes}
              onChange={(event) =>
                onChange({
                  ...value,
                  slotMinutes: Number(event.target.value) as
                    | 15
                    | 30
                    | 60,
                })
              }
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>60 minutes</option>
            </select>
          </label>

          <label className="checkbox-field calendar-hours-checkbox">
            <input
              type="checkbox"
              checked={value.showClosedHours}
              onChange={(event) =>
                onChange({
                  ...value,
                  showClosedHours: event.target.checked,
                })
              }
            />
            <span>
              Show the full 24-hour day
            </span>
          </label>
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            type="button"
            className="primary-button"
            onClick={onSave}
          >
            Save display
          </button>
        </div>
      </section>
    </div>
  );
}
