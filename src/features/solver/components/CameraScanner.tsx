"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { CameraIcon } from "@/components/ui/icons";
import { CUBE_COLOR_HEX } from "@/features/cube/palette";
import type { CubeColor } from "@/features/cube/types";
import {
  GUIDE_FRACTION,
  calibrate,
  centerFits,
  classifyColor,
  classifyFace,
  classifyFace2x2,
  createStabilityTracker,
  emptyCalibration,
  isNewFace,
  looksLikeSticker,
  sampleFace,
  type Calibration,
  type Rgb,
  type ScannedFaces,
} from "../color-scan";
import type { FaceName } from "../cubie";
import { CENTER_COLORS, COLOR_NAMES, FACE_LABELS, neighborFace, type Facelets } from "../facelets";
import { ACCENT, ColorPalette, FACE_ORDER, FaceFrame, HOLD_2X2, REFERENCE_MARK, StickerButton } from "./face-guide";
import type { Puzzle } from "./puzzles";
import { drawScaled, snapshotOf as snapshotSquare, useCamera } from "./use-camera";

const snapshotOf = (canvas: HTMLCanvasElement) => snapshotSquare(canvas, GUIDE_FRACTION);

const ANALYSIS_EVERY_MS = 120;
const HOLD_MS = 1000;

type Review = {
  stickers: (CubeColor | null)[];
  unsure: boolean[];
  samples: Rgb[];
  /** The center in the picture reads as another color (null = it looks right, or a 2×2). */
  centerLooks: CubeColor | null;
  /** The guide square of the frame, as a data URL: stays on the device. */
  snapshot: string;
};

/** The editor's stickers from the faces read so far (each read row by row, held as the hints say). */
function faceletsFromScans(puzzle: Puzzle, scans: ScannedFaces): Facelets {
  const facelets = puzzle.empty();
  for (const face of FACE_ORDER) {
    scans[face]?.forEach((color, i) => {
      const index = puzzle.offset(face) + i;
      if (!puzzle.isFixed(index)) facelets[index] = color;
    });
  }
  return facelets;
}

/**
 * Reads the six faces with the camera (or one photo per face), in the
 * manual editor's order and orientation. Each capture is shown big to be
 * corrected; after the sixth face the stickers go to the editor, whose
 * validation checks the whole cube. A 2×2 has no centers: its colors are
 * compared with the faces already confirmed, and the doubtful ones get a "?".
 */
export function CameraScanner({ puzzle, onDone }: { puzzle: Puzzle; onDone: (facelets: Facelets) => void }) {
  const size = puzzle.size;
  /** The fixed center of a face's grid (3×3 only). */
  const centerCell = size === 3 ? 4 : -1;
  const [index, setIndex] = useState(0);
  const [scans, setScans] = useState<ScannedFaces>({});
  const [calibration, setCalibration] = useState<Calibration>(emptyCalibration);
  const [review, setReview] = useState<Review | null>(null);
  const [brush, setBrush] = useState<CubeColor | null>("white");
  /** What each cell reads right now; null where there is no sticker in view. */
  const [live, setLive] = useState<(CubeColor | null)[] | null>(null);
  const [progress, setProgress] = useState(0);
  const [announce, setAnnounce] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  /** Takes a photo with the phone's camera app. */
  const photoRef = useRef<HTMLInputElement>(null);
  /** Picks an existing picture (capture would skip the gallery on Android). */
  const galleryRef = useRef<HTMLInputElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const tracker = useRef(createStabilityTracker(HOLD_MS));
  const camera = useCamera(videoRef);

  const face = FACE_ORDER[index];
  const scanned = useMemo(() => FACE_ORDER.filter((name) => scans[name] !== undefined), [scans]);
  const previous = index > 0 ? scans[FACE_ORDER[index - 1]] : undefined;
  const reviewing = review !== null;

  const classify = useCallback(
    (samples: Rgb[]) => (size === 3 ? classifyFace(samples, face, calibration) : classifyFace2x2(samples, calibration)),
    [size, face, calibration],
  );

  const openReview = useCallback(
    (samples: Rgb[], canvas: HTMLCanvasElement) => {
      const classified = classify(samples);
      const looks = size === 3 ? classifyColor(samples[4], calibration).color : null;
      setReview({
        stickers: classified.map((c) => c.color),
        unsure: classified.map((c) => c.unsure),
        samples,
        centerLooks: looks === null || looks === CENTER_COLORS[face] ? null : looks,
        snapshot: snapshotOf(canvas),
      });
      setLive(null);
      setProgress(0);
      tracker.current.reset();
      const doubts = classified.filter((c) => c.unsure).length;
      setAnnounce(
        `Cara ${FACE_LABELS[face]} capturada.${doubts ? ` Revisa ${doubts} pegatina${doubts > 1 ? "s" : ""} marcada${doubts > 1 ? "s" : ""} con interrogación.` : ""}`,
      );
    },
    [face, calibration, classify, size],
  );

  /** Reads the current video frame; returns its samples, or null if there is no frame yet. */
  const readFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2 || !video.videoWidth) return null;
    const image = drawScaled(video, video.videoWidth, video.videoHeight, canvas);
    return sampleFace(image, undefined, size);
  }, [size]);

  const capture = useCallback(() => {
    const samples = readFrame();
    if (samples) openReview(samples, canvasRef.current!);
  }, [readFrame, openReview]);

  // Live reading: shows what each cell looks like and captures once it holds still.
  useEffect(() => {
    if (camera.status !== "live" || reviewing) return;
    const timer = window.setInterval(() => {
      const samples = readFrame();
      if (!samples) return;
      const colors = classify(samples).map((c) => c.color);
      const stickers = samples.map(looksLikeSticker);
      setLive(colors.map((color, i) => (stickers[i] ? color : null)));
      // No cube filling the grid, or the previous face still in view: wait.
      const fresh =
        size === 3 ? centerFits(samples[4], face, calibration, scanned) : isNewFace(colors, previous);
      if (!stickers.every(Boolean) || !fresh) {
        tracker.current.reset();
        setProgress(0);
        return;
      }
      const now = performance.now();
      if (tracker.current.push(colors, now)) openReview(samples, canvasRef.current!);
      else setProgress(tracker.current.progress(now));
    }, ANALYSIS_EVERY_MS);
    return () => window.clearInterval(timer);
  }, [camera.status, reviewing, face, calibration, scanned, previous, size, classify, readFrame, openReview]);

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
      const samples = sampleFace(drawScaled(image, image.naturalWidth, image.naturalHeight, canvas), undefined, size);
      URL.revokeObjectURL(url);
      openReview(samples, canvas);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      setAnnounce("No se ha podido abrir esa imagen. Prueba con otra foto.");
    };
    image.src = url;
  };

  const paint = (i: number) => {
    if (!review || i === centerCell) return;
    setReview({
      ...review,
      stickers: review.stickers.map((color, n) => (n === i ? brush : color)),
      unsure: review.unsure.map((flag, n) => (n === i ? false : flag)),
    });
  };

  const retake = () => {
    setReview(null);
    setAnnounce(`Vuelve a enseñar la cara ${FACE_LABELS[face]}.`);
  };

  const next = () => {
    if (!review) return;
    const nextScans = { ...scans, [face]: review.stickers };
    // What the user confirmed is this cube under this light: the best reference.
    setCalibration(calibrate(calibration, review.samples, review.stickers));
    setScans(nextScans);
    setReview(null);
    if (index === FACE_ORDER.length - 1) {
      onDone(faceletsFromScans(puzzle, nextScans));
      return;
    }
    setIndex(index + 1);
    setAnnounce(`Ahora la cara ${FACE_LABELS[FACE_ORDER[index + 1]]}.`);
  };

  const counts = puzzle.counts(faceletsFromScans(puzzle, review ? { ...scans, [face]: review.stickers } : scans));
  const center = CENTER_COLORS[face];
  const guide = size === 2 ? REFERENCE_MARK[face] : undefined;

  return (
    <div className="flex flex-col gap-4">
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
      <canvas ref={canvasRef} className="hidden" aria-hidden />
      <input
        ref={photoRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={onFile}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={onFile}
      />

      <ol className="flex items-center justify-center gap-2" aria-label="Progreso">
        {FACE_ORDER.map((name, i) => {
          const done = scans[name] !== undefined;
          return (
            <li
              key={name}
              className="h-3 w-3 rounded-full border-2"
              style={{
                borderColor: i === index ? ACCENT : "var(--navy-border)",
                backgroundColor: done ? (size === 3 ? CUBE_COLOR_HEX[CENTER_COLORS[name]] : ACCENT) : "transparent",
              }}
              aria-label={`${FACE_LABELS[name]}: ${done ? "leída" : i === index ? "ahora" : "pendiente"}`}
            />
          );
        })}
      </ol>

      <div className="flex flex-col items-center text-center">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="text-lg font-semibold outline-none"
        >
          {review ? "Cara detectada: " : ""}
          {FACE_LABELS[face]}
          {size === 3 && (
            <>
              {" "}
              <span className="text-sm font-normal text-navy-muted">· centro {COLOR_NAMES[center]}</span>
            </>
          )}
        </h2>
        <span className="text-xs text-navy-muted tabular-nums">Cara {index + 1} de 6</span>
      </div>

      {/* Kept mounted during the review, so the next face starts without reopening the camera. */}
      <div className={review ? "hidden" : "flex flex-col gap-3"}>
        {size === 2 && index === 0 && <p className="text-sm font-semibold text-foreground">{HOLD_2X2}</p>}
        <p className="text-sm text-navy-muted">{puzzle.hints[face]}</p>

        <div
          className={`relative mx-auto aspect-square w-full max-w-[360px] overflow-hidden rounded-3xl bg-black ${
            camera.status === "off" ? "hidden" : ""
          }`}
        >
            <video
              ref={videoRef}
              className="absolute inset-0 h-full w-full object-cover"
              playsInline
              muted
              aria-label={
                size === 3
                  ? `Vista de la cámara: enseña la cara con centro ${COLOR_NAMES[center]}`
                  : `Vista de la cámara: enseña la cara ${FACE_LABELS[face].toLowerCase()}`
              }
            />
            <GuideOverlay face={face} size={size} live={live} progress={progress} />
          {camera.status === "starting" && (
            <p className="absolute inset-x-0 bottom-3 text-center text-sm text-white/80">Abriendo la cámara…</p>
          )}
        </div>

        {camera.status === "off" && (
          <div className="flex flex-col gap-3 rounded-2xl border border-navy-border bg-navy-2 px-4 py-3 text-sm" role="status">
            <p className="text-foreground">{camera.message}</p>
            <p className="text-navy-muted">
              Encuadra solo esa cara, centrada y de frente, ocupando buena parte de la foto.
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
              Foto de la cara {FACE_LABELS[face].toLowerCase()}
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
            Se captura sola cuando los {puzzle.perFace} colores se mantienen un segundo.
          </p>
        )}
      </div>

      {review && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-navy-muted">
            Comprueba que coincide con tu cubo. Toca una pegatina para cambiarla por el color elegido abajo
            {review.unsure.some(Boolean) ? "; las marcadas con ? son las dudosas" : ""}.
          </p>
          {review.centerLooks && (
            <p
              role="alert"
              className="rounded-2xl border border-cube-red/40 bg-cube-red/10 px-4 py-3 text-sm text-foreground"
            >
              El centro de la foto parece {COLOR_NAMES[review.centerLooks]}, no {COLOR_NAMES[center]}. Si no es la
              cara {FACE_LABELS[face].toLowerCase()}, pulsa Repetir foto.
            </p>
          )}
          <div className="flex items-center justify-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- local data URL, never uploaded */}
            <img
              src={review.snapshot}
              alt="Foto capturada de la cara"
              className="h-16 w-16 rounded-xl border border-navy-border object-cover"
            />
            <span className="text-xs text-navy-muted">Foto capturada (no sale de tu dispositivo)</span>
          </div>
          <FaceFrame face={face} size={size}>
            {review.stickers.map((color, i) => (
              <StickerButton
                key={i}
                color={color}
                center={i === centerCell}
                flag={review.unsure[i] ? "unsure" : null}
                guide={guide?.index === i ? guide.color : null}
                onPaint={() => paint(i)}
                label={
                  i === centerCell
                    ? `Centro ${COLOR_NAMES[center]} (fijo)`
                    : `Pegatina ${i + 1}, ${color ? COLOR_NAMES[color] : "sin color"}${review.unsure[i] ? ", dudosa" : ""}`
                }
              />
            ))}
          </FaceFrame>
          <ColorPalette brush={brush} onBrush={setBrush} counts={counts} perColor={puzzle.perFace} />
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={retake}
              className="h-13 rounded-2xl bg-navy-2 text-sm font-medium text-foreground hover:bg-navy-3"
            >
              Repetir foto
            </button>
            <button
              type="button"
              onClick={next}
              className="h-13 rounded-2xl text-sm font-semibold text-navy transition-all active:scale-[0.98]"
              style={{ backgroundColor: ACCENT }}
            >
              {index === FACE_ORDER.length - 1 ? "Terminar y revisar" : "Siguiente cara"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * The guide grid over the video (3×3 or 2×2), the same share of the
 * picture that is sampled, with a dot with the color read live in every
 * cell. Each side shows what it touches: the neighbor's center color on a
 * 3×3, the neighbor face's name on a 2×2 (which has no centers).
 */
function GuideOverlay({
  face,
  size,
  live,
  progress,
}: {
  face: FaceName;
  size: 2 | 3;
  live: (CubeColor | null)[] | null;
  progress: number;
}) {
  const inset = `${((1 - GUIDE_FRACTION) / 2) * 100}%`;
  const bar = (n: 2 | 4 | 6 | 8) => CUBE_COLOR_HEX[CENTER_COLORS[neighborFace(face, n)]];
  const side = (n: 2 | 4 | 6 | 8) => FACE_LABELS[neighborFace(face, n)].toLowerCase();
  const outside = `calc(${inset} - 14px)`;
  const away = `calc(${inset} - 18px)`;
  const label = "absolute text-[11px] font-semibold text-white drop-shadow";
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      <div
        className={`absolute grid rounded-xl border-2 ${size === 3 ? "grid-cols-3 grid-rows-3" : "grid-cols-2 grid-rows-2"}`}
        style={{ inset, borderColor: progress > 0 ? ACCENT : "rgb(255 255 255 / 85%)" }}
      >
        {Array.from({ length: size * size }, (_, i) => live?.[i] ?? null).map((color, i) => (
          <div key={i} className="flex items-center justify-center border border-white/50">
            {color && (
              <span
                className="h-4 w-4 rounded-full border-2 border-black/50"
                style={{ backgroundColor: CUBE_COLOR_HEX[color] }}
              />
            )}
          </div>
        ))}
      </div>
      {size === 3 ? (
        <>
          <span className="absolute h-2 rounded-full ring-2 ring-black/40" style={{ top: outside, left: "40%", right: "40%", backgroundColor: bar(2) }} />
          <span className="absolute h-2 rounded-full ring-2 ring-black/40" style={{ bottom: outside, left: "40%", right: "40%", backgroundColor: bar(8) }} />
          <span className="absolute w-2 rounded-full ring-2 ring-black/40" style={{ left: outside, top: "40%", bottom: "40%", backgroundColor: bar(4) }} />
          <span className="absolute w-2 rounded-full ring-2 ring-black/40" style={{ right: outside, top: "40%", bottom: "40%", backgroundColor: bar(6) }} />
        </>
      ) : (
        <>
          <span className={`${label} inset-x-0 text-center`} style={{ top: away }}>{side(2)}</span>
          <span className={`${label} inset-x-0 text-center`} style={{ bottom: away }}>{side(8)}</span>
          <span className={`${label} top-1/2 -translate-y-1/2 rotate-180 [writing-mode:vertical-rl]`} style={{ left: away }}>{side(4)}</span>
          <span className={`${label} top-1/2 -translate-y-1/2 [writing-mode:vertical-rl]`} style={{ right: away }}>{side(6)}</span>
        </>
      )}
      {progress > 0 && (
        <div className="absolute inset-x-0 bottom-0 h-1.5 bg-black/40">
          <div className="h-full" style={{ width: `${progress * 100}%`, backgroundColor: ACCENT }} />
        </div>
      )}
    </div>
  );
}
