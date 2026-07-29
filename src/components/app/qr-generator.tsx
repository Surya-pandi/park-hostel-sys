"use client";

import { Clipboard, RefreshCw, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { QRCodeCanvas } from "qrcode.react";

import { generateQrTokenAction, type QrActionResult } from "@/app/actions/attendance";
import { StatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ATTENDANCE_WINDOW } from "@/lib/constants";

export function QrGenerator() {
  const [result, setResult] = useState<QrActionResult | null>(null);
  const [now, setNow] = useState(0);
  const [copyMessage, setCopyMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const refreshQr = useCallback(() => {
    startTransition(async () => {
      try {
        const next = await generateQrTokenAction();
        setResult(next);
        setCopyMessage("");
      } catch {
        setResult({
          ok: false,
          message: "QR generation failed. Refresh and try again.",
          windowOpen: false,
        });
      }
      setNow(Date.now());
    });
  }, []);

  useEffect(() => {
    refreshQr();
    const refreshTimer = window.setInterval(refreshQr, ATTENDANCE_WINDOW.expirySeconds * 1000);
    const clockTimer = window.setInterval(() => setNow(Date.now()), 1000);

    return () => {
      window.clearInterval(refreshTimer);
      window.clearInterval(clockTimer);
    };
  }, [refreshQr]);

  const secondsLeft = result?.expiresAt
    ? Math.max(0, Math.ceil((new Date(result.expiresAt).getTime() - now) / 1000))
    : 0;
  const qrPayload = result?.payload ?? "";
  const qrCode = useMemo(
    () =>
      qrPayload ? (
        <QRCodeCanvas
          key={qrPayload}
          value={qrPayload}
          size={384}
          level="Q"
          marginSize={4}
          bgColor="#ffffff"
          fgColor="#020617"
          className="h-auto w-full max-w-80 rounded-md bg-white sm:max-w-96"
          style={{ height: "auto", width: "100%", imageRendering: "pixelated" }}
          title="Dynamic attendance QR code"
        />
      ) : null,
    [qrPayload],
  );

  const copyPayload = useCallback(async () => {
    if (!qrPayload) {
      return;
    }

    try {
      await navigator.clipboard.writeText(qrPayload);
      setCopyMessage("Payload copied.");
    } catch {
      setCopyMessage("Copy failed.");
    }
  }, [qrPayload]);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>Dynamic Attendance QR</CardTitle>
          <CardDescription>
            Signed payload includes studentId, JWT reference, nonce, UUID, expiry, and signature.
          </CardDescription>
        </div>
        <StatusBadge status={result?.windowOpen ? "Open" : "Closed"} />
      </CardHeader>
      <CardContent>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)] lg:gap-6">
          <div className="grid place-items-center rounded-lg border border-slate-200 bg-white p-3 shadow-inner dark:border-slate-800 sm:p-6">
            {qrCode ? (
              qrCode
            ) : (
              <div className="grid aspect-square w-full max-w-80 place-items-center rounded-md bg-slate-100 text-sm text-slate-500 dark:bg-slate-800 sm:max-w-96">
                {isPending ? "Generating QR..." : "QR unavailable"}
              </div>
            )}
          </div>
          <div className="space-y-4">
            <div className="grid gap-3 min-[420px]:grid-cols-3">
              <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800 sm:p-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">Expires in</p>
                <p className="mt-1 text-2xl font-semibold">{secondsLeft}s</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800 sm:p-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">Single use</p>
                <p className="mt-1 text-2xl font-semibold">Yes</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800 sm:p-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">Per day</p>
                <p className="mt-1 text-2xl font-semibold">Once</p>
              </div>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-100 sm:p-4">
              <div className="flex gap-2">
                <ShieldCheck className="mt-0.5 size-4 shrink-0" />
                <p>
                  QR is regenerated on a {ATTENDANCE_WINDOW.expirySeconds}-second cycle and verified
                  on the server before attendance is recorded.
                </p>
              </div>
            </div>
            {result?.message ? (
              <p className={result.ok ? "text-sm text-emerald-600" : "text-sm text-rose-600"}>
                {result.message}
              </p>
            ) : null}
            <div className="flex flex-col gap-2 min-[420px]:flex-row min-[420px]:items-center">
              <Button
                type="button"
                className="w-full min-[420px]:w-auto"
                onClick={refreshQr}
                disabled={isPending}
              >
                <RefreshCw className="size-4" />
                Refresh QR
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full min-[420px]:w-auto"
                onClick={copyPayload}
                disabled={!qrPayload}
              >
                <Clipboard className="size-4" />
                Copy Payload
              </Button>
            </div>
            {copyMessage ? <p className="text-sm text-slate-500 dark:text-slate-400">{copyMessage}</p> : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
