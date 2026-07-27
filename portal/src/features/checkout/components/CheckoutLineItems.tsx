import {
  Plus,
  Trash2,
} from "lucide-react";

import type {
  CheckoutLineItem,
  CheckoutSourceType,
} from "../types/checkoutTypes";

type Props = {
  items: CheckoutLineItem[];
  customerId: string;
  working: boolean;
  onAdd: (
    item: Omit<
      CheckoutLineItem,
      "id"
    >,
  ) => Promise<unknown> | unknown;
  onUpdate: (
    lineItemId: string,
    update: Partial<
      Omit<
        CheckoutLineItem,
        "id" | "customerId"
      >
    >,
  ) => Promise<unknown> | unknown;
  onRemove: (
    lineItemId: string,
  ) => Promise<unknown> | unknown;
};

const sourceTypes: CheckoutSourceType[] = [
  "Grooming",
  "Boarding",
  "Retail",
  "Daycare",
  "Training",
  "Membership",
  "Adjustment",
];

export default function CheckoutLineItems({
  items,
  customerId,
  working,
  onAdd,
  onUpdate,
  onRemove,
}: Props) {
  async function addBlankLine() {
    await onAdd({
      customerId,
      sourceType: "Grooming",
      description: "New service",
      quantity: 1,
      unitPrice: 0,
      taxable: true,
      discountAmount: 0,
    });
  }

  return (
    <section className="checkout-builder-section">
      <div className="checkout-builder-section-head">
        <div>
          <span className="eyebrow">
            Invoice
          </span>
          <h2>Line items</h2>
        </div>

        <button
          type="button"
          className="checkout-add-line"
          disabled={working}
          onClick={() => void addBlankLine()}
        >
          <Plus size={16} />
          Add line
        </button>
      </div>

      {items.length === 0 ? (
        <div className="checkout-builder-empty">
          No services have been added yet.
        </div>
      ) : (
        <div className="checkout-line-list">
          {items.map((item) => (
            <div
              key={item.id}
              className="checkout-line-row"
            >
              <label className="field">
                <span>Type</span>
                <select
                  value={item.sourceType}
                  disabled={working}
                  onChange={(event) =>
                    void onUpdate(
                      item.id,
                      {
                        sourceType:
                          event.target
                            .value as CheckoutSourceType,
                      },
                    )
                  }
                >
                  {sourceTypes.map(
                    (sourceType) => (
                      <option
                        key={sourceType}
                        value={sourceType}
                      >
                        {sourceType}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label className="field checkout-line-description">
                <span>Description</span>
                <input
                  value={item.description}
                  disabled={working}
                  onChange={(event) =>
                    void onUpdate(
                      item.id,
                      {
                        description:
                          event.target.value,
                      },
                    )
                  }
                />
              </label>

              <label className="field">
                <span>Qty</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={item.quantity}
                  disabled={working}
                  onChange={(event) =>
                    void onUpdate(
                      item.id,
                      {
                        quantity: Number(
                          event.target.value,
                        ),
                      },
                    )
                  }
                />
              </label>

              <label className="field">
                <span>Unit price</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unitPrice}
                  disabled={working}
                  onChange={(event) =>
                    void onUpdate(
                      item.id,
                      {
                        unitPrice: Number(
                          event.target.value,
                        ),
                      },
                    )
                  }
                />
              </label>

              <label className="field">
                <span>Discount</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.discountAmount}
                  disabled={working}
                  onChange={(event) =>
                    void onUpdate(
                      item.id,
                      {
                        discountAmount:
                          Number(
                            event.target
                              .value,
                          ),
                      },
                    )
                  }
                />
              </label>

              <label className="checkout-taxable">
                <input
                  type="checkbox"
                  checked={item.taxable}
                  disabled={working}
                  onChange={(event) =>
                    void onUpdate(
                      item.id,
                      {
                        taxable:
                          event.target
                            .checked,
                      },
                    )
                  }
                />
                Taxable
              </label>

              <button
                type="button"
                className="icon-button checkout-remove-line"
                disabled={working}
                onClick={() =>
                  void onRemove(item.id)
                }
                aria-label="Remove line item"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
