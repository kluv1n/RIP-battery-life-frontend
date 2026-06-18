import {
  AutoProcessor,
  AutoTokenizer,
  RawImage,
  SiglipTextModel,
  SiglipVisionModel,
  env,
} from "@huggingface/transformers";

env.allowLocalModels = false;
env.allowRemoteModels = true;
// jsdelivr недоступен — WASM с dev-сервера (/onnx-runtime/ в vite.config.ts).
if (env.backends.onnx.wasm) {
  env.backends.onnx.wasm.numThreads = 1;
  env.backends.onnx.wasm.wasmPaths = `${self.location.origin}/onnx-runtime/`;
}

const MODEL_ID = "Xenova/siglip-base-patch16-224";

type ClipItem = { id: number; description: string };

class SiglipService {
  static tokenizer: Awaited<ReturnType<typeof AutoTokenizer.from_pretrained>> | null = null;
  static processor: Awaited<ReturnType<typeof AutoProcessor.from_pretrained>> | null = null;
  static textModel: Awaited<ReturnType<typeof SiglipTextModel.from_pretrained>> | null = null;
  static visionModel: Awaited<ReturnType<typeof SiglipVisionModel.from_pretrained>> | null = null;

  static async init(progress_callback?: (data: unknown) => void) {
    if (this.tokenizer) return;
    const options = { device: "wasm", dtype: "q8" } as const;
    this.tokenizer = await AutoTokenizer.from_pretrained(MODEL_ID, { progress_callback });
    this.processor = await AutoProcessor.from_pretrained(MODEL_ID, { progress_callback });
    this.textModel = await SiglipTextModel.from_pretrained(MODEL_ID, { ...options, progress_callback });
    this.visionModel = await SiglipVisionModel.from_pretrained(MODEL_ID, { ...options, progress_callback });
  }
}

self.addEventListener("message", async (event: MessageEvent<{ type: string; data: unknown }>) => {
  const { type, data } = event.data;
  try {
    if (type === "init") {
      await SiglipService.init((msg) => self.postMessage({ type: "progress", data: msg }));
      const items = data as ClipItem[];
      const descriptions = items.map((item) => item.description);
      const textInputs = await SiglipService.tokenizer!(descriptions, {
        padding: "max_length",
        truncation: true,
      });
      const { pooler_output: textOutput } = await SiglipService.textModel!(textInputs);
      const embeddingSize = 768;
      const embeddings: Record<number, number[]> = {};
      for (let i = 0; i < items.length; i += 1) {
        const start = i * embeddingSize;
        const vector = textOutput.data.slice(start, start + embeddingSize);
        embeddings[items[i].id] = Array.from(vector);
      }
      self.postMessage({ type: "text_embeddings_ready", data: embeddings });
      return;
    }

    if (type === "image") {
      const imageUrl = URL.createObjectURL(data as Blob);
      const image = await RawImage.read(imageUrl);
      const imageInputs = await SiglipService.processor!(image);
      const { pooler_output } = await SiglipService.visionModel!(imageInputs);
      self.postMessage({ type: "image_embedding_ready", data: Array.from(pooler_output.data) });
      URL.revokeObjectURL(imageUrl);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    self.postMessage({ type: "error", data: message });
  }
});

export {};
