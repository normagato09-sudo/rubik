"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { CameraIcon } from "@/components/ui/icons";
import { CUBE_COLOR_HEX } from "@/features/cube/palette";
import { PYRA_FACE_LABELS, pyraColorCounts, type PyraFacelets } from "@/features/pyraminx/facelets";
import type { PyraFace } from "@/features/pyraminx/geometry";
import { PYRA_COLORS, type PyraColor } from "@/features/pyraminx/moves";
import {
  PYRA_FACE_ORDER,
  PYRA_GUIDE_FRACTION,
  classifyPyraFace,
  isUpsideDown,
  pyraFaceletsFromScans,
  pyraTriangle,
  samplePyraFace,
  stickerMiddles,
  type ScannedPyraFaces,
} from "@/features/pyraminx/scan";
import {
  calibrate,
  createStabilityTracker,
  emptyCalibration,
  isNewFace,
  looksLikeSticker,
  type Calibration,
  type Rgb,
} from "../color-scan";
import { ACCENT, ColorPalette } from "./face-guide";
import { PYRA_FACE_HINTS, PyraFaceEditor, pyraStickerLabel } from "./pyraminx-face";
import { drawScaled, snapshotOf, useCamera } from "./use-camera";

const ANALYSIS_EVERY_MS = 120;
const HOLD_MS = 1000;

type Review = {
  stickers: (PyraColor | null)[];
  unsure: boolean[];
  samples: Rgb[];
  /** The guide's square of the frame, as a data URL: stays on the device. */
  snapshot: string;
};

/**
 * Reads the 4 faces of a Pyraminx with the camera (or one photo per face),
 * in the manual editor's order and orientation, inside a triangular guide.
 * Each capture is shown big to be corrected; after the fourth face the
 * stickers go to the editor, whose validation checks the whole Pyraminx.
 * There is no fixed sticker to calibrate with: colors are compared with
 * the faces already confirmed, and the doubtful ones get a "?".
 */
export function PyraminxCamera({ onDone }: { onDone: (facelets: PyraFacelets) => void }) {
  const [index, setIndex] = useState(0);
  const [scans, setScans] = useState<ScannedPyraFaces>({});
  const [calibration, setCalibration] = useState<Calibration>(emptyCalibration);
  const [review, setReview] = useState<Review | null>(null);
  const [brush, setBrush] = useState<PyraColor | null>("green");
  /** What each sticker reads right now; null where there is no sticker in view. */
  const [live, setLive] = useState<(PyraColor | null)[] | null>(null);
  const [progress, setProgress] = useState(0);
  const [announce, setAnnounce] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const tracker = useRef(createStabilityTracker(HOLD_MS));
  const camera = useCamera(videoRef);

  const face = PYRA_FACE_ORDER[index];
  const upsideDown = isUpsideDown(face);
  const previous = index > 0 ? scans[PYRA_FACE_ORDER[index - 1]] : undefined;
  const reviewing = review !== null;

  const openReview = useCallback(
    (samples: Rgb[], canvas: HTMLCanvasElement) => {
      const classified = classifyPyraFace(samples, calibration);
      setReview({
        stickers: classified.map((c) => c.color),
        unsure: classified.map((c) => c.unsure),
        samples,
        snapshot: snapshotOf(canvas, PYRA_GUIDE_FRACTION),
      });
      setLive(null);
      setProgress(0);
      tracker.current.reset();
      const doubts = classified.filter((c) => c.unsure).length;
      setAnnounce(
        `Cara ${PYRA_FACE_LABELS[face]} capturada.${doubts ? ` Revisa ${doubts} pegatina${doubts > 1 ? "s" : ""} marcada${doubts > 1 ? "s" : ""} con interrogación.` : ""}`,
      );
    },
    [face, calibration],
  );

  const readFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2 || !video.videoWidth) return null;
    return samplePyraFace(drawScaled(video, video.videoWidth, video.videoHeight, canvas), upsideDown);
  }, [upsideDown]);

  const capture = useCallback(() => {
    const samples = readFrame();
    if (samples) openReview(samples, canvasRef.current!);
  }, [readFrame, openReview]);

  // Live reading: shows what each sticker looks like and captures once it holds still.
  useEffect(() => {
    if (camera.status !== "live" || reviewing) return;
    const timer = window.setInterval(() => {
      const samples = readFrame();
      if (!samples) return;
      const colors = classifyPyraFace(samples, calibration).map((c) => c.color);
      const stickers = samples.map(looksLikeSticker);
      setLive(colors.map((color, i) => (stickers[i] ? color : null)));
      // No Pyraminx filling the guide, or the previous face still in view: wait.
      if (!stickers.every(Boolean) || !isNewFace(colors, previous)) {
        tracker.current.reset();
        setProgress(0);
        return;
      }
      const now = performance.now();
      if (tracker.current.push(colors, now)) openReview(samples, canvasRef.current!);
      else setProgress(tracker.current.progress(now));
    }, ANALYSIS_EVERY_MS);
    return () => window.clearInterval(timer);
  }, [camera.status, reviewing, calibration, previous, readFrame, openReview]);

  // Move focus to what changed, so keyboards and screen readers follow along.
  useEffect(() => {
    headingRef.current?.focus();
  }, [reviewing, index]);

  const onFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const canvas = canvasRef.current!;
      const samples = samplePyraFace(drawScaled(image, image.naturalWidth, image.naturalHeight, canvas), upsideDown);
      URL.revokeObjectURL(url);
      openReview(samples, canvas);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      setAnnounce("No se ha podido abrir esa imagen. Prueba con otra foto.");
    };
    image.src = url;
  };

  const paint = (n: number) => {
    if (!review) return;
    setReview({
      ...review,
      stickers: review.stickers.map((color, k) => (k === n ? brush : color)),
      unsure: review.unsure.map((flag, k) => (k === n ? false : flag)),
    });
  };

  const retake = () => {
    setReview(null);
    setAnnounce(`Vuelve a enseñar la cara ${PYRA_FACE_LABELS[face]}.`);
  };

  const next = () => {
    if (!review) return;
    const nextScans = { ...scans, [face]: review.stickers };
    // What the user confirmed is this Pyraminx under this light: the best reference.
    setCalibration(calibrate(calibration, review.samples, review.stickers));
    setScans(nextScans);
    setReview(null);
    if (index === PYRA_FACE_ORDER.length - 1) {
      onDone(pyraFaceletsFromScans(nextScans));
      return;
    }
    setIndex(index + 1);
    setAnnounce(`Ahora la cara ${PYRA_FACE_LABELS[PYRA_FACE_ORDER[index + 1]]}.`);
  };

  const counts = pyraColorCounts(pyraFaceletsFromScans(review ? { ...scans, [face]: review.stickers } : scans));

  return (
    <div className="flex flex-col gap-4">
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
      <canvas ref={canvasRef} className="hidden" aria-hidden />
      <input ref={photoRef} type="file" accept="image/*" capture="environment" className="sr-only" tabIndex={-1} aria-hidden onChange={onFile} />
      <input ref={galleryRef} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden onChange={onFile} />

      <ol className="flex items-center justify-center gap-2" aria-label="Progreso">
        {PYRA_FACE_ORDER.map((name, i) => {
          const done = scans[name] !== undefined;
          return (
            <li
              key={name}
              className="h-3 w-3 rounded-full border-2"
              style={{ borderColor: i === index ? ACCENT : "var(--navy-border)", backgroundColor: done ? ACCENT : "transparent" }}
              aria-label={`${PYRA_FACE_LABELS[name]}: ${done ? "leída" : i === index ? "ahora" : "pendiente"}`}
            />
          );
        })}
      </ol>

      <div className="flex flex-col items-center text-center">
        <h2 ref={headingRef} tabIndex={-1} className="text-lg font-semibold outline-none">
          {review ? "Cara detectada: " : ""}
          {PYRA_FACE_LABELS[face]}
        </h2>
        <span className="text-xs text-navy-muted tabular-nums">
          Cara {index + 1} de {PYRA_FACE_ORDER.length}
        </span>
      </div>

      {/* Kept mounted during the review, so the next face starts without reopening the camera. */}
      <div className={review ? "hidden" : "flex flex-col gap-3"}>
        <p className="text-sm text-navy-muted">{PYRA_FACE_HINTS[face]}</p>

        <div
          className={`relative mx-auto aspect-square w-full max-w-[360px] overflow-hidden rounded-3xl bg-black ${camera.status === "off" ? "hidden" : ""}`}
        >
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover"
            playsInline
            muted
            aria-label={`Vista de la cámara: enseña la cara ${PYRA_FACE_LABELS[face].toLowerCase()} dentro del triángulo`}
          />
          <TriangleOverlay face={face} live={live} progress={progress} />
          {camera.status === "starting" && (
            <p className="absolute inset-x-0 bottom-3 text-center text-sm text-white/80">Abriendo la cámara…</p>
          )}
        </div>

        {camera.status === "off" && (
          <div className="flex flex-col gap-3 rounded-2xl border border-navy-border bg-navy-2 px-4 py-3 text-sm" role="status">
            <p className="text-foreground">{camera.message}</p>
            <p className="text-navy-muted">
              Encuadra solo esa cara, centrada y de frente, {upsideDown ? "con una punta abajo" : "con una punta arriba"}, ocupando buena parte de la foto.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {camera.status !== "off" ? (
            <button
              type="button"
              onClick={capture}
              disabled={camera.status !== "live"}
              className="flex h-13 items-center justify-center gap-2 rounded-2xl text-base font-semibold text-navy transition-all active:scale-[0.98] disabled:opacity-40"
              style={{ backgroundColor: ACCENT }}
            >
              <CameraIcon className="h-5 w-5" />
              Capturar
            </button>
          ) : (
            <button
              type="button"
              onClick={() => photoRef.current?.click()}
              className="flex h-13 items-center justify-center gap-2 rounded-2xl text-base font-semibold text-navy transition-all active:scale-[0.98]"
              style={{ backgroundColor: ACCENT }}
            >
              <CameraIcon className="h-5 w-5" />
              Foto de la cara {PYRA_FACE_LABELS[face].toLowerCase()}
            </button>
          )}
          <button
            type="button"
            onClick={() => galleryRef.current?.click()}
            className="h-12 rounded-2xl bg-navy-2 text-sm font-medium text-foreground transition-colors hover:bg-navy-3"
          >
            Elegir de la galería
          </button>
        </div>
        {camera.status === "live" && (
          <p className="text-center text-xs text-navy-muted">
            Se captura sola cuando los 9 colores se mantienen un segundo. Ajusta la cara al triángulo: sus puntas, en las esquinas.
          </p>
        )}
      </div>

      {review && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-navy-muted">
            Comprueba que coincide con tu Pyraminx. Toca una pegatina para cambiarla por el color elegido abajo
            {review.unsure.some(Boolean) ? "; las marcadas con ? son las dudosas" : ""}.
          </p>
          <div className="flex items-center justify-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- local data URL, never uploaded */}
            <img src={review.snapshot} alt="Foto capturada de la cara" className="h-16 w-16 rounded-xl border border-navy-border object-cover" />
            <span className="text-xs text-navy-muted">Foto capturada (no sale de tu dispositivo)</span>
          </div>
          <PyraFaceEditor
            face={face}
            colors={review.stickers}
            flags={review.unsure.map((unsure) => (unsure ? "unsure" : null))}
            onPaint={paint}
            labelOf={(n) => pyraStickerLabel(n, review.stickers[n], review.unsure[n] ? ", dudosa" : "")}
          />
          <ColorPalette brush={brush} onBrush={setBrush} counts={counts} colors={PYRA_COLORS} />
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={retake} className="h-13 rounded-2xl bg-navy-2 text-sm font-medium text-foreground hover:bg-navy-3">
              Repetir foto
            </button>
            <button
              type="button"
              onClick={next}
              className="h-13 rounded-2xl text-sm font-semibold text-navy transition-all active:scale-[0.98]"
              style={{ backgroundColor: ACCENT }}
            >
              {index === PYRA_FACE_ORDER.length - 1 ? "Terminar y revisar" : "Siguiente cara"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * The guide triangle over the video — the same share of the picture that
 * is sampled — with its 9 stickers and a dot with the color read live in
 * each one. Upside down for the bottom face, as it is seen.
 */
function TriangleOverlay({ face, live, progress }: { face: PyraFace; live: (PyraColor | null)[] | null; progress: number }) {
  const triangle = pyraTriangle(100, 100, isUpsideDown(face));
  const middles = stickerMiddles(triangle);
  const inner = Array.from({ length: 9 }, (_, n) => n);
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
        <polygon
          points={triangle.map(([x, y]) => `${x},${y}`).join(" ")}
          fill="none"
          stroke={progress > 0 ? ACCENT : "rgb(255 255 255 / 85%)"}
          strokeWidth={0.8}
          strokeLinejoin="round"
        />
        {/* The lines between stickers: the triangle cut in thirds along each side. */}
        {[1, 2].flatMap((k) => {
          const [a, b, c] = triangle;
          const at = (p: readonly number[], q: readonly number[], t: number) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
          return [
            [at(a, b, k / 3), at(a, c, k / 3)],
            [at(b, a, k / 3), at(b, c, k / 3)],
            [at(c, a, k / 3), at(c, b, k / 3)],
          ].map(([p, q], j) => (
            <line key={`${k}-${j}`} x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} stroke="rgb(255 255 255 / 50%)" strokeWidth={0.35} />
          ));
        })}
        {inner.map((n) => {
          const color = live?.[n];
          return color ? (
            <circle key={n} cx={middles[n][0]} cy={middles[n][1]} r={2.2} fill={CUBE_COLOR_HEX[color]} stroke="rgb(0 0 0 / 50%)" strokeWidth={0.6} />
          ) : null;
        })}
      </svg>
      {progress > 0 && (
        <div className="absolute inset-x-0 bottom-0 h-1.5 bg-black/40">
          <div className="h-full" style={{ width: `${progress * 100}%`, backgroundColor: ACCENT }} />
        </div>
      )}
    </div>
  );
}
