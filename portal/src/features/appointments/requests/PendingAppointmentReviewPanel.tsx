import {
  CalendarCheck,
  Check,
  Clock3,
  Globe2,
  Mail,
  Phone,
  CalendarClock,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { AppCard } from "../../../components/common/AppCard";
import { useCustomers } from "../../customers/useCustomers";
import { usePets } from "../../pets/usePets";
import { useAppointmentRequests } from "./useAppointmentRequests";
import { proposeNewAppointmentTime } from "./appointmentRequestService";
import "./appointmentRequests.css";



type Props = {
  onApproved?: () => void;
};

export default function PendingAppointmentReviewPanel({
  onApproved,
}: Props) {
  const {
    pending,
    loading,
    workingId,
    error,
    approve,
    decline,
    refresh,
  } = useAppointmentRequests();

  const { customers } = useCustomers();
  const { pets } = usePets();

  const customerMap = new Map(customers.map((c) => [c.id, c]));
  const petMap = new Map(pets.map((p) => [p.id, p]));

  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState("");
const [newStart, setNewStart] = useState("");
const [newEnd, setNewEnd] = useState("");
const [savingProposal, setSavingProposal] = useState(false);

  return (
    <AppCard className="appointment-review-panel">
      <div className="appointment-review-head">
        <div>
          <span className="eyebrow">Online Booking Requests</span>

          <h2>Pending Appointment Review</h2>

          <p>
            Website and Client Portal appointments require staff approval before
            becoming confirmed appointments.
          </p>
        </div>

        <div className="appointment-review-count">
          {pending.length}
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}

      {loading ? (
        <div className="module-state compact">
          <div className="paw-loader">🐾</div>
        </div>
      ) : pending.length === 0 ? (
        <div className="appointment-review-empty">
          <CalendarCheck size={30} />
          <strong>No Pending Requests</strong>
          <span>
            New appointment requests will appear here automatically.
          </span>
        </div>
      ) : (
        <div className="appointment-review-list">
          {pending.map((request) => {
            const customer = customerMap.get(request.customerId);
            const pet = petMap.get(request.petId);

            const busy = workingId === request.id;

            return (
              <article
                key={request.id}
                className="appointment-review-card"
              >
                <div className="appointment-review-source">
                  {request.source === "Website" ? (
                    <Globe2 size={18} />
                  ) : (
                    <CalendarCheck size={18} />
                  )}

                  <span>{request.source}</span>
                </div>

                <div className="appointment-review-main">
                  <strong>
                    {pet?.name ??
                      request.requesterName ??
                      "Appointment Request"}
                  </strong>

                  <span>
                    {request.serviceName} • {request.appointmentType}
                  </span>

                  <div className="appointment-review-time">
                    <Clock3 size={15} />

                    <span>
                      {request.requestedDate} &nbsp;
                      {request.requestedStartTime} -{" "}
                      {request.requestedEndTime}
                    </span>
                  </div>

                  <small>
                    {customer
                      ? `${customer.firstName} ${customer.lastName}`
                      : request.requesterName}
                  </small>

                  {request.notes && <p>{request.notes}</p>}

                  <div className="appointment-review-contact">
                    {request.requesterPhone && (
                      <span>
                        <Phone size={13} />
                        {request.requesterPhone}
                      </span>
                    )}

                    {request.requesterEmail && (
                      <span>
                        <Mail size={13} />
                        {request.requesterEmail}
                      </span>
                    )}
                  </div>
                </div>

                <div className="appointment-review-actions">

                  <button
                    className="secondary-button"
                    disabled={busy}
                    onClick={() => {
                      setRescheduleId(request.id);

                      setNewDate(request.requestedDate);
                      setNewStart(request.requestedStartTime);
                      setNewEnd(request.requestedEndTime);
                    }}
                  >
                    <CalendarClock size={16} />
                    Propose New Time
                  </button>

                  <button
                    className="secondary-button"
                    disabled={busy}
                    onClick={() =>
                      void decline(request.id)
                    }
                  >
                    <X size={16} />
                    Decline
                  </button>

                  <button
                    className="primary-button"
                    disabled={busy}
                    onClick={async () => {
                      await approve(request.id);
                      onApproved?.();
                    }}
                  >
                    <Check size={16} />

                    {busy ? "Approving..." : "Approve"}
                  </button>
                </div>

                {rescheduleId === request.id && (
                  <div className="appointment-review-reschedule">

                    <strong>
                      Proposed New Time
                    </strong>
                                    <div className="proposal-grid">

                      <label>

                          Date

                          <input
                              type="date"
                              value={newDate}
                              onChange={(e)=>setNewDate(e.target.value)}
                          />

                      </label>

                      <label>

                          Start

                          <input
                              type="time"
                              value={newStart}
                              onChange={(e)=>setNewStart(e.target.value)}
                          />

                      </label>

                      <label>

                          End

                          <input
                              type="time"
                              value={newEnd}
                              onChange={(e)=>setNewEnd(e.target.value)}
                          />

                      </label>

                  </div>

                  <div className="proposal-actions">

                      <button
                          className="secondary-button"
                          onClick={()=>setRescheduleId(null)}
                      >
                          Cancel
                      </button>

                      <button
                          className="primary-button"
                          disabled={savingProposal}
                          onClick={async()=>{

                              setSavingProposal(true);

                              try{

                                  await proposeNewAppointmentTime(
                                      request.id,
                                      newDate,
                                      newStart,
                                      newEnd
                                  );

                                  await refresh();

                                  setRescheduleId(null);

                              }finally{

                                  setSavingProposal(false);

                              }

                          }}
                      >

                          {savingProposal
                              ? "Saving..."
                              : "Send Proposed Time"}

                      </button>

                  </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      <button
        className="link-button appointment-review-refresh"
        onClick={() => void refresh()}
      >
        Refresh Requests
      </button>
    </AppCard>
  );
}