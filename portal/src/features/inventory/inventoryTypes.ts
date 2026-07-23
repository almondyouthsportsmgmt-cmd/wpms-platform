export type InventoryStatus = "Active" | "Inactive";
export type InventoryCategory = "Shampoo" | "Grooming Supply" | "Retail" | "Food" | "Cleaning" | "Other";
export type InventoryItem = {
  id: string; name: string; sku: string; barcode: string; category: InventoryCategory;
  vendor: string; quantityOnHand: number; reorderLevel: number; unitCost: number;
  retailPrice: number; status: InventoryStatus; notes: string; createdAt: string; updatedAt: string;
};
export type InventoryItemInput = Omit<InventoryItem, "id" | "createdAt" | "updatedAt">;
