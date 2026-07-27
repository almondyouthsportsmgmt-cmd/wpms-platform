import {
  CheckCircle2,
  ExternalLink,
  X,
} from "lucide-react";

import type {
  CheckoutCandidate,
} from "../services/checkoutDetection";

type Props = {
  open: boolean;
  primary: CheckoutCandidate | null;
  related: CheckoutCandidate[];
  selectedIds: string[];
  working: boolean;
  onToggle: (candidateId: string) => void;
  onContinue: () => void;
  onPrimaryOnly: () => void;
  onOpenExisting: (sessionId: string) => void;
  onClose: () => void;
};

const money = new Intl.NumberFormat(
  "en-US",
  {
    style: "currency",
    currency: "USD",
  },
);

function formatRange(
  start: string,
  end: string,
) {
  const startDate = new Date(start);
  const endDate = new Date(end);

  return `${startDate.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })} – ${endDate.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

export default function RelatedCheckoutModal({
  open,
  primary,
  related,
  selectedIds,
  working,
  onToggle,
  onContinue,
  onPrimaryOnly,
  onOpenExisting,
  onClose,
}: Props) {
  if (!open || !primary) {
    return null;
  }

  if (
    primary.status ===
      "Already Added" &&
    primary.existingSessionId
  ) {
    return (
      <div className="modal-layer">
        <button
          type="button"
          className="modal-backdrop"
          onClick={onClose}
        />

        <section className="modal-card checkout-related-modal">
          <div className="modal-header">
            <div>
              <span className="eyebrow">
                Existing checkout
              </span>
              <h2>
                Service already added
              </h2>
            </div>

            <button
              type="button"
              className="icon-button"
              onClick={onClose}
            >
              <X size={18} />
            </button>
          </div>

          <div className="checkout-related-content">
            <p>
              This {primary.sourceType.toLowerCase()} record
              is already attached to an open checkout session.
            </p>

            <div className="checkout-related-primary">
              <strong>{primary.description}</strong>
              <span>{money.format(primary.total)}</span>
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
            >
              Close
            </button>

            <button
              type="button"
              className="primary-button"
              onClick={() =>
                onOpenExisting(
                  primary.existingSessionId!,
                )
              }
            >
              <ExternalLink size={16} />
              Open checkout
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="modal-layer">
      <button
        type="button"
        className="modal-backdrop"
        onClick={onClose}
      />

      <section className="modal-card checkout-related-modal">
        <div className="modal-header">
          <div>
            <span className="eyebrow">
              Unified checkout
            </span>
            <h2>
              Include related services?
            </h2>
          </div>

          <button
            type="button"
            className="icon-button"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <div className="checkout-related-content">
          <p>
            The selected service will be added to checkout.
            Choose any overlapping completed services to include
            on the same invoice.
          </p>

          <div className="checkout-related-primary">
            <div>
              <span className="checkout-related-type">
                {primary.sourceType}
              </span>
              <strong>{primary.description}</strong>
              <small>
                {formatRange(
                  primary.start,
                  primary.end,
                )}
              </small>
            </div>

            <span>
              {money.format(primary.total)}
            </span>
          </div>

          {related.length > 0 ? (
            <div className="checkout-related-list">
              {related.map((candidate) => {
                const alreadyAdded =
                  candidate.status ===
                  "Already Added";

                return (
                  <label
                    key={candidate.id}
                    className={`checkout-related-item ${
                      alreadyAdded
                        ? "is-existing"
                        : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={
                        alreadyAdded ||
                        selectedIds.includes(
                          candidate.id,
                        )
                      }
                      disabled={
                        working ||
                        alreadyAdded
                      }
                      onChange={() =>
                        onToggle(
                          candidate.id,
                        )
                      }
                    />

                    <div>
                      <span className="checkout-related-type">
                        {
                          candidate.sourceType
                        }
                      </span>
                      <strong>
                        {
                          candidate.description
                        }
                      </strong>
                      <small>
                        {formatRange(
                          candidate.start,
                          candidate.end,
                        )}
                      </small>

                      {candidate.notes && (
                        <small>
                          {candidate.notes}
                        </small>
                      )}
                    </div>

                    <div className="checkout-related-price">
                      <span>
                        {money.format(
                          candidate.total,
                        )}
                      </span>

                      {alreadyAdded && (
                        <button
                          type="button"
                          className="checkout-existing-link"
                          onClick={(event) => {
                            event.preventDefault();

                            if (
                              candidate.existingSessionId
                            ) {
                              onOpenExisting(
                                candidate.existingSessionId,
                              );
                            }
                          }}
                        >
                          Open existing
                        </button>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          ) : (
            <div className="checkout-related-empty">
              <CheckCircle2 size={24} />
              No other overlapping completed services were found.
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="secondary-button"
            disabled={working}
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            type="button"
            className="secondary-button"
            disabled={working}
            onClick={onPrimaryOnly}
          >
            Checkout this record only
          </button>

          <button
            type="button"
            className="primary-button"
            disabled={working}
            onClick={onContinue}
          >
            {working
              ? "Opening checkout..."
              : "Continue with selected"}
          </button>
        </div>
      </section>
    </div>
  );
}
