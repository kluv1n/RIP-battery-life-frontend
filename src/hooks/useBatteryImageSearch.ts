import { useEffect, useMemo, useRef, useState } from "react";
import { cosineSimilarity } from "../modules/math";

export type ClipSearchItem = { id: number; description: string };

export interface ProcessedClipItem extends ClipSearchItem {
  score: number;
  isVisible: boolean;
  embedding?: number[];
}

function normalizeProgress(raw: unknown): number | null {
  if (raw === null || typeof raw !== "object") return null;
  const o = raw as { progress?: number };
  if (typeof o.progress !== "number") return null;
  return o.progress <= 1 ? Math.round(o.progress * 100) : Math.min(100, Math.round(o.progress));
}

export function useBatteryImageSearch(initialItems: ClipSearchItem[], enabled: boolean) {
  const [items, setItems] = useState<ProcessedClipItem[]>([]);
  const [imageEmbedding, setImageEmbedding] = useState<number[] | null>(null);
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [workerError, setWorkerError] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const embeddingsReadyRef = useRef(false);
  const pendingFileRef = useRef<File | null>(null);
  const itemsRef = useRef(initialItems);
  itemsRef.current = initialItems;

  const itemsKey = useMemo(
    () => initialItems.map((item) => `${item.id}:${item.description}`).join("|"),
    [initialItems],
  );

  useEffect(() => {
    setWorkerError(null);
    embeddingsReadyRef.current = false;
    pendingFileRef.current = null;

    if (!enabled) {
      workerRef.current?.terminate();
      workerRef.current = null;
      setItems([]);
      setReady(false);
      setProgress(0);
      setImageEmbedding(null);
      return;
    }

    const snapshot = itemsRef.current;
    if (snapshot.length === 0) {
      setItems([]);
      setReady(true);
      setProgress(100);
      setImageEmbedding(null);
      return;
    }

    setItems(snapshot.map((item) => ({ ...item, score: 0, isVisible: true })));
    setReady(false);
    setProgress(0);
    setImageEmbedding(null);

    workerRef.current = new Worker(new URL("../workers/search.worker.ts", import.meta.url), {
      type: "module",
    });

    workerRef.current.onmessage = (e: MessageEvent) => {
      const { type, data } = e.data as { type: string; data: unknown };
      if (type === "progress") {
        const p = normalizeProgress(data);
        if (p !== null) setProgress(p);
      } else if (type === "text_embeddings_ready") {
        embeddingsReadyRef.current = true;
        setItems((prev) =>
          prev.map((item) => ({
            ...item,
            embedding: (data as Record<number, number[] | undefined>)[item.id],
          })),
        );
        setReady(true);
        setProgress(100);
        const pending = pendingFileRef.current;
        if (pending && workerRef.current) {
          pendingFileRef.current = null;
          workerRef.current.postMessage({ type: "image", data: pending });
        }
      } else if (type === "image_embedding_ready") {
        setImageEmbedding(data as number[]);
      } else if (type === "error") {
        setWorkerError(typeof data === "string" ? data : "Worker error");
        setReady(true);
        pendingFileRef.current = null;
      }
    };

    workerRef.current.postMessage({ type: "init", data: snapshot });

    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, [itemsKey, enabled]);

  useEffect(() => {
    if (!imageEmbedding) return;
    setItems((prevItems) => {
      if (!prevItems[0]?.embedding) return prevItems;
      const processed = prevItems.map((item) => {
        if (!item.embedding) return { ...item, score: 0, isVisible: true };
        return {
          ...item,
          score: cosineSimilarity(imageEmbedding, item.embedding),
          isVisible: true,
        };
      });
      processed.sort((a, b) => b.score - a.score);
      return processed;
    });
  }, [imageEmbedding]);

  const searchByImage = (file: File) => {
    if (!workerRef.current || !embeddingsReadyRef.current) {
      pendingFileRef.current = file;
      return;
    }
    workerRef.current.postMessage({ type: "image", data: file });
  };

  const resetSearch = () => {
    setImageEmbedding(null);
    setWorkerError(null);
    pendingFileRef.current = null;
    setItems((prev) =>
      [...prev].sort((a, b) => a.id - b.id).map((item) => ({ ...item, score: 0, isVisible: true })),
    );
  };

  return { items, ready, progress, imageEmbedding, workerError, searchByImage, resetSearch };
}
