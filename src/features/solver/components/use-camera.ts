"use client";

import { useEffect, useState, type RefObject } from "react";

/** Frames are analysed at this size (short side, px): plenty for 9 samples, cheap on phones. */
export const ANALYSIS_SIZE = 180;

export type Camera =
  | { status: "starting" }
  | { status: "live" }
  | { status: "off"; message: string };

const cameraError = (error: unknown) => {
  const name = error instanceof DOMException ? error.name : "";
  if (name === "NotAllowedError" || name === "SecurityError")
    return "No hay permiso para usar la cámara. Puedes darlo en los ajustes del navegador o hacer una foto de cada cara.";
  if (name === "NotFoundError" || name === "OverconstrainedError")
    return "No se ha encontrado ninguna cámara. Haz una foto de cada cara o elige una de la galería.";
  if (name === "NotSupportedError")
    return "Este navegador no deja usar la cámara aquí. Haz una foto de cada cara o elige una de la galería.";
  if (name === "NotReadableError")
    return "La cámara está siendo usada por otra aplicación. Ciérrala o haz una foto de cada cara.";
  return "No se ha podido abrir la cámara. Haz una foto de cada cara o elige una de la galería.";
};

/** Draws `source` scaled so its short side is ANALYSIS_SIZE and returns its pixels. */
export function drawScaled(source: CanvasImageSource, width: number, height: number, canvas: HTMLCanvasElement) {
  const scale = ANALYSIS_SIZE / Math.min(width, height);
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const context = canvas.getContext("2d", { willReadFrequently: true })!;
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  return context.getImageData(0, 0, canvas.width, canvas.height);
}

/** The middle square of what is on `canvas` (`fraction` of its short side), as a small JPEG for the review. */
export function snapshotOf(canvas: HTMLCanvasElement, fraction: number) {
  const size = Math.min(canvas.width, canvas.height) * fraction;
  const out = document.createElement("canvas");
  out.width = out.height = 120;
  out
    .getContext("2d")!
    .drawImage(canvas, (canvas.width - size) / 2, (canvas.height - size) / 2, size, size, 0, 0, 120, 120);
  return out.toDataURL("image/jpeg", 0.8);
}

/**
 * The rear camera in `videoRef`, only while the screen using it is
 * mounted and the page is visible (it is stopped when the tab is hidden
 * and reopened when it comes back).
 */
export function useCamera(videoRef: RefObject<HTMLVideoElement | null>): Camera {
  const [camera, setCamera] = useState<Camera>({ status: "starting" });
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const onVisibility = () => {
      const shown = document.visibilityState === "visible";
      setVisible(shown);
      if (shown) setCamera({ status: "starting" });
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const video = videoRef.current;
    let stream: MediaStream | null = null;
    let cancelled = false;
    const open = async () => {
      // Not over HTTPS, or an old browser: same way out as a denied permission.
      if (!navigator.mediaDevices?.getUserMedia) throw new DOMException("", "NotSupportedError");
      return navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
    };
    open()
      .then(async (media) => {
        if (cancelled) {
          media.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = media;
        if (video) {
          video.srcObject = media;
          await video.play().catch(() => {});
        }
        if (!cancelled) setCamera({ status: "live" });
      })
      .catch((error) => {
        if (!cancelled) setCamera({ status: "off", message: cameraError(error) });
      });
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((track) => track.stop());
      if (video) video.srcObject = null;
    };
  }, [visible, videoRef]);

  return camera;
}
