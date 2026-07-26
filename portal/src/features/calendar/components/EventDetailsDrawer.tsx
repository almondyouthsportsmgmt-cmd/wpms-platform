import { X, Calendar, Clock, User, PawPrint, ClipboardList, AlertTriangle, Home, DollarSign, Edit3, CheckCircle2 } from "lucide-react";

import type {
  ScheduleEvent,
} from "../../scheduling/schedulingTypes";

import "../calendar.css";

interface EventDetailsDrawerProps {
  open: boolean;

  event: ScheduleEvent | null;

  customerName?: string;

  petNames?: string[];

  groomerName?: string;

  kennelName?: string;

  vaccinationStatus?: string;

  medicalAlerts?: string[];

  invoiceStatus?: string;

  onClose: () => void;

  onEdit?: (event: ScheduleEvent) => void;

  onCheckIn?: (event: ScheduleEvent) => void;

  onCheckOut?: (event: ScheduleEvent) => void;

  onComplete?: (event: ScheduleEvent) => void;

  onFutureAppointment?: (
    event: ScheduleEvent,
  ) => void;
}

export default function EventDetailsDrawer({
  open,

  event,

  customerName,

  petNames = [],

  groomerName,

  kennelName,

  vaccinationStatus = "Current",

  medicalAlerts = [],

  invoiceStatus = "Pending",

  onClose,

  onEdit,

  onCheckIn,

  onCheckOut,

  onComplete,

  onFutureAppointment,
}: EventDetailsDrawerProps) {
  if (!open || !event) {
    return null;
  }

  return (
    <aside className="calendar-event-drawer">

      <div className="drawer-header">

        <div>

          <span className="eyebrow">
            Schedule Event
          </span>

          <h2>{event.title}</h2>

        </div>

        <button
          className="icon-button"
          type="button"
          onClick={onClose}
        >
          <X size={18} />
        </button>

      </div>

      <div className="drawer-body">

        <section className="drawer-section">

          <h3>
            Appointment
          </h3>

          <div className="drawer-row">

            <Calendar size={16} />

            <span>
              {new Date(
                event.start,
              ).toLocaleDateString()}
            </span>

          </div>

          <div className="drawer-row">

            <Clock size={16} />

            <span>

              {new Date(
                event.start,
              ).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}

              {" - "}

              {new Date(
                event.end,
              ).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}

            </span>

          </div>

        </section>

        <section className="drawer-section">

          <h3>
            Customer
          </h3>

          <div className="drawer-row">

            <User size={16} />

            <span>
              {customerName ??
                "Unknown"}
            </span>

          </div>

        </section>

        <section className="drawer-section">

          <h3>
            Pet
          </h3>

          {petNames.map((pet) => (
            <div
              key={pet}
              className="drawer-row"
            >
              <PawPrint size={16} />

              <span>{pet}</span>

            </div>
          ))}

        </section>

        <section className="drawer-section">

          <h3>
            Staff
          </h3>

          <div className="drawer-row">

            <ClipboardList
              size={16}
            />

            <span>
              {groomerName ??
                "Unassigned"}
            </span>

          </div>

        </section>

        {kennelName && (
          <section className="drawer-section">

            <h3>
              Boarding
            </h3>

            <div className="drawer-row">

              <Home size={16} />

              <span>
                {kennelName}
              </span>

            </div>

          </section>
        )}

        <section className="drawer-section">

          <h3>
            Medical
          </h3>

          <div className="drawer-row">

            <CheckCircle2
              size={16}
            />

            <span>

              Vaccinations:

              {" "}

              {vaccinationStatus}

            </span>

          </div>

          {medicalAlerts.length >
            0 && (
            <div className="drawer-alerts">

              {medicalAlerts.map(
                (alert) => (
                  <div
                    key={alert}
                    className="drawer-alert"
                  >
                    <AlertTriangle
                      size={15}
                    />

                    {alert}

                  </div>
                ),
              )}

            </div>
          )}

        </section>

        <section className="drawer-section">

          <h3>
            Invoice
          </h3>

          <div className="drawer-row">

            <DollarSign
              size={16}
            />

            <span>
              {invoiceStatus}
            </span>

          </div>

        </section>

      </div>

      <div className="drawer-footer">

        <button
          type="button"
          onClick={() =>
            onEdit?.(event)
          }
        >
          <Edit3 size={16} />

          Edit

        </button>

        <button
          type="button"
          onClick={() =>
            onCheckIn?.(
              event,
            )
          }
        >
          Check In
        </button>

        <button
          type="button"
          onClick={() =>
            onCheckOut?.(
              event,
            )
          }
        >
          Check Out
        </button>

        <button
          type="button"
          onClick={() =>
            onComplete?.(
              event,
            )
          }
        >
          Complete
        </button>

        <button
          type="button"
          onClick={() =>
            onFutureAppointment?.(
              event,
            )
          }
        >
          Book Future
        </button>

      </div>

    </aside>
  );
}