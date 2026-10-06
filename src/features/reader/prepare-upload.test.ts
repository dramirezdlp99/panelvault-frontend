import { describe, expect, it, vi } from "vitest";

import { MAX_SIDE_PX, MAX_UPLOAD_BYTES, prepareForUpload, UploadTooLargeError, type Encoder } from "./prepare-upload";

const blobOf = (bytes: number, type = "image/png") => new Blob([new Uint8Array(bytes)], { type });

describe("prepareForUpload", () => {
  it("el limite queda por debajo de los 4,5 MB de Vercel", () => {
    expect(MAX_UPLOAD_BYTES).toBeLessThan(4.5 * 1024 * 1024);
  });

  it("devuelve la misma imagen si ya cabe, sin recodificarla", async () => {
    const image = blobOf(1000);
    const encode = vi.fn<Encoder>();
    expect(await prepareForUpload(image, { maxBytes: 2000, encode })).toBe(image);
    expect(encode).not.toHaveBeenCalled();
  });

  it("reduce una imagen pesada a JPEG de lado maximo 2400 px", async () => {
    const encode = vi.fn<Encoder>(async () => blobOf(500, "image/jpeg"));
    const result = await prepareForUpload(blobOf(5000), { maxBytes: 2000, encode });
    expect(result.type).toBe("image/jpeg");
    expect(result.size).toBe(500);
    expect(encode).toHaveBeenCalledTimes(1);
    expect(encode.mock.calls[0][1]).toBe(MAX_SIDE_PX);
  });

  it("baja tamano y calidad en pasos hasta que quepa", async () => {
    const sizes = [4000, 3000, 1500];
    const encode = vi.fn<Encoder>(async () => blobOf(sizes.shift()!, "image/jpeg"));
    const result = await prepareForUpload(blobOf(9000), { maxBytes: 2000, encode });
    expect(result.size).toBe(1500);
    expect(encode).toHaveBeenCalledTimes(3);
    expect(encode.mock.calls.map((c) => c[1])).toEqual([2400, 2400, 2000]);
  });

  it("se rinde con un error claro si nunca cabe", async () => {
    const encode = vi.fn<Encoder>(async () => blobOf(9999, "image/jpeg"));
    await expect(prepareForUpload(blobOf(10_000), { maxBytes: 2000, encode })).rejects.toBeInstanceOf(UploadTooLargeError);
    expect(encode).toHaveBeenCalledTimes(4);
  });
});
