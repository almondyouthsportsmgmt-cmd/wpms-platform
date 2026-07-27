import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, RefreshCw, Save } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { AppButton } from "../../components/common/AppButton";
import { AppCard } from "../../components/common/AppCard";
import { useAppointments } from "../appointments/useAppointments";
import { useBoarding } from "../boarding/useBoarding";
import { useCustomers } from "../customers/useCustomers";
import { usePets } from "../pets/usePets";

import CheckoutLineItems from "./components/CheckoutLineItems";
import CheckoutPaymentPanel from "./components/CheckoutPaymentPanel";
import CheckoutRefreshPanel from "./components/CheckoutRefreshPanel";
import CheckoutTotalsPanel from "./components/CheckoutTotalsPanel";
import FrontDeskCustomerPanel from "./components/FrontDeskCustomerPanel";
import PosReceiptActions from "./components/PosReceiptActions";
import { useCheckout } from "./hooks/useCheckout";
import { useCheckoutRefresh } from "./hooks/useCheckoutRefresh";

import "./checkout.css";
import "./checkoutRefresh.css";
import "./frontDeskPos.css";

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export default function CheckoutSessionPage() {
  const navigate = useNavigate();
  const { sessionId = "" } = useParams();
  const { customers } = useCustomers();
  const { pets } = usePets();
  const { appointments, refresh: refreshAppointments } = useAppointments();
  const { stays, refresh: refreshBoarding } = useBoarding();
  const {
    activeSession,
    activeTotals,
    working,
    error,
    refresh,
    setActiveSessionId,
    clearError,
    update,
    addLine,
    updateLine,
    removeLine,
    addPayment,
    markReady,
  } = useCheckout();

  const [notice, setNotice] = useState("");
  const [confirmRefreshOpen, setConfirmRefreshOpen] = useState(false);

  useEffect(() => {
    setActiveSessionId(sessionId);
  }, [sessionId, setActiveSessionId]);

  const checkoutRefresh = useCheckoutRefresh(
    activeSession,
    appointments,
    stays,
    () => {
      refresh();
      flash("Invoice refreshed from the latest appointment and boarding records.");
    },
  );

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  }

  if (!activeSession || !activeTotals) {
    return (
      <div className="checkout-page">
        <AppCard className="checkout-empty-session">
          <h2>Checkout session not found</h2>
          <AppButton onClick={() => navigate("/checkout")}>Return to Checkout Center</AppButton>
        </AppCard>
      </div>
    );
  }

  const session = activeSession;
  const totals = activeTotals;
  const customer = customers.find((item) => item.id === session.customerId) ?? null;
  const customerPets = pets.filter((pet) => pet.customerId === session.customerId && pet.isActive);
  const includedPetIds = Array.from(
    new Set(session.lineItems.map((line) => line.petId).filter((id): id is string => Boolean(id))),
  );

  const groupedCounts = session.lineItems.reduce(
    (result, line) => {
      if (line.sourceType === "Grooming") result.grooming += 1;
      if (line.sourceType === "Boarding") result.boarding += 1;
      if (line.sourceType === "Retail") result.retail += 1;
      return result;
    },
    { grooming: 0, boarding: 0, retail: 0 },
  );

  async function refreshSourceData() {
    await Promise.all([refreshAppointments(), refreshBoarding()]);
    refresh();
    flash("Source records checked.");
  }

  async function refreshAllLines() {
    if (session.payments.length > 0) {
      setConfirmRefreshOpen(true);
      return;
    }
    await checkoutRefresh.refreshAll();
  }

  return (
    <div className="front-desk-pos">
      <section className="page-toolbar pos-toolbar">
        <div className="page-head">
          <span className="eyebrow">Front Desk POS</span>
          <h1>{customer ? `${customer.firstName} ${customer.lastName}` : "Customer Checkout"}</h1>
          <p>Session {session.id.slice(0, 8)} · {session.status} · {session.paymentStatus}</p>
        </div>

        <div className="quick">
          <AppButton variant="secondary" onClick={() => navigate("/checkout")}>
            <ArrowLeft size={17} /> Checkout Center
          </AppButton>
          <AppButton variant="secondary" disabled={working || checkoutRefresh.working} onClick={() => void refreshSourceData()}>
            <RefreshCw size={17} className={checkoutRefresh.working ? "checkout-spin" : ""} /> Refresh Invoice
          </AppButton>
          <AppButton variant="secondary" disabled={working} onClick={() => void update(session.id, { status: "Open" }).then(() => flash("Checkout saved for later."))}>
            <Save size={17} /> Save for later
          </AppButton>
          <AppButton disabled={working || session.lineItems.length === 0} onClick={() => void markReady(session.id).then(() => flash("Checkout marked ready for payment."))}>
            <CheckCircle2 size={17} /> Ready for payment
          </AppButton>
        </div>
      </section>

      {notice && <div className="success-notice">{notice}</div>}
      {(error || checkoutRefresh.error) && (
        <div className="form-error checkout-error">
          <span>{error || checkoutRefresh.error}</span>
          <button type="button" onClick={() => { clearError(); checkoutRefresh.clearError(); }}>×</button>
        </div>
      )}

      <section className="pos-kpi-row">
        <AppCard><span>Grooming</span><strong>{groupedCounts.grooming}</strong></AppCard>
        <AppCard><span>Boarding</span><strong>{groupedCounts.boarding}</strong></AppCard>
        <AppCard><span>Retail</span><strong>{groupedCounts.retail}</strong></AppCard>
        <AppCard><span>Total</span><strong>{money.format(totals.total)}</strong></AppCard>
        <AppCard className="pos-balance-card"><span>Balance Due</span><strong>{money.format(totals.balance)}</strong></AppCard>
      </section>

      <CheckoutRefreshPanel
        items={checkoutRefresh.items}
        working={checkoutRefresh.working}
        onRefreshOne={async (item) => {
          if (session.payments.length > 0) {
            setConfirmRefreshOpen(true);
            return;
          }
          await checkoutRefresh.refreshOne(item);
        }}
        onRefreshAll={() => refreshAllLines()}
      />

      <section className="pos-workspace">
        <AppCard className="pos-customer-card">
          <FrontDeskCustomerPanel customer={customer} pets={customerPets} includedPetIds={includedPetIds} />
        </AppCard>

        <AppCard className="pos-invoice-card">
          <CheckoutLineItems
            items={session.lineItems}
            customerId={session.customerId}
            working={working}
            onAdd={(item) => addLine(session.id, item)}
            onUpdate={(lineItemId, lineUpdate) => updateLine(session.id, lineItemId, lineUpdate)}
            onRemove={(lineItemId) => removeLine(session.id, lineItemId)}
          />
        </AppCard>

        <div className="pos-payment-column">
          <AppCard>
            <CheckoutTotalsPanel
              session={session}
              totals={totals}
              working={working}
              onUpdate={(sessionUpdate) => update(session.id, sessionUpdate)}
            />
          </AppCard>

          <AppCard>
            <CheckoutPaymentPanel
              balance={totals.balance}
              working={working}
              onPay={async (payment) => {
                await addPayment(session.id, payment);
                flash(`${payment.method} payment recorded.`);
              }}
            />
          </AppCard>

          <AppCard>
            <PosReceiptActions customer={customer} paid={totals.balance <= 0} onNotice={flash} />
          </AppCard>
        </div>
      </section>

      {confirmRefreshOpen && (
        <div className="modal-layer">
          <button type="button" className="modal-backdrop" onClick={() => setConfirmRefreshOpen(false)} />
          <section className="modal-card checkout-refresh-confirm">
            <div className="modal-header"><div><span className="eyebrow">Payment warning</span><h2>Refresh paid invoice?</h2></div></div>
            <div className="checkout-refresh-confirm-content">
              <p>This checkout already has payments. Refreshing source values may change the balance due.</p>
              <div><strong>Current balance</strong><span>{money.format(totals.balance)}</span></div>
            </div>
            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={() => setConfirmRefreshOpen(false)}>Keep current invoice</button>
              <button type="button" className="primary-button" onClick={async () => { setConfirmRefreshOpen(false); await checkoutRefresh.refreshAll(); }}>Refresh invoice</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
