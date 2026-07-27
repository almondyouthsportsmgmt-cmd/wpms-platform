import { CircleDollarSign, ReceiptText } from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  RelatedCheckoutModal,
  useSmartCheckout,
} from "../../checkout";

import type {
  AppointmentCheckoutRecord,
  BoardingCheckoutRecord,
} from "../../checkout";

type BillingState = "Ready" | "In Checkout" | "Paid";

type Props = {
  appointment: AppointmentCheckoutRecord;
  appointments: AppointmentCheckoutRecord[];
  boardingStays: BoardingCheckoutRecord[];
  billingState?: BillingState;
  existingSessionId?: string;
  createdBy?: string;
  taxRate?: number;
  disabled?: boolean;
  className?: string;
};

export default function GroomingCheckoutButton({
  appointment,
  appointments,
  boardingStays,
  billingState = "Ready",
  existingSessionId,
  createdBy,
  taxRate = 7,
  disabled = false,
  className = "",
}: Props) {
  const navigate = useNavigate();
  const checkout = useSmartCheckout();

  const eligible =
    appointment.status === "Completed" ||
    appointment.status === "Ready for Pickup";

  const label =
    billingState === "Paid"
      ? "View Checkout"
      : billingState === "In Checkout"
        ? "Resume Checkout"
        : "Checkout";

  function beginCheckout() {
    if (existingSessionId) {
      navigate(`/checkout/${existingSessionId}`);
      return;
    }

    checkout.start({
      source: appointment,
      appointments,
      boardingStays,
      createdBy,
      taxRate,
    });
  }

  return (
    <>
      <button
        type="button"
        className={[
          "primary-button",
          "record-checkout-button",
          `record-checkout-${billingState.toLowerCase().replaceAll(" ", "-")}`,
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        disabled={
          disabled ||
          (!eligible && !existingSessionId) ||
          checkout.working
        }
        onClick={beginCheckout}
      >
        {billingState === "Paid" ? (
          <ReceiptText size={16} />
        ) : (
          <CircleDollarSign size={16} />
        )}
        {label}
      </button>

      <RelatedCheckoutModal
        open={checkout.open}
        primary={checkout.primary}
        related={checkout.related}
        selectedIds={checkout.selectedIds}
        working={checkout.working}
        onToggle={checkout.toggle}
        onContinue={() => void checkout.continueSelected()}
        onPrimaryOnly={() => void checkout.checkoutPrimaryOnly()}
        onOpenExisting={checkout.openExisting}
        onClose={checkout.close}
      />

      {checkout.error && (
        <div className="form-error record-checkout-error">
          {checkout.error}
        </div>
      )}
    </>
  );
}
