"use client";

import { Camera, CheckCircle2, Play, RefreshCw, Square, X, XCircle } from "lucide-react";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import { verifyQrAttendanceAction } from "@/app/actions/attendance";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type CameraDevice = {
  id: string;
  label: string;
};

type QrScanner = InstanceType<typeof import("html5-qrcode").Html5Qrcode>;

type PresentedPopup = {
  studentName: string;
  message: string;
};

async function clearScanner(scanner: QrScanner | null) {
  if (!scanner) {
    return;
  }

  try {
    await scanner.stop();
  } catch {
    // Scanner may not have finished starting yet.
  }

  try {
    scanner.clear();
  } catch {
    // The reader element may already be cleared during quick camera switches.
  }
}

function cameraLabel(camera: CameraDevice, index: number) {
  return camera.label || `Camera ${index + 1}`;
}

export function ScannerPanel() {
  const [active, setActive] = useState(true);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [cameraId, setCameraId] = useState("");
  const [manualPayload, setManualPayload] = useState("");
  const [message, setMessage] = useState("");
  const [ok, setOk] = useState<boolean | null>(null);
  const [presentedPopup, setPresentedPopup] = useState<PresentedPopup | null>(null);
  const [isPending, startTransition] = useTransition();
  const scannerRef = useRef<QrScanner | null>(null);
  const lastScanRef = useRef<string | null>(null);

  const verifyPayload = useCallback((payload: string) => {
    startTransition(async () => {
      const result = await verifyQrAttendanceAction(payload);
      setOk(result.ok);
      setMessage(result.message);

      if (result.ok) {
        setPresentedPopup({
          studentName: result.studentName ?? "Student",
          message: result.message,
        });
      }
    });
  }, []);

  const switchCamera = useCallback(() => {
    if (cameras.length < 2) {
      return;
    }

    const currentIndex = cameras.findIndex((camera) => camera.id === cameraId);
    const nextCamera = cameras[(currentIndex + 1) % cameras.length] ?? cameras[0];
    setCameraId(nextCamera.id);
  }, [cameraId, cameras]);

  useEffect(() => {
    if (!active) {
      return;
    }

    let cancelled = false;
    let scanner: QrScanner | null = null;

    async function startScanner() {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled) {
          return;
        }

        const availableCameras = await Html5Qrcode.getCameras();
        if (cancelled) {
          return;
        }

        setCameras(availableCameras);

        if (!availableCameras.length) {
          setMessage("No camera was detected. Paste a QR payload to verify manually.");
          setOk(false);
          return;
        }

        const selectedCameraId = cameraId || availableCameras[0].id;

        if (!cameraId) {
          setCameraId(selectedCameraId);
          return;
        }

        scanner = new Html5Qrcode("qr-reader");
        scannerRef.current = scanner;
        lastScanRef.current = null;
        setMessage("");
        setOk(null);

        await scanner.start(
          selectedCameraId,
          { fps: 10, qrbox: { width: 300, height: 300 } },
          (decodedText) => {
            if (lastScanRef.current === decodedText) {
              return;
            }

            lastScanRef.current = decodedText;
            setManualPayload(decodedText);
            verifyPayload(decodedText);
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
      if (scannerRef.current === scanner) {
        scannerRef.current = null;
      }
      void clearScanner(scanner);
    };
  }, [active, cameraId, verifyPayload]);

  useEffect(() => {
    if (!presentedPopup) {
      return undefined;
    }

    const timeout = window.setTimeout(() => setPresentedPopup(null), 3500);
    return () => window.clearTimeout(timeout);
  }, [presentedPopup]);

  return (
    <>
      {presentedPopup ? (
        <div
          aria-live="assertive"
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4 backdrop-blur-sm"
          role="status"
        >
          <div className="w-full max-w-sm rounded-lg border border-emerald-200 bg-white p-5 text-center shadow-xl dark:border-emerald-900 dark:bg-slate-950">
            <button
              type="button"
              aria-label="Close presented popup"
              className="ml-auto grid size-9 place-items-center rounded-md text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900"
              onClick={() => setPresentedPopup(null)}
            >
              <X className="size-4" />
            </button>
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200">
              <CheckCircle2 className="size-9" />
            </div>
            <p className="mt-4 text-sm font-semibold uppercase text-emerald-600 dark:text-emerald-300">
              Presented
            </p>
            <h3 className="mt-2 text-2xl font-semibold">{presentedPopup.studentName}</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{presentedPopup.message}</p>
          </div>
        </div>
      ) : null}
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Live QR Scanner</CardTitle>
            <CardDescription>
              Warden camera stays active while validating signature, expiry, single use, and duplicate rules.
            </CardDescription>
          </div>
          <Button
            type="button"
            className="w-full sm:w-auto"
            variant={active ? "destructive" : "default"}
            onClick={() => setActive(!active)}
          >
            {active ? <Square className="size-4" /> : <Play className="size-4" />}
            {active ? "Stop" : "Start Camera"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,420px)_1fr]">
            <div className="grid min-h-72 place-items-center rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900 sm:min-h-[28rem]">
              <div id="qr-reader" className="w-full max-w-md" />
              {!active ? (
                <div className="flex flex-col items-center gap-2 text-slate-500 dark:text-slate-400">
                  <Camera className="size-8" />
                  <span className="text-sm">Camera inactive</span>
                </div>
              ) : null}
            </div>
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <div className="space-y-2">
                  <Label htmlFor="camera">Camera</Label>
                  <Select
                    id="camera"
                    value={cameraId}
                    onChange={(event) => setCameraId(event.target.value)}
                    disabled={!cameras.length}
                  >
                    {!cameras.length ? <option value="">No camera detected</option> : null}
                    {cameras.map((camera, index) => (
                      <option key={camera.id} value={camera.id}>
                        {cameraLabel(camera, index)}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    className="w-full sm:w-auto"
                    variant="outline"
                    onClick={switchCamera}
                    disabled={cameras.length < 2}
                  >
                    <RefreshCw className="size-4" />
                    Switch Camera
                  </Button>
                </div>
              </div>
              <Label htmlFor="payload">Manual QR payload</Label>
              <Textarea
                id="payload"
                value={manualPayload}
                onChange={(event) => setManualPayload(event.target.value)}
                placeholder="Paste QR payload JSON here"
              />
              <Button
                type="button"
                className="w-full sm:w-auto"
                onClick={() => verifyPayload(manualPayload)}
                disabled={isPending || !manualPayload}
              >
                Verify Attendance
              </Button>
              {message ? (
                <div
                  aria-live="polite"
                  className={
                    ok
                      ? "rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
                      : "rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200"
                  }
                >
                  <div className="flex items-start gap-2">
                    {ok ? (
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                    ) : (
                      <XCircle className="mt-0.5 size-4 shrink-0" />
                    )}
                    <div>
                      <p className="text-xs font-semibold uppercase text-current">Latest scan</p>
                      <p className="mt-1 text-sm font-medium">{message}</p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
