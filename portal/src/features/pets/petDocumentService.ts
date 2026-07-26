import {
  PetDocument,
  PetDocumentUploadInput,
} from "./petDocumentTypes";

import {
  isSupabaseConfigured,
  supabase,
} from "../../lib/supabaseClient";

const STORAGE_BUCKET = "pet-documents";

const DEMO_STORAGE_KEY = "wpms-demo-pet-documents";

function readDemoDocuments(): PetDocument[] {
  const raw = localStorage.getItem(DEMO_STORAGE_KEY);

  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as PetDocument[];
  } catch {
    return [];
  }
}

function writeDemoDocuments(
  documents: PetDocument[],
): void {
  localStorage.setItem(
    DEMO_STORAGE_KEY,
    JSON.stringify(documents),
  );
}

function formatStorageFileName(
  petId: string,
  file: File,
): string {

  const extension =
    file.name.split(".").pop() ?? "bin";

  return `${petId}/${crypto.randomUUID()}.${extension}`;
}

function createDemoDocument(
  input: PetDocumentUploadInput,
): Promise<PetDocument> {

  const storageName = formatStorageFileName(
    input.petId,
    input.file,
  );

  const document: PetDocument = {

    id: crypto.randomUUID(),

    petId: input.petId,

    documentName: input.file.name,

    originalFileName: input.file.name,

    storedFileName: storageName,

    category: input.category,

    description: input.description,

    mimeType: input.file.type,

    sizeBytes: input.file.size,

    storagePath: storageName,

    uploadedBy:
      input.uploadedBy ?? "Demo User",

    uploadedAt:
      new Date().toISOString(),

    expirationDate:
      input.expirationDate,
  };

  const documents = readDemoDocuments();

  documents.unshift(document);

  writeDemoDocuments(documents);

  return Promise.resolve(document);
}

export async function listPetDocuments(
  petId: string,
): Promise<PetDocument[]> {

  if (!isSupabaseConfigured) {

    return readDemoDocuments()
      .filter(
        (document) =>
          document.petId === petId,
      )
      .sort((a, b) =>
        b.uploadedAt.localeCompare(
          a.uploadedAt,
        ),
      );
  }

  const { data, error } =
    await supabase
      .from("pet_documents")
      .select("*")
      .eq("pet_id", petId)
      .order("uploaded_at", {
        ascending: false,
      });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => ({
    id: row.id,

    petId: row.pet_id,

    documentName:
      row.document_name,

    originalFileName:
      row.original_file_name,

    storedFileName:
      row.stored_file_name,

    category: row.category,

    description:
      row.description ?? "",

    mimeType: row.mime_type,

    sizeBytes: row.size_bytes,

    storagePath:
      row.storage_path,

    uploadedBy:
      row.uploaded_by,

    uploadedAt:
      row.uploaded_at,

    expirationDate:
      row.expiration_date,
  }));
}

export async function uploadPetDocument(
  input: PetDocumentUploadInput,
): Promise<PetDocument> {

  if (!isSupabaseConfigured) {
    return createDemoDocument(input);
  }

  const storageName = formatStorageFileName(
    input.petId,
    input.file,
  );

  const upload = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storageName, input.file, {
      upsert: false,
      cacheControl: "3600",
    });

  if (upload.error) {
    throw upload.error;
  }

  const { data, error } = await supabase
    .from("pet_documents")
    .insert({
      pet_id: input.petId,

      document_name: input.file.name,

      original_file_name: input.file.name,

      stored_file_name: storageName,

      category: input.category,

      description: input.description,

      mime_type: input.file.type,

      size_bytes: input.file.size,

      storage_path: storageName,

      uploaded_by:
        input.uploadedBy ?? "System",

      uploaded_at:
        new Date().toISOString(),

      expiration_date:
        input.expirationDate,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return {
    id: data.id,

    petId: data.pet_id,

    documentName:
      data.document_name,

    originalFileName:
      data.original_file_name,

    storedFileName:
      data.stored_file_name,

    category: data.category,

    description:
      data.description ?? "",

    mimeType:
      data.mime_type,

    sizeBytes:
      data.size_bytes,

    storagePath:
      data.storage_path,

    uploadedBy:
      data.uploaded_by,

    uploadedAt:
      data.uploaded_at,

    expirationDate:
      data.expiration_date,
  };
}

export async function getPetDocumentUrl(
  document: PetDocument,
): Promise<string> {

  if (!isSupabaseConfigured) {

    return URL.createObjectURL(
      new Blob([], {
        type: document.mimeType,
      }),
    );
  }

  const result = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(
      document.storagePath,
    );

  return result.data.publicUrl;
}

export async function deletePetDocument(
  document: PetDocument,
): Promise<void> {

  if (!isSupabaseConfigured) {

    const documents =
      readDemoDocuments();

    writeDemoDocuments(
      documents.filter(
        (item) =>
          item.id !== document.id,
      ),
    );

    return;
  }

  const storageDelete =
    await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([
        document.storagePath,
      ]);

  if (storageDelete.error) {
    throw storageDelete.error;
  }

  const { error } =
    await supabase
      .from("pet_documents")
      .delete()
      .eq("id", document.id);

  if (error) {
    throw error;
  }
}

const MAX_FILE_SIZE = 25 * 1024 * 1024;

const ALLOWED_TYPES = [
  "application/pdf",

  "image/jpeg",

  "image/png",

  "image/webp",

  "image/gif",

  "image/heic",

  "image/heif",
];

export function validatePetDocument(
  file: File,
): void {

  if (file.size === 0) {
    throw new Error(
      "The selected file is empty.",
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      "Files larger than 25 MB cannot be uploaded.",
    );
  }

  if (
    !ALLOWED_TYPES.includes(
      file.type,
    )
  ) {
    throw new Error(
      "Only PDF and image files are supported.",
    );
  }
}

export function formatFileSize(
  bytes: number,
): string {

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(
      bytes / 1024
    ).toFixed(1)} KB`;
  }

  if (
    bytes <
    1024 * 1024 * 1024
  ) {
    return `${(
      bytes /
      1024 /
      1024
    ).toFixed(1)} MB`;
  }

  return `${(
    bytes /
    1024 /
    1024 /
    1024
  ).toFixed(1)} GB`;
}

export function isImageDocument(
  document: PetDocument,
): boolean {

  return document.mimeType.startsWith(
    "image/",
  );
}

export function isPdfDocument(
  document: PetDocument,
): boolean {

  return (
    document.mimeType ===
    "application/pdf"
  );
}

export function isExpired(
  document: PetDocument,
): boolean {

  if (
    !document.expirationDate
  ) {
    return false;
  }

  return (
    new Date(
      document.expirationDate,
    ) < new Date()
  );
}

export function daysUntilExpiration(
  document: PetDocument,
): number | null {

  if (
    !document.expirationDate
  ) {
    return null;
  }

  const expires =
    new Date(
      document.expirationDate,
    );

  const today = new Date();

  const difference =
    expires.getTime() -
    today.getTime();

  return Math.ceil(
    difference /
      (1000 *
        60 *
        60 *
        24),
  );
}

export function sortDocuments(
  documents: PetDocument[],
): PetDocument[] {

  return [...documents].sort(
    (a, b) =>
      new Date(
        b.uploadedAt,
      ).getTime() -
      new Date(
        a.uploadedAt,
      ).getTime(),
  );
}

export function searchDocuments(
  documents: PetDocument[],
  query: string,
): PetDocument[] {

  const needle =
    query
      .trim()
      .toLowerCase();

  if (!needle) {
    return documents;
  }

  return documents.filter(
    (document) =>
      document.documentName
        .toLowerCase()
        .includes(needle) ||
      document
        .originalFileName
        .toLowerCase()
        .includes(needle) ||
      document.description
        .toLowerCase()
        .includes(needle) ||
      document.category
        .toLowerCase()
        .includes(needle),
  );
}

export function documentsExpiringWithin(
  documents: PetDocument[],
  days: number,
): PetDocument[] {

  return documents.filter((document) => {

    if (!document.expirationDate) {
      return false;
    }

    const remaining =
      daysUntilExpiration(document);

    return (
      remaining !== null &&
      remaining >= 0 &&
      remaining <= days
    );
  });
}

export function expiredDocuments(
  documents: PetDocument[],
): PetDocument[] {

  return documents.filter(
    isExpired,
  );
}

export function activeDocuments(
  documents: PetDocument[],
): PetDocument[] {

  return documents.filter(
    (document) => !isExpired(document),
  );
}

export function categoryCounts(
  documents: PetDocument[],
): Record<string, number> {

  return documents.reduce(
    (counts, document) => {

      counts[document.category] =
        (counts[document.category] ?? 0) + 1;

      return counts;

    },
    {} as Record<string, number>,
  );
}

export function newestDocument(
  documents: PetDocument[],
): PetDocument | null {

  if (documents.length === 0) {
    return null;
  }

  return sortDocuments(documents)[0];
}

export function documentIcon(
  document: PetDocument,
): "image" | "pdf" | "file" {

  if (isImageDocument(document)) {
    return "image";
  }

  if (isPdfDocument(document)) {
    return "pdf";
  }

  return "file";
}

export function documentExtension(
  document: PetDocument,
): string {

  const pieces =
    document.originalFileName.split(".");

  if (pieces.length <= 1) {
    return "";
  }

  return pieces
    .pop()!
    .toUpperCase();
}

export function renameDocument(
  document: PetDocument,
  name: string,
): PetDocument {

  return {
    ...document,
    documentName: name.trim(),
  };
}

export function cloneDocument(
  document: PetDocument,
): PetDocument {

  return {

    ...document,

    id: crypto.randomUUID(),

    uploadedAt:
      new Date().toISOString(),
  };
}