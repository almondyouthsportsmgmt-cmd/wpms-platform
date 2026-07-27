import { Mail, MessageSquareText, Printer, ReceiptText } from "lucide-react";
import type { Customer } from "../../customers/customerTypes";

type Props = {
  customer: Customer | null;
  paid: boolean;
  onNotice: (message: string) => void;
};

export default function PosReceiptActions({ customer, paid, onNotice }: Props) {
  function emailReceipt() {
    if (!customer?.email) {
      onNotice("This customer does not have an email address.");
      return;
    }

    window.location.href = `mailto:${customer.email}?subject=${encodeURIComponent("Whimsical Paws receipt")}&body=${encodeURIComponent("Your receipt is available from Whimsical Paws Pet Escape.")}`;
  }

  function textReceipt() {
    if (!customer?.mobilePhone) {
      onNotice("This customer does not have a mobile phone number.");
      return;
    }

    window.location.href = `sms:${customer.mobilePhone}?body=${encodeURIComponent("Your Whimsical Paws Pet Escape receipt is ready. Thank you!")}`;
  }

  return (
    <section className="pos-receipt-actions">
      <div className="pos-section-heading">
        <span className="eyebrow">Receipt</span>
        <h2>Delivery</h2>
      </div>

      <div className="pos-receipt-grid">
        <button type="button" onClick={() => window.print()}>
          <Printer size={18} /> Print
        </button>
        <button type="button" onClick={emailReceipt}>
          <Mail size={18} /> Email
        </button>
        <button type="button" onClick={textReceipt}>
          <MessageSquareText size={18} /> Text
        </button>
        <button type="button" disabled={!paid} onClick={() => onNotice("Receipt saved to the completed checkout history.")}>
          <ReceiptText size={18} /> Save
        </button>
      </div>
    </section>
  );
}
