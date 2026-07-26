import { useCallback, useEffect, useState } from "react";

import {
  deletePetDocument,
  getPetDocumentUrl,
  listPetDocuments,
  uploadPetDocument,
} from "./petDocumentService";

import type {
  PetDocument,
  PetDocumentUploadInput,
} from "./petDocumentTypes";

export function usePetDocuments(
  petId: string,
) {

  const [
    documents,
    setDocuments,
  ] = useState<PetDocument[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const refresh =
    useCallback(async () => {

      if (!petId) {

        setDocuments([]);

        return;
      }

      setLoading(true);

      setError("");

      try {

        const items =
          await listPetDocuments(
            petId,
          );

        setDocuments(items);

      } catch (caught) {

        setError(
          caught instanceof Error
            ? caught.message
            : "Unable to load documents.",
        );

      } finally {

        setLoading(false);

      }

    }, [petId]);

  useEffect(() => {

    void refresh();

  }, [refresh]);

  async function upload(
    input: Omit<
      PetDocumentUploadInput,
      "petId"
    >,
  ) {

    const document =
      await uploadPetDocument({

        ...input,

        petId,
      });

    setDocuments(
      current => [
        document,
        ...current,
      ],
    );

    return document;
  }

  async function remove(
    document: PetDocument,
  ) {

    await deletePetDocument(
      document,
    );

    setDocuments(
      current =>
        current.filter(
          item =>
            item.id !==
            document.id,
        ),
    );
  }

  async function preview(
    document: PetDocument,
  ) {

    return getPetDocumentUrl(
      document,
    );
  }

  return {

    documents,

    loading,

    error,

    refresh,

    upload,

    remove,

    preview,
  };
}