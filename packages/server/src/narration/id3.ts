/** Add an ID3v2.4 comment so the mp3 itself records that the voice is AI generated. */

const syncSafe = (value: number): Uint8Array => {
  const out = new Uint8Array(4);
  out[0] = (value >>> 21) & 0x7f;
  out[1] = (value >>> 14) & 0x7f;
  out[2] = (value >>> 7) & 0x7f;
  out[3] = value & 0x7f;
  return out;
};

const concat = (parts: Uint8Array[]): Uint8Array => {
  const total = parts.reduce((sum, part) => sum + part.byteLength, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.byteLength;
  }
  return out;
};

const frame = (id: string, payload: Uint8Array): Uint8Array => {
  const header = new Uint8Array(10);
  header.set(new TextEncoder().encode(id.slice(0, 4)), 0);
  header.set(syncSafe(payload.byteLength), 4);
  return concat([header, payload]);
};

const textPayload = (text: string): Uint8Array =>
  concat([new Uint8Array([0x03]), new TextEncoder().encode(text)]);

const commentPayload = (text: string): Uint8Array =>
  concat([
    new Uint8Array([0x03]),
    new TextEncoder().encode('eng'),
    new Uint8Array([0x00]),
    new TextEncoder().encode(text),
  ]);

const stripExistingTag = (bytes: Uint8Array): Uint8Array => {
  if (bytes.length < 10 || bytes[0] !== 0x49 || bytes[1] !== 0x44 || bytes[2] !== 0x33) return bytes;
  const size =
    ((bytes[6] ?? 0) << 21) | ((bytes[7] ?? 0) << 14) | ((bytes[8] ?? 0) << 7) | (bytes[9] ?? 0);
  const footer = ((bytes[5] ?? 0) & 0x10) !== 0 ? 10 : 0;
  return bytes.slice(10 + size + footer);
};

export const withId3Comment = (audio: Uint8Array, comment: string, title: string): Uint8Array => {
  const body = concat([frame('TIT2', textPayload(title)), frame('COMM', commentPayload(comment))]);
  const header = new Uint8Array(10);
  header.set(new TextEncoder().encode('ID3'), 0);
  header[3] = 4;
  header[4] = 0;
  header[5] = 0;
  header.set(syncSafe(body.byteLength), 6);
  return concat([header, body, stripExistingTag(audio)]);
};
