"use client";

import { Camera, CheckCircle2, Play, RefreshCw, Square, XCircle } from "lucide-react";
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
  const [active, setActive] = useState(false);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [cameraId, setCameraId] = useState("");
  const [manualPayload, setManualPayload] = useState("");
  const [message, setMessage] = useState("");
  const [ok, setOk] = useState<boolean | null>(null);
  const [isPending, startTransition] = useTransition();
  const scannerRef = useRef<QrScanner | null>(null);

  const verifyPayload = useCallback((payload: string) => {
    startTransition(async () => {
      const result = await verifyQrAttendanceAction(payload);
      setOk(result.ok);
      setMessage(result.message);
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
        setMessage("");
        setOk(null);

        await scanner.start(
          selectedCameraId,
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
      if (scannerRef.current === scanner) {
        scannerRef.current = null;
      }
      void clearScanner(scanner);
    };
  }, [active, cameraId, verifyPayload]);

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
                <Button type="button" variant="outline" onClick={switchCamera} disabled={cameras.length < 2}>
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
