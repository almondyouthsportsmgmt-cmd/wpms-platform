import {
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import {
  Download,
  Eye,
  File,
  FileImage,
  FileText,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { AppButton } from "../../components/common/AppButton";
import {
  formatFileSize,
  isExpired,
  isImageDocument,
  isPdfDocument,
} from "./petDocumentService";
import {
  PET_DOCUMENT_CATEGORIES,
  type PetDocument,
  type PetDocumentCategory,
} from "./petDocumentTypes";
import { usePetDocuments } from "./usePetDocuments";

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

function documentIcon(document: PetDocument) {
  if (isImageDocument(document)) {
    return <FileImage size={18} />;
  }

  if (isPdfDocument(document)) {
    return <FileText size={18} />;
  }

  return <File size={18} />;
}

function expirationText(document: PetDocument) {
  if (!document.expirationDate) {
    return "";
  }

  return new Date(document.expirationDate).toLocaleDateString();
}

export function PetDocumentsPanel({ petId }: { petId: string }) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    documents,
    loading,
    error,
    upload,
    remove,
    preview,
  } = usePetDocuments(petId);

  const [query, setQuery] = useState("");
  const [category, setCategory] =
    useState<PetDocumentCategory>("Other");
  const [description, setDescription] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState("");
  const [viewer, setViewer] = useState<{
    document: PetDocument;
    url: string;
  } | null>(null);

  const filteredDocuments = useMemo(() => {
    const needle = query.trim().toLowerCase();

    if (!needle) {
      return documents;
    }

    return documents.filter((item) =>
      [
        item.documentName,
        item.originalFileName,
        item.category,
        item.description,
        item.uploadedBy,
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [documents, query]);

  async function uploadFiles(files: FileList | File[]) {
    const selectedFiles = Array.from(files);

    if (selectedFiles.length === 0) {
      return;
    }

    setUploading(true);
    setLocalError("");

    try {
      for (const file of selectedFiles) {
        if (file.size === 0) {
          throw new Error(`${file.name} is empty.`);
        }

        if (file.size > MAX_FILE_SIZE_BYTES) {
          throw new Error(`${file.name} exceeds the 25 MB file limit.`);
        }

        await upload({
          file,
          category,
          description: description.trim(),
          expirationDate: expirationDate || null,
          uploadedBy: "Current user",
        });
      }

      setDescription("");
      setExpirationDate("");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (caught) {
      setLocalError(
        caught instanceof Error
          ? caught.message
          : "Unable to upload the selected document.",
      );
    } finally {
      setUploading(false);
      setDragging(false);
    }
  }

  function handleFileInput(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) {
      void uploadFiles(event.target.files);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    void uploadFiles(event.dataTransfer.files);
  }

  async function openDocument(document: PetDocument) {
    setLocalError("");

    try {
      const url = await preview(document);

      if (isImageDocument(document) || isPdfDocument(document)) {
        setViewer({ document, url });
        return;
      }

      window.open(url, "_blank", "noopener,noreferrer");
    } catch (caught) {
      setLocalError(
        caught instanceof Error
          ? caught.message
          : "Unable to open the document.",
      );
    }
  }

  async function downloadDocument(document: PetDocument) {
    setLocalError("");

    try {
      const url = await preview(document);
      const anchor = window.document.createElement("a");

      anchor.href = url;
      anchor.download =
        document.originalFileName || document.documentName;
      anchor.rel = "noopener noreferrer";

      window.document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    } catch (caught) {
      setLocalError(
        caught instanceof Error
          ? caught.message
          : "Unable to download the document.",
      );
    }
  }

  async function deleteDocument(document: PetDocument) {
    const confirmed = window.confirm(
      `Delete "${document.documentName}"?`,
    );

    if (!confirmed) {
      return;
    }

    setLocalError("");

    try {
      await remove(document);

      if (viewer?.document.id === document.id) {
        setViewer(null);
      }
    } catch (caught) {
      setLocalError(
        caught instanceof Error
          ? caught.message
          : "Unable to delete the document.",
      );
    }
  }

  const displayedError = localError || error;

  return (
    <>
      <section className="pet-documents-panel pet-documents-visible">
        <div className="pet-documents-heading">
          <div>
            <span className="eyebrow">Digital records</span>
            <h2>Pet Documents</h2>
            <p>
              Upload vaccination records, medical files, grooming
              instructions, photos, and other documents.
            </p>
          </div>

          <span className="pet-document-count">
            {documents.length}
          </span>
        </div>

        {displayedError && (
          <div className="form-error">{displayedError}</div>
        )}

        <div
          className={`pet-document-dropzone ${
            dragging ? "is-dragging" : ""
          }`}
          onDragEnter={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
          }}
          onDragLeave={(event) => {
            if (event.currentTarget === event.target) {
              setDragging(false);
            }
          }}
          onDrop={handleDrop}
        >
          <Upload size={26} />

          <strong>Upload documents</strong>

          <p>
            Drag files here or browse. Files may be up to 25 MB.
          </p>

          <AppButton
            type="button"
            variant="secondary"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? "Uploading..." : "Browse files"}
          </AppButton>

          <input
            ref={fileInputRef}
            className="pet-document-file-input"
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.webp,.gif,.heic,.heif,.doc,.docx,.xls,.xlsx,.txt"
            onChange={handleFileInput}
          />
        </div>

        <div className="pet-document-upload-options">
          <label className="field">
            <span>Category</span>
            <select
              value={category}
              onChange={(event) =>
                setCategory(
                  event.target.value as PetDocumentCategory,
                )
              }
            >
              {PET_DOCUMENT_CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Expiration date</span>
            <input
              type="date"
              value={expirationDate}
              onChange={(event) =>
                setExpirationDate(event.target.value)
              }
            />
          </label>

          <label className="field pet-document-description">
            <span>Description</span>
            <input
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              placeholder="Optional description"
            />
          </label>
        </div>

        <div className="pet-document-search">
          <Search size={16} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search documents..."
          />
        </div>

        {loading ? (
          <div className="pet-document-empty">
            <strong>Loading documents...</strong>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="pet-document-empty">
            <FileText size={28} />
            <strong>No documents found</strong>
            <span>
              Uploaded document names will appear here.
            </span>
          </div>
        ) : (
          <div className="pet-document-list">
            {filteredDocuments.map((document) => {
              const expired = isExpired(document);
              const expires = expirationText(document);

              return (
                <article
                  className={`pet-document-row ${
                    expired ? "is-expired" : ""
                  }`}
                  key={document.id}
                >
                  <button
                    type="button"
                    className="pet-document-name"
                    onClick={() => void openDocument(document)}
                  >
                    <span className="pet-document-icon">
                      {documentIcon(document)}
                    </span>

                    <span>
                      <strong>{document.documentName}</strong>

                      <small>
                        {document.category} ·{" "}
                        {formatFileSize(document.sizeBytes)} ·{" "}
                        {new Date(
                          document.uploadedAt,
                        ).toLocaleDateString()}
                      </small>

                      {expires && (
                        <small>
                          {expired ? "Expired" : "Expires"} {expires}
                        </small>
                      )}
                    </span>
                  </button>

                  <div className="pet-document-actions">
                    <button
                      type="button"
                      className="icon-button"
                      onClick={() =>
                        void openDocument(document)
                      }
                      aria-label={`View ${document.documentName}`}
                    >
                      <Eye size={16} />
                    </button>

                    <button
                      type="button"
                      className="icon-button"
                      onClick={() =>
                        void downloadDocument(document)
                      }
                      aria-label={`Download ${document.documentName}`}
                    >
                      <Download size={16} />
                    </button>

                    <button
                      type="button"
                      className="icon-button danger-button"
                      onClick={() =>
                        void deleteDocument(document)
                      }
                      aria-label={`Delete ${document.documentName}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {viewer && (
        <div className="pet-document-viewer">
          <button
            type="button"
            className="pet-document-viewer-backdrop"
            onClick={() => setViewer(null)}
            aria-label="Close document viewer"
          />

          <div className="pet-document-viewer-card">
            <header>
              <div>
                <span className="eyebrow">
                  {viewer.document.category}
                </span>
                <h2>{viewer.document.documentName}</h2>
              </div>

              <button
                type="button"
                className="icon-button"
                onClick={() => setViewer(null)}
                aria-label="Close viewer"
              >
                ×
              </button>
            </header>

            {isImageDocument(viewer.document) ? (
              <img
                src={viewer.url}
                alt={viewer.document.documentName}
              />
            ) : (
              <iframe
                src={viewer.url}
                title={viewer.document.documentName}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
