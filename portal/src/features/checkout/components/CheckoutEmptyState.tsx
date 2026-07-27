import {
  ReceiptText,
} from "lucide-react";

type Props = {
  title?: string;
  description?: string;
};

export default function CheckoutEmptyState({
  title = "No checkout sessions",
  description =
    "Start a checkout when a customer is ready to pay.",
}: Props) {
  return (
    <div className="checkout-empty-state">
      <div>
        <ReceiptText size={34} />
      </div>

      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
