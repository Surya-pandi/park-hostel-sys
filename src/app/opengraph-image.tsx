import { ImageResponse } from "next/og";

import { APP_NAME, COLLEGE_NAME } from "@/lib/constants";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#f8fafc",
          color: "#0f172a",
          display: "flex",
          padding: 56,
          fontFamily: "Arial",
        }}
      >
        <div
          style={{
            flex: 1,
            border: "1px solid #cbd5e1",
            borderRadius: 24,
            background: "white",
            padding: 48,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 16,
                background: "#2563eb",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
                fontWeight: 700,
              }}
            >
              QR
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{COLLEGE_NAME}</div>
              <div style={{ fontSize: 20, color: "#475569" }}>{APP_NAME}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            {["Dynamic QR", "RLS + RBAC", "Realtime Dashboards", "CSV Excel PDF"].map((item) => (
              <div
                key={item}
                style={{
                  border: "1px solid #dbeafe",
                  background: "#eff6ff",
                  borderRadius: 14,
                  color: "#1d4ed8",
                  padding: "14px 18px",
                  fontSize: 22,
                  fontWeight: 700,
                }}
              >
                {item}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.05 }}>
            Secure hostel attendance management for PCET.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
