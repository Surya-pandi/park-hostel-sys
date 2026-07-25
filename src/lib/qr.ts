import { createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";

import { ATTENDANCE_WINDOW } from "./constants";
import { isAttendanceWindowOpen } from "./utils";

export type QrPayload = {
  studentId: string;
  jwt: string;
  timestamp: number;
  nonce: string;
  uuid: string;
  expiresAt: string;
  digitalSignature: string;
};

type CreatePayloadInput = {
  studentId: string;
  jwt: string;
};

const FALLBACK_SECRET = "development-only-change-qr-signing-secret";

function signingSecret() {
  return process.env.QR_SIGNING_SECRET || FALLBACK_SECRET;
}

function unsignedPayload(payload: Omit<QrPayload, "digitalSignature">) {
  return JSON.stringify({
    studentId: payload.studentId,
    jwt: payload.jwt,
    timestamp: payload.timestamp,
    nonce: payload.nonce,
    uuid: payload.uuid,
    expiresAt: payload.expiresAt,
  });
}

export function signQrPayload(payload: Omit<QrPayload, "digitalSignature">) {
  return createHmac("sha256", signingSecret()).update(unsignedPayload(payload)).digest("hex");
}

export function createQrPayload(input: CreatePayloadInput): QrPayload {
  const now = Date.now();
  const expiresAt = new Date(now + ATTENDANCE_WINDOW.expirySeconds * 1000).toISOString();
  const withoutSignature = {
    studentId: input.studentId,
    jwt: input.jwt,
    timestamp: now,
    nonce: randomBytes(16).toString("hex"),
    uuid: randomUUID(),
    expiresAt,
  };

  return {
    ...withoutSignature,
    digitalSignature: signQrPayload(withoutSignature),
  };
}

export function encodeQrPayload(payload: QrPayload) {
  return JSON.stringify(payload);
}

export function parseQrPayload(rawPayload: string) {
  return JSON.parse(rawPayload) as QrPayload;
}

export function verifyQrPayload(payload: QrPayload) {
  const expected = signQrPayload(payload);
  const actual = payload.digitalSignature;
  const expectedBytes = Buffer.from(expected, "hex");
  const actualBytes = Buffer.from(actual, "hex");
  const signatureValid =
    expectedBytes.length === actualBytes.length && timingSafeEqual(expectedBytes, actualBytes);
  const notExpired = new Date(payload.expiresAt).getTime() > Date.now();

  return {
    ok: signatureValid && notExpired,
    signatureValid,
    notExpired,
    windowOpen: isAttendanceWindowOpen(),
  };
}
