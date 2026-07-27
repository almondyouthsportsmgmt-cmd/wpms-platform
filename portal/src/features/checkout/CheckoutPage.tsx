import {
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  CircleDollarSign,
  Plus,
  RefreshCw,
  Search,
  WalletCards,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import { AppButton } from "../../components/common/AppButton";
import { AppCard } from "../../components/common/AppCard";
import { useCustomers } from "../customers/useCustomers";

import CheckoutEmptyState from "./components/CheckoutEmptyState";
import CheckoutSessionCard from "./components/CheckoutSessionCard";
import {
  checkoutTotals,
} from "./services/checkoutCalculations";
import { useCheckout } from "./hooks/useCheckout";

import "./checkout.css";

const money = new Intl.NumberFormat(
  "en-US",
  {
    style: "currency",
    currency: "USD",
  },
);

export default function CheckoutPage() {
  const navigate = useNavigate();

  const {
    customers,
    loading: customersLoading,
  } = useCustomers();

  const {
    sessions,
    loading,
    working,
    error,
    refresh,
    create,
    cancel,
    deleteOne,
    clearError,
  } = useCheckout();

  const [customerId, setCustomerId] =
    useState("");

  const [taxRate, setTaxRate] =
    useState(7);

  const [query, setQuery] =
    useState("");

  const [notice, setNotice] =
    useState("");

  const customerMap = useMemo(
    () =>
      new Map(
        customers.map((customer) => [
          customer.id,
          customer,
        ]),
      ),
    [customers],
  );

  const visibleSessions = useMemo(() => {
    const needle =
      query.trim().toLowerCase();

    return sessions.filter(
      (session) => {
        const customer =
          customerMap.get(
            session.customerId,
          );

        return [
          customer?.firstName,
          customer?.lastName,
          session.status,
          session.id,
        ]
          .join(" ")
          .toLowerCase()
          .includes(needle);
      },
    );
  }, [
    customerMap,
    query,
    sessions,
  ]);

  const openSessions =
    sessions.filter(
      (session) =>
        session.status === "Open" ||
        session.status === "Ready",
    );

  const totals = useMemo(
    () =>
      openSessions.reduce(
        (summary, session) => {
          const current =
            checkoutTotals(session);

          summary.total +=
            current.total;

          summary.balance +=
            current.balance;

          return summary;
        },
        {
          total: 0,
          balance: 0,
        },
      ),
    [openSessions],
  );

  function flash(message: string) {
    setNotice(message);

    window.setTimeout(
      () => setNotice(""),
      2200,
    );
  }

  async function handleCreate(
    event: FormEvent,
  ) {
    event.preventDefault();

    if (!customerId) {
      flash("Select a customer.");
      return;
    }

    const session = await create({
      customerId,
      taxRate,
    });

    setCustomerId("");

    navigate(
      `/checkout/${session.id}`,
    );
  }

  async function handleCancel(
    sessionId: string,
  ) {
    await cancel(sessionId);
    flash("Checkout session cancelled.");
  }

  async function handleDelete(
    sessionId: string,
  ) {
    await deleteOne(sessionId);
    flash("Checkout session removed.");
  }

  const busy =
    loading || customersLoading;

  return (
    <div className="checkout-page">
      <section className="page-toolbar checkout-toolbar">
        <div className="page-head">
          <span className="eyebrow">
            Checkout & POS
          </span>

          <h1>Checkout Center</h1>

          <p>
            Start, resume, and manage
            customer checkout sessions.
          </p>
        </div>

        <AppButton
          variant="secondary"
          disabled={working}
          onClick={refresh}
        >
          <RefreshCw
            size={17}
            className={
              working
                ? "checkout-spin"
                : ""
            }
          />
          Refresh
        </AppButton>
      </section>

      {notice && (
        <div className="success-notice">
          {notice}
        </div>
      )}

      {error && (
        <div className="form-error checkout-error">
          <span>{error}</span>

          <button
            type="button"
            onClick={clearError}
          >
            ×
          </button>
        </div>
      )}

      <section className="checkout-summary-grid">
        <AppCard className="summary-card">
          <WalletCards size={22} />

          <div>
            <span>Open sessions</span>
            <strong>
              {openSessions.length}
            </strong>
          </div>
        </AppCard>

        <AppCard className="summary-card">
          <CircleDollarSign size={22} />

          <div>
            <span>
              Open checkout total
            </span>
            <strong>
              {money.format(
                totals.total,
              )}
            </strong>
          </div>
        </AppCard>

        <AppCard className="summary-card">
          <CircleDollarSign size={22} />

          <div>
            <span>
              Outstanding balance
            </span>
            <strong>
              {money.format(
                totals.balance,
              )}
            </strong>
          </div>
        </AppCard>
      </section>

      <section className="checkout-layout">
        <AppCard className="checkout-new-card">
          <div className="card-heading">
            <div>
              <span className="eyebrow">
                New checkout
              </span>

              <h2>
                Start checkout session
              </h2>
            </div>
          </div>

          <form
            className="form-grid"
            onSubmit={handleCreate}
          >
            <label className="field">
              <span>Customer</span>

              <select
                value={customerId}
                onChange={(event) =>
                  setCustomerId(
                    event.target.value,
                  )
                }
              >
                <option value="">
                  Select customer
                </option>

                {customers
                  .filter(
                    (customer) =>
                      customer.isActive,
                  )
                  .map(
                    (customer) => (
                      <option
                        key={
                          customer.id
                        }
                        value={
                          customer.id
                        }
                      >
                        {
                          customer.firstName
                        }{" "}
                        {
                          customer.lastName
                        }
                      </option>
                    ),
                  )}
              </select>
            </label>

            <label className="field">
              <span>
                Default tax rate %
              </span>

              <input
                type="number"
                min="0"
                step="0.01"
                value={taxRate}
                onChange={(event) =>
                  setTaxRate(
                    Number(
                      event.target
                        .value,
                    ),
                  )
                }
              />
            </label>

            <AppButton
              disabled={
                working ||
                !customerId
              }
            >
              <Plus size={17} />
              Start checkout
            </AppButton>
          </form>
        </AppCard>

        <AppCard className="checkout-sessions-card">
          <div className="card-heading checkout-list-heading">
            <div>
              <span className="eyebrow">
                Sessions
              </span>

              <h2>
                Checkout sessions
              </h2>
            </div>

            <div className="module-search checkout-search">
              <Search size={17} />

              <input
                placeholder="Search customer, status, or ID..."
                value={query}
                onChange={(event) =>
                  setQuery(
                    event.target.value,
                  )
                }
              />
            </div>
          </div>

          {busy ? (
            <div className="module-state">
              <div className="paw-loader">
                🐾
              </div>

              <p>
                Loading checkout...
              </p>
            </div>
          ) : visibleSessions.length ===
            0 ? (
            <CheckoutEmptyState
              title={
                query
                  ? "No matching sessions"
                  : "No checkout sessions"
              }
            />
          ) : (
            <div className="checkout-session-list">
              {visibleSessions.map(
                (session) => {
                  const customer =
                    customerMap.get(
                      session.customerId,
                    );

                  const totals =
                    checkoutTotals(
                      session,
                    );

                  return (
                    <CheckoutSessionCard
                      key={session.id}
                      session={session}
                      customerName={
                        customer
                          ? `${customer.firstName} ${customer.lastName}`
                          : "Customer unavailable"
                      }
                      total={
                        totals.total
                      }
                      balance={
                        totals.balance
                      }
                      working={
                        working
                      }
                      onOpen={() =>
                        navigate(
                          `/checkout/${session.id}`,
                        )
                      }
                      onCancel={() =>
                        void handleCancel(
                          session.id,
                        )
                      }
                      onDelete={() =>
                        void handleDelete(
                          session.id,
                        )
                      }
                    />
                  );
                },
              )}
            </div>
          )}
        </AppCard>
      </section>
    </div>
  );
}
