import assert from "node:assert/strict";
import { test } from "node:test";

process.env.NEXT_PUBLIC_API_BASE_URL ??= "http://localhost:3001";
const { uploadAssistantAttachment, isDocumentFile } = await import(
  "./assistantApi"
);

test("screenshots keep their reader ID and image preview through the assistant upload", async () => {
  const originalFetch = globalThis.fetch;
  const attachment = {
    type: "IMAGE",
    documentId: "a96e8d19-efc2-49f1-aa28-490118d6a3a6",
    url: "https://example.test/screenshot.png",
    name: "Screenshot.png",
  };
  let calls = 0;
  globalThis.fetch = (async (url, init) => {
    assert.equal(new URL(String(url)).pathname, "/api/v1/assistant/documents");
    assert.equal(init?.credentials, "include");
    assert.ok(init?.body instanceof FormData);
    assert.ok(init.body.get("file") instanceof File);
    calls++;
    return Response.json(attachment);
  }) as typeof fetch;
  try {
    for (const [name, type] of [
      ["Screenshot.png", "image/png"],
      ["image.jpeg", "image/jpeg"],
      ["shot.webp", "image/webp"],
      ["pasted.PNG", ""],
    ]) {
      const result = await uploadAssistantAttachment(
        new File(["pixels"], name, { type }),
      );
      assert.deepEqual(result, attachment);
    }
    assert.equal(calls, 4);
    assert.equal(
      isDocumentFile(
        new File(["order details"], "order.txt", { type: "text/plain" }),
      ),
      true,
    );
    assert.equal(
      isDocumentFile(new File(["pixels"], "shot.png", { type: "image/png" })),
      false,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
