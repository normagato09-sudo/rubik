"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { CameraIcon } from "@/components/ui/icons";
import { CUBE_COLOR_HEX } from "@/features/cube/palette";
import type { CubeColor } from "@/features/cube/types";
import { SKEWB_COLORS, SKEWB_FACE_LABELS, skewbColorCounts, type SkewbFacelets } from "@/features/skewb/facelets";
import {
  SKEWB_FACE_ORDER,
  classifySkewbFace,
  sampleSkewbFace,
  skewbFaceletsFromScans,
  skewbStickerMiddles,
  type ScannedSkewbFaces,
} from "@/features/skewb/scan";
import {
  GUIDE_FRACTION,
  calibrate,
  createStabilityTracker,
  emptyCalibration,
  guideSquare,
  isNewFace,
  looksLikeSticker,
  type Calibration,
  type Rgb,
} from "../color-scan";
import { ACCENT, ColorPalette } from "./face-guide";
import { SKEWB_FACE_HINTS, SkewbFaceEditor, skewbStickerLabel } from "./skewb-face";
import { drawScaled, snapshotOf, useCamera } from "./use-camera";

const ANALYSIS_EVERY_MS = 120;
const HOLD_MS = 1000;

type Review = {
  stickers: (CubeColor | null)[];
  unsure: boolean[];
  samples: Rgb[];
  /** The guide's square of the frame, as a data URL: stays on the device. */
  snapshot: string;
};

/**
 * Reads the 6 faces of a Skewb with the camera (or one photo per face), in
 * the manual editor's order and orientation, inside the square guide with
 * the center's diamond drawn in. Each capture is shown big to be
 * corrected; after the sixth face the stickers go to the editor, whose
 * validation checks the whole Skewb. Its centers move, so there is no
 * fixed sticker to calibrate with: colors are compared with the faces
 * already confirmed, and the doubtful ones get a "?".
 */
export function SkewbCamera({ onDone }: { onDone: (facelets: SkewbFacelets) => void }) {
  const [index, setIndex] = useState(0);
  const [scans, setScans] = useState<ScannedSkewbFaces>({});
  const [calibration, setCalibration] = useState<Calibration>(emptyCalibration);
  const [review, setReview] = useState<Review | null>(null);
  const [brush, setBrush] = useState<CubeColor | null>("white");
  /** What each sticker reads right now; null where there is no sticker in view. */
  const [live, setLive] = useState<(CubeColor | null)[] | null>(null);
  const [progress, setProgress] = useState(0);
  const [announce, setAnnounce] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const tracker = useRef(createStabilityTracker(HOLD_MS));
  const camera = useCamera(videoRef);

  const face = SKEWB_FACE_ORDER[index];
  const previous = index > 0 ? scans[SKEWB_FACE_ORDER[index - 1]] : undefined;
  const reviewing = review !== null;

  const openReview = useCallback(
    (samples: Rgb[], canvas: HTMLCanvasElement) => {
      const classified = classifySkewbFace(samples, calibration);
      setReview({
        stickers: classified.map((c) => c.color),
        unsure: classified.map((c) => c.unsure),
        samples,
        snapshot: snapshotOf(canvas, GUIDE_FRACTION),
      });
      setLive(null);
      setProgress(0);
      tracker.current.reset();
      const doubts = classified.filter((c) => c.unsure).length;
      setAnnounce(
        `Cara ${SKEWB_FACE_LABELS[face]} capturada.${doubts ? ` Revisa ${doubts} pegatina${doubts > 1 ? "s" : ""} marcada${doubts > 1 ? "s" : ""} con interrogación.` : ""}`,
      );
    },
    [face, calibration],
  );

  const readFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2 || !video.videoWidth) return null;
    return sampleSkewbFace(drawScaled(video, video.videoWidth, video.videoHeight, canvas));
  }, []);

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
      const colors = classifySkewbFace(samples, calibration).map((c) => c.color);
      const stickers = samples.map(looksLikeSticker);
      setLive(colors.map((color, i) => (stickers[i] ? color : null)));
      // No Skewb filling the guide, or the previous face still in view: wait.
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
      const samples = sampleSkewbFace(drawScaled(image, image.naturalWidth, image.naturalHeight, canvas));
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
    setAnnounce(`Vuelve a enseñar la cara ${SKEWB_FACE_LABELS[face]}.`);
  };

  const next = () => {
    if (!review) return;
    const nextScans = { ...scans, [face]: review.stickers };
    // What the user confirmed is this Skewb under this light: the best reference.
    setCalibration(calibrate(calibration, review.samples, review.stickers));
    setScans(nextScans);
    setReview(null);
    if (index === SKEWB_FACE_ORDER.length - 1) {
      onDone(skewbFaceletsFromScans(nextScans));
      return;
    }
    setIndex(index + 1);
    setAnnounce(`Ahora la cara ${SKEWB_FACE_LABELS[SKEWB_FACE_ORDER[index + 1]]}.`);
  };

  const counts = skewbColorCounts(skewbFaceletsFromScans(review ? { ...scans, [face]: review.stickers } : scans));

  return (
    <div className="flex flex-col gap-4">
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
      <canvas ref={canvasRef} className="hidden" aria-hidden />
      <input ref={photoRef} type="file" accept="image/*" capture="environment" className="sr-only" tabIndex={-1} aria-hidden onChange={onFile} />
      <input ref={galleryRef} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden onChange={onFile} />

      <ol className="flex items-center justify-center gap-2" aria-label="Progreso">
        {SKEWB_FACE_ORDER.map((name, i) => {
          const done = scans[name] !== undefined;
          return (
            <li
              key={name}
              className="h-3 w-3 rounded-full border-2"
              style={{ borderColor: i === index ? ACCENT : "var(--navy-border)", backgroundColor: done ? ACCENT : "transparent" }}
              aria-label={`${SKEWB_FACE_LABELS[name]}: ${done ? "leída" : i === index ? "ahora" : "pendiente"}`}
            />
          );
        })}
      </ol>

      <div className="flex flex-col items-center text-center">
        <h2 ref={headingRef} tabIndex={-1} className="text-lg font-semibold outline-none">
          {review ? "Cara detectada: " : ""}
          {SKEWB_FACE_LABELS[face]}
        </h2>
        <span className="text-xs text-navy-muted tabular-nums">
          Cara {index + 1} de {SKEWB_FACE_ORDER.length}
        </span>
      </div>

      {/* Kept mounted during the review, so the next face starts without reopening the camera. */}
      <div className={review ? "hidden" : "flex flex-col gap-3"}>
        <p className="text-sm text-navy-muted">{SKEWB_FACE_HINTS[face]}</p>

        <div
          className={`relative mx-auto aspect-square w-full max-w-[360px] overflow-hidden rounded-3xl bg-black ${camera.status === "off" ? "hidden" : ""}`}
        >
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover"
            playsInline
            muted
            aria-label={`Vista de la cámara: enseña la cara ${SKEWB_FACE_LABELS[face].toLowerCase()} dentro del cuadrado`}
          />
          <SquareOverlay live={live} progress={progress} />
          {camera.status === "starting" && (
            <p className="absolute inset-x-0 bottom-3 text-center text-sm text-white/80">Abriendo la cámara…</p>
          )}
        </div>

        {camera.status === "off" && (
          <div className="flex flex-col gap-3 rounded-2xl border border-navy-border bg-navy-2 px-4 py-3 text-sm" role="status">
            <p className="text-foreground">{camera.message}</p>
            <p className="text-navy-muted">Encuadra solo esa cara, centrada y de frente, ocupando buena parte de la foto.</p>
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
              Foto de la cara {SKEWB_FACE_LABELS[face].toLowerCase()}
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
            Se captura sola cuando los 5 colores se mantienen un segundo. Ajusta la cara al cuadrado: el rombo del
            centro, sobre el rombo dibujado.
          </p>
        )}
      </div>

      {review && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-navy-muted">
            Comprueba que coincide con tu Skewb. Toca una pegatina para cambiarla por el color elegido abajo
            {review.unsure.some(Boolean) ? "; las marcadas con ? son las dudosas" : ""}.
          </p>
          <div className="flex items-center justify-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- local data URL, never uploaded */}
            <img src={review.snapshot} alt="Foto capturada de la cara" className="h-16 w-16 rounded-xl border border-navy-border object-cover" />
            <span className="text-xs text-navy-muted">Foto capturada (no sale de tu dispositivo)</span>
          </div>
          <SkewbFaceEditor
            face={face}
            colors={review.stickers}
            flags={review.unsure.map((unsure) => (unsure ? "unsure" : null))}
            onPaint={paint}
            labelOf={(n) => skewbStickerLabel(n, review.stickers[n], review.unsure[n] ? ", dudosa" : "")}
          />
          <ColorPalette brush={brush} onBrush={setBrush} counts={counts} colors={SKEWB_COLORS} perColor={5} />
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
              {index === SKEWB_FACE_ORDER.length - 1 ? "Terminar y revisar" : "Siguiente cara"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * The guide square over the video — the same share of the picture that is
 * sampled — with the center's diamond and a dot with the color read live
 * in each of the 5 stickers.
 */
function SquareOverlay({ live, progress }: { live: (CubeColor | null)[] | null; progress: number }) {
  const square = guideSquare(100, 100);
  const { x, y, size } = square;
  const m = [x + size / 2, y + size / 2];
  const middles = skewbStickerMiddles(square);
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
        <rect
          x={x}
          y={y}
          width={size}
          height={size}
          rx={2}
          fill="none"
          stroke={progress > 0 ? ACCENT : "rgb(255 255 255 / 85%)"}
          strokeWidth={0.8}
        />
        <polygon
          points={`${m[0]},${y} ${x + size},${m[1]} ${m[0]},${y + size} ${x},${m[1]}`}
          fill="none"
          stroke="rgb(255 255 255 / 50%)"
          strokeWidth={0.35}
          strokeLinejoin="round"
        />
        {middles.map(([cx, cy], n) => {
          const color = live?.[n];
          return color ? (
            <circle key={n} cx={cx} cy={cy} r={2.2} fill={CUBE_COLOR_HEX[color]} stroke="rgb(0 0 0 / 50%)" strokeWidth={0.6} />
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
