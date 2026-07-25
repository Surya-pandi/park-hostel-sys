"use client";

import { Camera, CheckCircle2, Play, Square, XCircle } from "lucide-react";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import { verifyQrAttendanceAction } from "@/app/actions/attendance";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ScannerPanel() {
  const [active, setActive] = useState(false);
  const [manualPayload, setManualPayload] = useState("");
  const [message, setMessage] = useState("");
  const [ok, setOk] = useState<boolean | null>(null);
  const [isPending, startTransition] = useTransition();
  const scannerRef = useRef<{ stop: () => Promise<void>; clear: () => void } | null>(null);

  const verifyPayload = useCallback((payload: string) => {
    startTransition(async () => {
      const result = await verifyQrAttendanceAction(payload);
      setOk(result.ok);
      setMessage(result.message);
    });
  }, []);

  useEffect(() => {
    if (!active) {
      return;
    }

    let cancelled = false;

    async function startScanner() {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled) {
          return;
        }

        const scanner = new Html5Qrcode("qr-reader");
        scannerRef.current = scanner;
        const cameras = await Html5Qrcode.getCameras();

        if (!cameras.length) {
          setMessage("No camera was detected. Paste a QR payload to verify manually.");
          setOk(false);
          return;
        }

        await scanner.start(
          cameras[0].id,
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decodedText) => {
            setManualPayload(decodedText);
            verifyPayload(decodedText);
            setActive(false);
          },
          () => undefined,
        );
      } catch {
        setMessage("Camera scanner could not start. Paste a QR payload to verify manually.");
        setOk(false);
      }
    }

    startScanner();

    return () => {
      cancelled = true;
      scannerRef.current
        ?.stop()
        .then(() => scannerRef.current?.clear())
        .catch(() => undefined);
    };
  }, [active, verifyPayload]);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>Live QR Scanner</CardTitle>
          <CardDescription>
            Warden scan flow validates signature, expiry, single use, and daily duplicate rules.
          </CardDescription>
        </div>
        <Button type="button" variant={active ? "destructive" : "default"} onClick={() => setActive(!active)}>
          {active ? <Square className="size-4" /> : <Play className="size-4" />}
          {active ? "Stop" : "Start Camera"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
          <div className="grid min-h-72 place-items-center rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900">
            <div id="qr-reader" className="w-full max-w-sm" />
            {!active ? (
              <div className="flex flex-col items-center gap-2 text-slate-500 dark:text-slate-400">
                <Camera className="size-8" />
                <span className="text-sm">Camera inactive</span>
              </div>
            ) : null}
          </div>
          <div className="space-y-3">
            <Label htmlFor="payload">Manual QR payload</Label>
            <Textarea
              id="payload"
              value={manualPayload}
              onChange={(event) => setManualPayload(event.target.value)}
              placeholder="Paste QR payload JSON here"
            />
            <Button
              type="button"
              onClick={() => verifyPayload(manualPayload)}
              disabled={isPending || !manualPayload}
            >
              Verify Attendance
            </Button>
            {message ? (
              <div className={ok ? "flex items-center gap-2 text-sm text-emerald-600" : "flex items-center gap-2 text-sm text-rose-600"}>
                {ok ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
                {message}
              </div>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
