"use client";

import { type ChangeEvent, type PointerEvent as ReactPointerEvent, useEffect, useMemo, useRef, useState } from "react";

type RGB = [number, number, number];

type MosaicTile = {
  id: string;
  name: string;
  src: string;
  avg: RGB;
  image: HTMLImageElement;
};

type LogoAsset = {
  name: string;
  src: string | null;
};

type LibraryImage = {
  name: string;
  src: string;
  size: number;
  updatedAt: number;
};

type FolderLibraryResponse = {
  ok: boolean;
  error?: string;
  count?: number;
  images?: LibraryImage[];
};

type ArtworkTemplateResponse = {
  ok: boolean;
  error?: string;
  config?: unknown;
  updatedAt?: string | null;
  updatedBy?: string | null;
};

type OutputPreset = {
  id: "portrait" | "square" | "story";
  label: string;
  width: number;
  height: number;
};

type AudienceMode = "local" | "network";

type ArtworkLayout = {
  bottomInset: number;
  leftGap: number;
  leftX: number;
  portraitX: number;
  portraitY: number;
  portraitBleed: number;
  logoY: number;
  textTop: number;
  headlineSize: number;
  headlineMinSize: number;
  headlineMaxHeight: number;
  headlineLineHeight: number;
  dividerGap: number;
  dividerWidth: number;
  identityGap: number;
  nameSize: number;
  roleSize: number;
  footerBottomInset: number;
  footerSize: number;
  footerMinSize: number;
  footerMaxHeight: number;
  hashtagGap: number;
  hashtagSize: number;
};

type ArtworkLayouts = Record<OutputPreset["id"], ArtworkLayout>;

type EditorElementId = "logos" | "headline" | "portrait" | "identity" | "footer";

type EditorDragTarget = EditorElementId | "portrait-resize";

type ArtworkTemplateStyle = {
  tileSize: number;
  clarity: number;
  backgroundClarity: number;
  backgroundWash: number;
  bottomBarEnabled: boolean;
  bottomBarColor: string;
  bottomBarHeight: number;
  bottomBarOverlap: number;
  bottomBarOpacity: number;
};

type ArtworkCopy = {
  headline: string;
  subline: string;
  name: string;
  role: string;
  hashtag: string;
};

type ArtworkGeneratorProps = {
  accessToken?: string | null;
  layoutEditorAllowed?: boolean;
};

const outputPresets: OutputPreset[] = [
  { id: "portrait", label: "Portrait", width: 1080, height: 1350 },
  { id: "square", label: "Square", width: 1080, height: 1080 },
  { id: "story", label: "Story", width: 1080, height: 1920 }
];

const defaultCopy: ArtworkCopy = {
  headline: "I am one of the 1,000+ reasons the world is calling Nairobi.",
  subline: "1,000+ strong. And only getting started.",
  name: "Whitney Wangari",
  role: "Social Media Manager",
  hashtag: "#1000PlusStrong"
};

const localHeadline = "I am one of the 1,000+ reasons the world is calling Nairobi.";
const networkHeadline = (location: string) =>
  `From ${location.trim() || "your city"}, happy that we've gotten to 1,000+ colleagues in Nairobi.`;
const lockedLogoOne = { name: "oasis outsourcing", src: "/assets/oasis-logo.png" };
const lockedLogoTwo = { name: "SOLVO", src: "/assets/solvo-logo.png" };
const legacyEditorStorageKey = "oasis-solvo-artwork-template-layouts-v2";
const editorStorageKey = "oasis-solvo-artwork-template-v6";

const defaultTemplateStyle: ArtworkTemplateStyle = {
  tileSize: 48,
  clarity: 66,
  backgroundClarity: 92,
  backgroundWash: 42,
  bottomBarEnabled: true,
  bottomBarColor: "#071d65",
  bottomBarHeight: 72,
  bottomBarOverlap: 0,
  bottomBarOpacity: 100
};

const defaultLayouts: ArtworkLayouts = {
  portrait: {
    bottomInset: 58,
    leftGap: 28,
    leftX: 68,
    portraitX: 352,
    portraitY: 136,
    portraitBleed: 36,
    logoY: 74,
    textTop: 304,
    headlineSize: 62,
    headlineMinSize: 34,
    headlineMaxHeight: 392,
    headlineLineHeight: 1.13,
    dividerGap: 30,
    dividerWidth: 82,
    identityGap: 54,
    nameSize: 30,
    roleSize: 15,
    footerBottomInset: 190,
    footerSize: 27,
    footerMinSize: 19,
    footerMaxHeight: 92,
    hashtagGap: 20,
    hashtagSize: 31
  },
  square: {
    bottomInset: 66,
    leftGap: 30,
    leftX: 66,
    portraitX: 414,
    portraitY: 156,
    portraitBleed: 30,
    logoY: 74,
    textTop: 224,
    headlineSize: 55,
    headlineMinSize: 31,
    headlineMaxHeight: 360,
    headlineLineHeight: 1.12,
    dividerGap: 28,
    dividerWidth: 78,
    identityGap: 50,
    nameSize: 29,
    roleSize: 14,
    footerBottomInset: 144,
    footerSize: 25,
    footerMinSize: 18,
    footerMaxHeight: 82,
    hashtagGap: 18,
    hashtagSize: 28
  },
  story: {
    bottomInset: 118,
    leftGap: 28,
    leftX: 64,
    portraitX: 356,
    portraitY: 174,
    portraitBleed: 28,
    logoY: 86,
    textTop: 252,
    headlineSize: 54,
    headlineMinSize: 30,
    headlineMaxHeight: 590,
    headlineLineHeight: 1.12,
    dividerGap: 32,
    dividerWidth: 78,
    identityGap: 56,
    nameSize: 28,
    roleSize: 14,
    footerBottomInset: 266,
    footerSize: 27,
    footerMinSize: 19,
    footerMaxHeight: 96,
    hashtagGap: 22,
    hashtagSize: 30
  }
};

const editorControlGroups: Record<
  EditorElementId,
  Array<{ key: keyof ArtworkLayout; label: string; min: number; max: number; step?: number }>
> = {
  logos: [
    { key: "leftX", label: "Left position", min: 28, max: 190 },
    { key: "logoY", label: "Logo top", min: 24, max: 220 }
  ],
  headline: [
    { key: "leftX", label: "Left position", min: 28, max: 190 },
    { key: "textTop", label: "Headline top", min: 130, max: 1300 },
    { key: "headlineSize", label: "Headline size", min: 30, max: 86 },
    { key: "headlineMaxHeight", label: "Headline box height", min: 180, max: 980 },
    { key: "headlineLineHeight", label: "Headline line height", min: 0.95, max: 1.42, step: 0.01 },
    { key: "dividerGap", label: "Divider gap", min: 12, max: 86 },
    { key: "dividerWidth", label: "Divider width", min: 38, max: 150 }
  ],
  portrait: [
    { key: "portraitX", label: "Portrait left", min: 280, max: 840 },
    { key: "portraitY", label: "Portrait top", min: 80, max: 1100 },
    { key: "portraitBleed", label: "Portrait right bleed", min: -80, max: 120 },
    { key: "bottomInset", label: "Portrait bottom inset", min: 36, max: 420 },
    { key: "leftGap", label: "Text-to-portrait gap", min: 24, max: 96 }
  ],
  identity: [
    { key: "identityGap", label: "Identity gap", min: 18, max: 150 },
    { key: "nameSize", label: "Name size", min: 18, max: 46 },
    { key: "roleSize", label: "Title size", min: 9, max: 24 }
  ],
  footer: [
    { key: "footerBottomInset", label: "Footer bottom inset", min: 74, max: 820 },
    { key: "footerSize", label: "Footer size", min: 16, max: 42 },
    { key: "footerMaxHeight", label: "Footer box height", min: 46, max: 180 },
    { key: "hashtagGap", label: "Hashtag gap", min: 8, max: 56 },
    { key: "hashtagSize", label: "Hashtag size", min: 18, max: 46 }
  ]
};

const templateStyleControls: Array<{
  key: keyof Pick<
    ArtworkTemplateStyle,
    | "tileSize"
    | "clarity"
    | "backgroundClarity"
    | "backgroundWash"
    | "bottomBarHeight"
    | "bottomBarOverlap"
  >;
  label: string;
  min: number;
  max: number;
  step?: number;
}> = [
  { key: "tileSize", label: "Collage tile size", min: 32, max: 76 },
  { key: "clarity", label: "Main person clarity", min: 52, max: 86 },
  { key: "backgroundClarity", label: "Background photo clarity", min: 35, max: 100 },
  { key: "backgroundWash", label: "White wash strength", min: 0, max: 80 },
  { key: "bottomBarHeight", label: "Bottom bar height", min: 0, max: 220 },
  { key: "bottomBarOverlap", label: "Bar overlap", min: 0, max: 90 }
];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function waitForPaint() {
  return new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => resolve());
    });
  });
}

function cloneLayouts(layouts: ArtworkLayouts): ArtworkLayouts {
  return {
    portrait: { ...layouts.portrait },
    square: { ...layouts.square },
    story: { ...layouts.story }
  };
}

function cloneTemplateStyle(style: ArtworkTemplateStyle): ArtworkTemplateStyle {
  return { ...style };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function mergeLayout(saved: unknown, fallback: ArtworkLayout): ArtworkLayout {
  if (!isRecord(saved)) {
    return { ...fallback };
  }

  const next = { ...fallback };
  for (const key of Object.keys(fallback) as Array<keyof ArtworkLayout>) {
    const value = saved[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      next[key] = value;
    }
  }

  return next;
}

function mergeLayouts(saved: unknown): ArtworkLayouts {
  if (!isRecord(saved)) {
    return cloneLayouts(defaultLayouts);
  }

  return {
    portrait: mergeLayout(saved.portrait, defaultLayouts.portrait),
    square: mergeLayout(saved.square, defaultLayouts.square),
    story: mergeLayout(saved.story, defaultLayouts.story)
  };
}

function isHexColor(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
}

function sanitizeTemplateStyle(style: ArtworkTemplateStyle): ArtworkTemplateStyle {
  return {
    tileSize: clamp(style.tileSize, 32, 76),
    clarity: clamp(style.clarity, 52, 86),
    backgroundClarity: clamp(style.backgroundClarity, 35, 100),
    backgroundWash: clamp(style.backgroundWash, 0, 80),
    bottomBarEnabled: style.bottomBarEnabled,
    bottomBarColor: isHexColor(style.bottomBarColor) ? style.bottomBarColor : defaultTemplateStyle.bottomBarColor,
    bottomBarHeight: clamp(style.bottomBarHeight, 0, 220),
    bottomBarOverlap: clamp(style.bottomBarOverlap, 0, 90),
    bottomBarOpacity: clamp(style.bottomBarOpacity, 0, 100)
  };
}

function mergeTemplateStyle(saved: unknown): ArtworkTemplateStyle {
  if (!isRecord(saved)) {
    return cloneTemplateStyle(defaultTemplateStyle);
  }

  return sanitizeTemplateStyle({
    tileSize: typeof saved.tileSize === "number" ? saved.tileSize : defaultTemplateStyle.tileSize,
    clarity: typeof saved.clarity === "number" ? saved.clarity : defaultTemplateStyle.clarity,
    backgroundClarity:
      typeof saved.backgroundClarity === "number" ? saved.backgroundClarity : defaultTemplateStyle.backgroundClarity,
    backgroundWash: typeof saved.backgroundWash === "number" ? saved.backgroundWash : defaultTemplateStyle.backgroundWash,
    bottomBarEnabled:
      typeof saved.bottomBarEnabled === "boolean" ? saved.bottomBarEnabled : defaultTemplateStyle.bottomBarEnabled,
    bottomBarColor: isHexColor(saved.bottomBarColor) ? saved.bottomBarColor : defaultTemplateStyle.bottomBarColor,
    bottomBarHeight:
      typeof saved.bottomBarHeight === "number" ? saved.bottomBarHeight : defaultTemplateStyle.bottomBarHeight,
    bottomBarOverlap:
      typeof saved.bottomBarOverlap === "number" ? saved.bottomBarOverlap : defaultTemplateStyle.bottomBarOverlap,
    bottomBarOpacity:
      typeof saved.bottomBarOpacity === "number" ? saved.bottomBarOpacity : defaultTemplateStyle.bottomBarOpacity
  });
}

function mergeTemplateConfig(saved: unknown) {
  if (!isRecord(saved)) {
    return {
      layouts: mergeLayouts(saved),
      style: cloneTemplateStyle(defaultTemplateStyle)
    };
  }

  return {
    layouts: mergeLayouts(saved.layouts ?? saved),
    style: mergeTemplateStyle(saved.style)
  };
}

function sanitizeLayout(layout: ArtworkLayout, preset: OutputPreset): ArtworkLayout {
  const leftX = clamp(layout.leftX, 28, 190);
  const portraitX = clamp(layout.portraitX, leftX + 220, preset.width - 240);
  const portraitY = clamp(layout.portraitY, 80, preset.height - 420);
  const bottomInset = clamp(layout.bottomInset, 36, Math.max(90, preset.height - portraitY - 260));

  return {
    ...layout,
    bottomInset,
    leftGap: clamp(layout.leftGap, 24, 96),
    leftX,
    portraitX,
    portraitY,
    portraitBleed: clamp(layout.portraitBleed, -80, 120),
    logoY: clamp(layout.logoY, 24, 220),
    textTop: clamp(layout.textTop, 130, preset.height - 520),
    headlineSize: clamp(layout.headlineSize, 30, 86),
    headlineMinSize: clamp(layout.headlineMinSize, 20, 52),
    headlineMaxHeight: clamp(layout.headlineMaxHeight, 180, Math.max(220, preset.height - 420)),
    headlineLineHeight: clamp(layout.headlineLineHeight, 0.95, 1.42),
    dividerGap: clamp(layout.dividerGap, 12, 86),
    dividerWidth: clamp(layout.dividerWidth, 38, 150),
    identityGap: clamp(layout.identityGap, 18, 150),
    nameSize: clamp(layout.nameSize, 18, 46),
    roleSize: clamp(layout.roleSize, 9, 24),
    footerBottomInset: clamp(layout.footerBottomInset, 74, Math.max(90, preset.height - 220)),
    footerSize: clamp(layout.footerSize, 16, 42),
    footerMinSize: clamp(layout.footerMinSize, 12, 28),
    footerMaxHeight: clamp(layout.footerMaxHeight, 46, 180),
    hashtagGap: clamp(layout.hashtagGap, 8, 56),
    hashtagSize: clamp(layout.hashtagSize, 18, 46)
  };
}

function getLeftWidth(layout: ArtworkLayout) {
  return Math.max(120, layout.portraitX - layout.leftX - layout.leftGap);
}

function getEditorElements(layout: ArtworkLayout, preset: OutputPreset) {
  const leftWidth = getLeftWidth(layout);
  const contentBottom = preset.height - layout.bottomInset;
  const portraitWidth = preset.width - layout.portraitX + layout.portraitBleed;
  const portraitHeight = contentBottom - layout.portraitY;
  const headlineHeight = Math.min(layout.headlineMaxHeight, preset.id === "story" ? 460 : 340);
  const identityY = layout.textTop + Math.min(layout.headlineMaxHeight, headlineHeight) + layout.dividerGap + layout.identityGap;
  const footerY = contentBottom - layout.footerBottomInset;

  return [
    {
      id: "logos" as const,
      label: "Logos",
      x: layout.leftX,
      y: layout.logoY,
      width: Math.min(510, preset.width - layout.leftX - 48),
      height: 78
    },
    {
      id: "headline" as const,
      label: "Headline",
      x: layout.leftX,
      y: layout.textTop,
      width: leftWidth,
      height: headlineHeight
    },
    {
      id: "identity" as const,
      label: "Name / title",
      x: layout.leftX,
      y: identityY,
      width: leftWidth,
      height: 92
    },
    {
      id: "footer" as const,
      label: "Footer copy",
      x: layout.leftX,
      y: footerY,
      width: leftWidth,
      height: layout.footerMaxHeight + 74
    },
    {
      id: "portrait" as const,
      label: "Portrait / mosaic",
      x: layout.portraitX,
      y: layout.portraitY,
      width: portraitWidth,
      height: portraitHeight
    }
  ];
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Image could not be loaded."));
    image.src = src;
  });
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("File could not be read."));
      }
    };
    reader.onerror = () => reject(new Error("File could not be read."));
    reader.readAsDataURL(file);
  });
}

function drawImageCover(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement | HTMLCanvasElement,
  x: number,
  y: number,
  width: number,
  height: number
) {
  const imageWidth = image instanceof HTMLImageElement ? image.naturalWidth || image.width : image.width;
  const imageHeight = image instanceof HTMLImageElement ? image.naturalHeight || image.height : image.height;
  const slotRatio = width / height;
  const imageRatio = imageWidth / imageHeight;

  let sourceWidth = imageWidth;
  let sourceHeight = imageHeight;
  let sourceX = 0;
  let sourceY = 0;

  if (imageRatio > slotRatio) {
    sourceWidth = imageHeight * slotRatio;
    sourceX = (imageWidth - sourceWidth) / 2;
  } else {
    sourceHeight = imageWidth / slotRatio;
    sourceY = (imageHeight - sourceHeight) / 2;
  }

  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
}

function drawImageContain(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number
) {
  const imageWidth = image.naturalWidth || image.width;
  const imageHeight = image.naturalHeight || image.height;
  const scale = Math.min(width / imageWidth, height / imageHeight);
  const targetWidth = imageWidth * scale;
  const targetHeight = imageHeight * scale;
  const targetX = x + (width - targetWidth) / 2;
  const targetY = y + (height - targetHeight) / 2;

  context.drawImage(image, targetX, targetY, targetWidth, targetHeight);
}

async function compressImage(file: File, maxEdge: number, quality = 0.9, preserveAlpha = false): Promise<string> {
  const originalSrc = await readFileAsDataUrl(file);
  const image = await loadImage(originalSrc);
  const longestEdge = Math.max(image.naturalWidth || image.width, image.naturalHeight || image.height);
  const scale = longestEdge > maxEdge ? maxEdge / longestEdge : 1;
  const targetWidth = Math.max(1, Math.round((image.naturalWidth || image.width) * scale));
  const targetHeight = Math.max(1, Math.round((image.naturalHeight || image.height) * scale));
  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const context = canvas.getContext("2d");

  if (!context) {
    return originalSrc;
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, 0, 0, targetWidth, targetHeight);
  return canvas.toDataURL(preserveAlpha ? "image/png" : "image/jpeg", quality);
}

function pixelLuminance(red: number, green: number, blue: number) {
  return red * 0.299 + green * 0.587 + blue * 0.114;
}

function pixelSpread(red: number, green: number, blue: number) {
  return Math.max(red, green, blue) - Math.min(red, green, blue);
}

function sampleBackgroundColor(data: Uint8ClampedArray, width: number, height: number): RGB {
  const patchWidth = Math.max(10, Math.floor(width * 0.08));
  const patchHeight = Math.max(10, Math.floor(height * 0.08));
  const patches = [
    [0, 0],
    [width - patchWidth, 0],
    [0, height - patchHeight],
    [width - patchWidth, height - patchHeight]
  ];
  let red = 0;
  let green = 0;
  let blue = 0;
  let count = 0;

  for (const [startX, startY] of patches) {
    for (let y = startY; y < startY + patchHeight; y += 3) {
      for (let x = startX; x < startX + patchWidth; x += 3) {
        const index = (y * width + x) * 4;
        if (data[index + 3] < 24) {
          continue;
        }
        red += data[index];
        green += data[index + 1];
        blue += data[index + 2];
        count += 1;
      }
    }
  }

  if (!count) {
    return [246, 248, 250];
  }

  return [red / count, green / count, blue / count];
}

function buildSubjectCutoutCanvas(sourceCanvas: HTMLCanvasElement) {
  const sourceContext = sourceCanvas.getContext("2d", { willReadFrequently: true });

  if (!sourceContext) {
    return sourceCanvas;
  }

  const width = sourceCanvas.width;
  const height = sourceCanvas.height;
  const imageData = sourceContext.getImageData(0, 0, width, height);
  const data = imageData.data;
  const pixelCount = width * height;
  let translucentPixels = 0;

  for (let pixel = 0; pixel < pixelCount; pixel += 1) {
    if (data[pixel * 4 + 3] < 248) {
      translucentPixels += 1;
    }
  }

  const mask = new Uint8ClampedArray(pixelCount);
  const hasAlphaMask = translucentPixels > pixelCount * 0.004;

  if (hasAlphaMask) {
    for (let pixel = 0; pixel < pixelCount; pixel += 1) {
      mask[pixel] = data[pixel * 4 + 3];
    }
  } else {
    const background = sampleBackgroundColor(data, width, height);
    const backgroundLuminance = pixelLuminance(background[0], background[1], background[2]);
    const backgroundSpread = pixelSpread(background[0], background[1], background[2]);
    const backgroundThreshold = backgroundLuminance > 190 && backgroundSpread < 48 ? 64 : 46;
    const backgroundCandidate = new Uint8Array(pixelCount);

    for (let pixel = 0; pixel < pixelCount; pixel += 1) {
      const index = pixel * 4;
      const red = data[index];
      const green = data[index + 1];
      const blue = data[index + 2];
      const alpha = data[index + 3];
      const luminance = pixelLuminance(red, green, blue);
      const spread = pixelSpread(red, green, blue);
      const distance = Math.sqrt(colorDistance([red, green, blue], background));
      const brightNeutral = luminance > 202 && spread < 54;
      const plainBackdrop = backgroundLuminance > 188 && backgroundSpread < 54 && brightNeutral && distance < 96;

      backgroundCandidate[pixel] = alpha < 18 || distance < backgroundThreshold || plainBackdrop ? 1 : 0;
    }

    const visited = new Uint8Array(pixelCount);
    const queue = new Uint32Array(pixelCount);
    let head = 0;
    let tail = 0;
    const pushBackground = (pixel: number) => {
      if (visited[pixel] || !backgroundCandidate[pixel]) {
        return;
      }
      visited[pixel] = 1;
      queue[tail] = pixel;
      tail += 1;
    };

    for (let x = 0; x < width; x += 1) {
      pushBackground(x);
      pushBackground((height - 1) * width + x);
    }
    for (let y = 0; y < height; y += 1) {
      pushBackground(y * width);
      pushBackground(y * width + width - 1);
    }

    while (head < tail) {
      const pixel = queue[head];
      head += 1;
      const x = pixel % width;
      const y = (pixel - x) / width;
      if (x > 0) {
        pushBackground(pixel - 1);
      }
      if (x < width - 1) {
        pushBackground(pixel + 1);
      }
      if (y > 0) {
        pushBackground(pixel - width);
      }
      if (y < height - 1) {
        pushBackground(pixel + width);
      }
    }

    let subjectPixels = 0;
    for (let pixel = 0; pixel < pixelCount; pixel += 1) {
      const isSubject = visited[pixel] ? 0 : 1;
      mask[pixel] = isSubject ? 255 : 0;
      subjectPixels += isSubject;
    }

    const subjectCoverage = subjectPixels / pixelCount;
    if (subjectCoverage < 0.12 || subjectCoverage > 0.94) {
      return sourceCanvas;
    }
  }

  const cutoutCanvas = document.createElement("canvas");
  cutoutCanvas.width = width;
  cutoutCanvas.height = height;
  const cutoutContext = cutoutCanvas.getContext("2d");

  if (!cutoutContext) {
    return sourceCanvas;
  }

  const cutoutData = new Uint8ClampedArray(data);
  for (let pixel = 0; pixel < pixelCount; pixel += 1) {
    const index = pixel * 4;
    cutoutData[index + 3] = Math.round((cutoutData[index + 3] * mask[pixel]) / 255);
  }

  cutoutContext.putImageData(new ImageData(cutoutData, width, height), 0, 0);
  return cutoutCanvas;
}

function getReadableTileCrop(sourceImage: HTMLImageElement) {
  const sourceWidth = sourceImage.naturalWidth || sourceImage.width;
  const sourceHeight = sourceImage.naturalHeight || sourceImage.height;
  const analysisScale = Math.min(1, 460 / Math.max(sourceWidth, sourceHeight));
  const analysisWidth = Math.max(1, Math.round(sourceWidth * analysisScale));
  const analysisHeight = Math.max(1, Math.round(sourceHeight * analysisScale));
  const analysisCanvas = document.createElement("canvas");
  analysisCanvas.width = analysisWidth;
  analysisCanvas.height = analysisHeight;
  const analysisContext = analysisCanvas.getContext("2d", { willReadFrequently: true });

  if (!analysisContext) {
    const side = Math.min(sourceWidth, sourceHeight);
    return {
      x: (sourceWidth - side) / 2,
      y: Math.max(0, (sourceHeight - side) * 0.38),
      size: side
    };
  }

  analysisContext.imageSmoothingEnabled = true;
  analysisContext.imageSmoothingQuality = "high";
  analysisContext.drawImage(sourceImage, 0, 0, analysisWidth, analysisHeight);

  const data = analysisContext.getImageData(0, 0, analysisWidth, analysisHeight).data;
  const background = sampleBackgroundColor(data, analysisWidth, analysisHeight);
  const backgroundLuminance = pixelLuminance(background[0], background[1], background[2]);
  const backgroundSpread = pixelSpread(background[0], background[1], background[2]);
  let minX = analysisWidth;
  let minY = analysisHeight;
  let maxX = 0;
  let maxY = 0;
  let contentPixels = 0;

  for (let y = 0; y < analysisHeight; y += 2) {
    for (let x = 0; x < analysisWidth; x += 2) {
      const index = (y * analysisWidth + x) * 4;
      const red = data[index];
      const green = data[index + 1];
      const blue = data[index + 2];
      const alpha = data[index + 3];
      const luminance = pixelLuminance(red, green, blue);
      const spread = pixelSpread(red, green, blue);
      const distance = Math.sqrt(colorDistance([red, green, blue], background));
      const plainLightBackground =
        backgroundLuminance > 178 &&
        backgroundSpread < 62 &&
        luminance > 184 &&
        spread < 72 &&
        distance < 92;
      const contentLike = alpha > 32 && !plainLightBackground && (distance > 44 || spread > 38 || luminance < 210);

      if (!contentLike) {
        continue;
      }

      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      contentPixels += 1;
    }
  }

  if (contentPixels < (analysisWidth * analysisHeight) / 260) {
    const side = Math.min(sourceWidth, sourceHeight);
    return {
      x: (sourceWidth - side) / 2,
      y: Math.max(0, (sourceHeight - side) * 0.38),
      size: side
    };
  }

  const scaleBack = 1 / analysisScale;
  const boundsX = minX * scaleBack;
  const boundsY = minY * scaleBack;
  const boundsWidth = Math.max(1, (maxX - minX) * scaleBack);
  const boundsHeight = Math.max(1, (maxY - minY) * scaleBack);
  const tallSubject = boundsHeight > boundsWidth * 1.25;
  const focusX = boundsX + boundsWidth / 2;
  const focusY = boundsY + boundsHeight * (tallSubject ? 0.38 : 0.48);
  const cropSize = clamp(
    Math.max(boundsWidth * 1.68, boundsHeight * (tallSubject ? 0.62 : 1.08)),
    Math.min(sourceWidth, sourceHeight) * 0.38,
    Math.min(sourceWidth, sourceHeight)
  );
  const cropX = clamp(focusX - cropSize / 2, 0, sourceWidth - cropSize);
  const cropY = clamp(focusY - cropSize / 2, 0, sourceHeight - cropSize);

  return {
    x: cropX,
    y: cropY,
    size: cropSize
  };
}

function enhanceTileCanvas(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    return;
  }

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const contrast = 1.16;
  const saturation = 1.14;

  for (let index = 0; index < data.length; index += 4) {
    let red = (data[index] - 128) * contrast + 128;
    let green = (data[index + 1] - 128) * contrast + 128;
    let blue = (data[index + 2] - 128) * contrast + 128;
    const gray = pixelLuminance(red, green, blue);

    red = gray + (red - gray) * saturation + 4;
    green = gray + (green - gray) * saturation + 4;
    blue = gray + (blue - gray) * saturation + 4;

    data[index] = clamp(red, 0, 255);
    data[index + 1] = clamp(green, 0, 255);
    data[index + 2] = clamp(blue, 0, 255);
  }

  context.putImageData(imageData, 0, 0);
}

function sampleTileAverage(image: HTMLImageElement): RGB {
  const sampleCanvas = document.createElement("canvas");
  sampleCanvas.width = 12;
  sampleCanvas.height = 12;
  const sampleContext = sampleCanvas.getContext("2d", { willReadFrequently: true });

  if (!sampleContext) {
    return [128, 128, 128];
  }

  sampleContext.drawImage(image, 0, 0, 12, 12);
  const data = sampleContext.getImageData(0, 0, 12, 12).data;
  let red = 0;
  let green = 0;
  let blue = 0;

  for (let index = 0; index < data.length; index += 4) {
    red += data[index];
    green += data[index + 1];
    blue += data[index + 2];
  }

  const pixelCount = data.length / 4;
  return [red / pixelCount, green / pixelCount, blue / pixelCount];
}

async function prepareMosaicTileImage(sourceImage: HTMLImageElement) {
  const crop = getReadableTileCrop(sourceImage);
  const canvas = document.createElement("canvas");
  canvas.width = 280;
  canvas.height = 280;
  const context = canvas.getContext("2d");

  if (!context) {
    const avg = sampleTileAverage(sourceImage);
    return { src: sourceImage.src, avg, image: sourceImage };
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(sourceImage, crop.x, crop.y, crop.size, crop.size, 0, 0, canvas.width, canvas.height);
  enhanceTileCanvas(canvas);

  const src = canvas.toDataURL("image/jpeg", 0.9);
  const image = await loadImage(src);
  return {
    src,
    avg: sampleTileAverage(image),
    image
  };
}

async function buildMosaicTile(file: File): Promise<MosaicTile> {
  const sourceSrc = await readFileAsDataUrl(file);
  const sourceImage = await loadImage(sourceSrc);
  const prepared = await prepareMosaicTileImage(sourceImage);

  return {
    id: `${file.name}-${file.size}-${file.lastModified}`,
    name: file.name,
    src: prepared.src,
    avg: prepared.avg,
    image: prepared.image
  };
}

async function buildMosaicTileFromSource(name: string, src: string, id: string): Promise<MosaicTile> {
  const sourceImage = await loadImage(src);
  const prepared = await prepareMosaicTileImage(sourceImage);

  return {
    id,
    name,
    src: prepared.src,
    avg: prepared.avg,
    image: prepared.image
  };
}

async function fetchProtectedImageObjectUrl(src: string, accessToken: string | null | undefined) {
  const response = await fetch(src, {
    cache: "no-store",
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined
  });

  if (!response.ok) {
    throw new Error("A library image could not be loaded.");
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

async function fetchProtectedImageDataUrl(src: string, accessToken: string | null | undefined) {
  const response = await fetch(src, {
    cache: "no-store",
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined
  });

  if (!response.ok) {
    throw new Error("The selected image could not be loaded.");
  }

  const blob = await response.blob();

  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("The selected image could not be prepared."));
    });
    reader.addEventListener("error", () => reject(new Error("The selected image could not be prepared.")));
    reader.readAsDataURL(blob);
  });
}

function sampleCellMetrics(
  data: Uint8ClampedArray,
  imageWidth: number,
  imageHeight: number,
  startX: number,
  startY: number,
  width: number,
  height: number,
  subjectMode: "heuristic" | "alpha" = "heuristic"
): { avg: RGB; subject: number } {
  const step = Math.max(2, Math.floor(Math.min(width, height) / 5));
  let red = 0;
  let green = 0;
  let blue = 0;
  let subject = 0;
  let count = 0;
  let colorWeight = 0;
  const maxX = Math.min(imageWidth, startX + width);
  const maxY = Math.min(imageHeight, startY + height);

  for (let y = startY; y < maxY; y += step) {
    for (let x = startX; x < maxX; x += step) {
      const index = (y * imageWidth + x) * 4;
      const pixelRed = data[index];
      const pixelGreen = data[index + 1];
      const pixelBlue = data[index + 2];
      const pixelAlpha = data[index + 3] / 255;
      const luminance = pixelLuminance(pixelRed, pixelGreen, pixelBlue);
      const spread = pixelSpread(pixelRed, pixelGreen, pixelBlue);
      const backgroundLike = clamp((luminance - 220) / 34, 0, 1) * clamp((42 - spread) / 42, 0, 1);
      const pixelSubject = subjectMode === "alpha" ? pixelAlpha : pixelAlpha * (1 - backgroundLike);
      const weight = subjectMode === "alpha" ? Math.max(pixelAlpha, 0.04) : Math.max(pixelAlpha, 0.18);

      red += pixelRed * weight;
      green += pixelGreen * weight;
      blue += pixelBlue * weight;
      subject += pixelSubject;
      colorWeight += weight;
      count += 1;
    }
  }

  if (!count || !colorWeight) {
    return { avg: [245, 246, 248], subject: 0 };
  }

  return {
    avg: [red / colorWeight, green / colorWeight, blue / colorWeight],
    subject: clamp(subject / count, 0, 1)
  };
}

function colorDistance(left: RGB, right: RGB) {
  const red = left[0] - right[0];
  const green = left[1] - right[1];
  const blue = left[2] - right[2];

  return red * red * 0.32 + green * green * 0.45 + blue * blue * 0.23;
}

function cellPresence([red, green, blue]: RGB) {
  const luminance = red * 0.299 + green * 0.587 + blue * 0.114;
  const spread = Math.max(red, green, blue) - Math.min(red, green, blue);
  const darkPresence = clamp((248 - luminance) / 142, 0, 1);
  const colorPresence = clamp(spread / 95, 0, 0.34);

  return clamp(darkPresence + colorPresence, 0, 1);
}

function ellipseWeight(x: number, y: number, centerX: number, centerY: number, radiusX: number, radiusY: number) {
  const normalized =
    ((x - centerX) * (x - centerX)) / (radiusX * radiusX) +
    ((y - centerY) * (y - centerY)) / (radiusY * radiusY);

  return clamp(1 - normalized, 0, 1);
}

function faceProtectionWeight(x: number, y: number) {
  return Math.max(
    ellipseWeight(x, y, 0.52, 0.245, 0.24, 0.18),
    ellipseWeight(x, y, 0.52, 0.31, 0.18, 0.12) * 0.55
  );
}

function tileReadabilityWeight(x: number, y: number, subject: number) {
  const faceProtection = faceProtectionWeight(x, y);
  const bodyWeight = clamp((y - 0.34) / 0.34, 0, 1);
  const sideWeight = clamp((Math.abs(x - 0.52) - 0.18) / 0.24, 0, 1) * clamp((y - 0.18) / 0.54, 0, 1);
  const faceWeight = faceProtection * 0.32;

  return clamp(Math.max(bodyWeight, sideWeight, faceWeight) * clamp(subject * 1.35, 0, 1), 0, 1);
}

function seededIndex(seed: number, cellIndex: number, limit: number) {
  const raw = Math.sin((seed + 1) * 129.9721 + cellIndex * 78.233) * 43758.5453;
  return Math.abs(Math.floor((raw - Math.floor(raw)) * limit)) % limit;
}

function chooseBestTile(target: RGB, tiles: MosaicTile[], usage: Map<string, number>, cellIndex: number, seed: number) {
  const shortlist: Array<{ tile: MosaicTile; score: number }> = [];

  for (const tile of tiles) {
    const repeatPenalty = (usage.get(tile.id) ?? 0) * 220;
    const score = colorDistance(target, tile.avg) + repeatPenalty;

    if (shortlist.length < 6) {
      shortlist.push({ tile, score });
      shortlist.sort((left, right) => left.score - right.score);
    } else if (score < shortlist[shortlist.length - 1].score) {
      shortlist[shortlist.length - 1] = { tile, score };
      shortlist.sort((left, right) => left.score - right.score);
    }
  }

  const pickLimit = Math.max(1, Math.min(shortlist.length, tiles.length > 12 ? 4 : 2));
  const tile = shortlist[seededIndex(seed, cellIndex, pickLimit)]?.tile ?? tiles[0];
  usage.set(tile.id, (usage.get(tile.id) ?? 0) + 1);
  return tile;
}

function wrapLines(context: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines: string[] = [];
  const paragraphs = text.replace(/\s+/g, " ").trim().split("\n");

  for (const paragraph of paragraphs) {
    const words = paragraph.split(" ").filter(Boolean);
    let line = "";

    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;

      if (context.measureText(candidate).width <= maxWidth) {
        line = candidate;
        continue;
      }

      if (line) {
        lines.push(line);
        line = word;
      } else {
        let fragment = "";
        for (const char of word) {
          const next = `${fragment}${char}`;
          if (context.measureText(next).width > maxWidth && fragment) {
            lines.push(fragment);
            fragment = char;
          } else {
            fragment = next;
          }
        }
        line = fragment;
      }
    }

    if (line) {
      lines.push(line);
    }
  }

  return lines;
}

function drawFittedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  maxHeight: number,
  options: {
    family: string;
    size: number;
    minSize: number;
    lineHeight: number;
    color: string;
    style?: string;
    weight?: string;
  }
) {
  let fontSize = options.size;
  let lines: string[] = [];
  let lineHeight = options.lineHeight;

  while (fontSize >= options.minSize) {
    context.font = `${options.style ? `${options.style} ` : ""}${options.weight ? `${options.weight} ` : ""}${fontSize}px ${options.family}`;
    lines = wrapLines(context, text, maxWidth);
    lineHeight = fontSize * options.lineHeight;

    if (lines.length * lineHeight <= maxHeight) {
      break;
    }

    fontSize -= 2;
  }

  context.fillStyle = options.color;
  context.textBaseline = "top";

  lines.forEach((line, index) => {
    context.fillText(line, x, y + index * lineHeight);
  });

  return y + lines.length * lineHeight;
}

function drawLogoMark(
  context: CanvasRenderingContext2D,
  logo: LogoAsset,
  x: number,
  y: number,
  width: number,
  height: number,
  scale: number
) {
  context.save();
  context.fillStyle = "#071d65";
  context.strokeStyle = "#071d65";
  context.lineWidth = 5 * scale;

  if (!logo.src) {
    const markSize = Math.min(52 * scale, height * 0.7);
    const centerY = y + height / 2;
    context.beginPath();
    context.arc(x + markSize * 0.55, centerY, markSize * 0.42, 0, Math.PI * 2);
    context.arc(x + markSize * 1.1, centerY, markSize * 0.42, 0, Math.PI * 2);
    context.stroke();
    context.font = `700 ${22 * scale}px Arial, sans-serif`;
    context.textBaseline = "middle";
    context.fillText(logo.name, x + markSize * 1.75, centerY);
    context.restore();
    return;
  }

  const image = new Image();
  image.onload = () => undefined;
  image.src = logo.src;
  context.restore();
}

function drawFallbackLogo(
  context: CanvasRenderingContext2D,
  name: string,
  x: number,
  y: number,
  width: number,
  height: number,
  scale: number,
  accent = "#071d65"
) {
  context.save();
  context.fillStyle = accent;
  context.font = `700 ${Math.max(16, 24 * scale)}px Arial, sans-serif`;
  context.textBaseline = "middle";
  const words = name.split(" ");
  const firstLine = words.slice(0, Math.ceil(words.length / 2)).join(" ");
  const secondLine = words.slice(Math.ceil(words.length / 2)).join(" ");
  const startY = y + height / 2 - (secondLine ? 13 * scale : 0);
  context.fillText(firstLine, x, startY);
  if (secondLine) {
    context.fillText(secondLine, x, startY + 25 * scale);
  }
  context.restore();
}

function drawRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const safeRadius = Math.min(radius, width / 2, height / 2);

  context.moveTo(x + safeRadius, y);
  context.lineTo(x + width - safeRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  context.lineTo(x + width, y + height - safeRadius);
  context.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  context.lineTo(x + safeRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  context.lineTo(x, y + safeRadius);
  context.quadraticCurveTo(x, y, x + safeRadius, y);
}

function drawUploadedOrFallbackLogo(
  context: CanvasRenderingContext2D,
  logo: LogoAsset,
  logoImage: HTMLImageElement | null,
  x: number,
  y: number,
  width: number,
  height: number,
  scale: number,
  accent?: string
) {
  if (logoImage) {
    drawImageContain(context, logoImage, x, y, width, height);
    return;
  }

  if (logo.name.toLowerCase().includes("oasis")) {
    drawLogoMark(context, logo, x, y, width, height, scale);
    return;
  }

  drawFallbackLogo(context, logo.name, x, y, width, height, scale, accent);
}

function drawPlaceholderPortrait(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number
) {
  context.save();
  const gradient = context.createLinearGradient(x, y, x + width, y + height);
  gradient.addColorStop(0, "#eaf4f6");
  gradient.addColorStop(0.55, "#d6e6ee");
  gradient.addColorStop(1, "#f5ede2");
  context.fillStyle = gradient;
  context.fillRect(x, y, width, height);
  context.fillStyle = "rgba(7, 29, 101, 0.12)";
  context.beginPath();
  context.ellipse(x + width * 0.58, y + height * 0.34, width * 0.18, height * 0.12, 0, 0, Math.PI * 2);
  context.fill();
  context.beginPath();
  drawRoundedRect(context, x + width * 0.38, y + height * 0.48, width * 0.42, height * 0.3, 90);
  context.fill();
  context.restore();
}

function drawSeamlessImageFade(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  portraitX: number,
  portraitWidth: number,
  protectBottomFromY = height
) {
  const fadeEnd = portraitX + portraitWidth * 0.76;
  const fade = context.createLinearGradient(0, 0, portraitX + portraitWidth * 0.74, 0);
  fade.addColorStop(0, "rgba(255,255,255,1)");
  fade.addColorStop(0.31, "rgba(255,255,255,1)");
  fade.addColorStop(0.5, "rgba(255,255,255,0.8)");
  fade.addColorStop(0.69, "rgba(255,255,255,0.36)");
  fade.addColorStop(0.88, "rgba(255,255,255,0.1)");
  fade.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = fade;
  context.fillRect(0, 0, Math.min(width, fadeEnd), Math.min(height, protectBottomFromY));
}

function drawBackgroundMosaicBoost(
  context: CanvasRenderingContext2D,
  fieldCanvas: HTMLCanvasElement,
  x: number,
  y: number,
  width: number,
  height: number,
  alpha: number
) {
  const boostCanvas = document.createElement("canvas");
  boostCanvas.width = fieldCanvas.width;
  boostCanvas.height = fieldCanvas.height;
  const boostContext = boostCanvas.getContext("2d");

  if (!boostContext) {
    return;
  }

  boostContext.imageSmoothingEnabled = true;
  boostContext.imageSmoothingQuality = "high";
  boostContext.drawImage(fieldCanvas, 0, 0);
  boostContext.globalCompositeOperation = "destination-in";
  const mask = boostContext.createLinearGradient(0, 0, fieldCanvas.width, 0);
  mask.addColorStop(0, "rgba(0,0,0,0)");
  mask.addColorStop(0.22, "rgba(0,0,0,0.08)");
  mask.addColorStop(0.48, "rgba(0,0,0,0.58)");
  mask.addColorStop(0.74, "rgba(0,0,0,0.9)");
  mask.addColorStop(1, "rgba(0,0,0,0.95)");
  boostContext.fillStyle = mask;
  boostContext.fillRect(0, 0, fieldCanvas.width, fieldCanvas.height);

  context.save();
  context.globalAlpha = alpha;
  context.drawImage(boostCanvas, x, y, width, height);
  context.restore();
}

function drawTopImageFade(
  context: CanvasRenderingContext2D,
  canvasWidth: number,
  portraitX: number,
  portraitY: number,
  portraitWidth: number,
  scale: number
) {
  const fadeStart = Math.max(0, portraitY - 54 * scale);
  const fadeHeight = 250 * scale;
  const fade = context.createLinearGradient(0, fadeStart, 0, portraitY + fadeHeight);
  fade.addColorStop(0, "rgba(255,255,255,1)");
  fade.addColorStop(0.3, "rgba(255,255,255,0.98)");
  fade.addColorStop(0.56, "rgba(255,255,255,0.62)");
  fade.addColorStop(0.8, "rgba(255,255,255,0.18)");
  fade.addColorStop(1, "rgba(255,255,255,0)");

  context.save();
  context.fillStyle = fade;
  context.fillRect(Math.max(0, portraitX - 210 * scale), fadeStart, Math.min(canvasWidth, portraitWidth + 260 * scale), fadeHeight + 54 * scale);
  context.restore();
}

function drawBackgroundMosaicVeil(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  scale: number,
  washStrength: number
) {
  const wash = clamp(washStrength, 0, 80) / 80;

  context.save();
  context.fillStyle = `rgba(255,255,255,${0.012 + wash * 0.07})`;
  context.fillRect(x, y, width, height);

  const sideLift = context.createLinearGradient(x, y, x + width * 0.42, y);
  sideLift.addColorStop(0, `rgba(255,255,255,${0.045 + wash * 0.16})`);
  sideLift.addColorStop(0.48, `rgba(255,255,255,${0.018 + wash * 0.06})`);
  sideLift.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = sideLift;
  context.fillRect(Math.max(0, x - 20 * scale), y, width * 0.5, height);

  const topLift = context.createLinearGradient(x, y, x, y + height * 0.26);
  topLift.addColorStop(0, `rgba(255,255,255,${0.04 + wash * 0.15})`);
  topLift.addColorStop(0.56, `rgba(255,255,255,${0.015 + wash * 0.05})`);
  topLift.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = topLift;
  context.fillRect(x, y, width, height * 0.3);
  context.restore();
}

function drawArtworkBaseBar(
  context: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  contentBottom: number,
  scale: number,
  style: ArtworkTemplateStyle
) {
  if (!style.bottomBarEnabled || style.bottomBarHeight <= 0 || style.bottomBarOpacity <= 0) {
    return;
  }

  const topOverlap = style.bottomBarOverlap * scale;
  const barHeightSetting = style.bottomBarHeight * scale;
  const barTop = Math.max(0, Math.min(canvasHeight - barHeightSetting, contentBottom - topOverlap));
  const barHeight = canvasHeight - barTop;

  context.save();
  context.globalAlpha = 1;
  context.fillStyle = style.bottomBarColor;
  context.fillRect(0, barTop, canvasWidth, barHeight);

  context.restore();
}

function getArtworkBaseBarTop(
  canvasHeight: number,
  contentBottom: number,
  scale: number,
  style: ArtworkTemplateStyle
) {
  if (!style.bottomBarEnabled || style.bottomBarHeight <= 0 || style.bottomBarOpacity <= 0) {
    return canvasHeight;
  }

  const topOverlap = style.bottomBarOverlap * scale;
  const barHeightSetting = style.bottomBarHeight * scale;
  return Math.max(0, Math.min(canvasHeight - barHeightSetting, contentBottom - topOverlap));
}

async function renderArtwork({
  canvas,
  preset,
  copy,
  portraitSrc,
  tiles,
  logoOne,
  logoTwo,
  templateStyle,
  layout,
  seed
}: {
  canvas: HTMLCanvasElement;
  preset: OutputPreset;
  copy: ArtworkCopy;
  portraitSrc: string | null;
  tiles: MosaicTile[];
  logoOne: LogoAsset;
  logoTwo: LogoAsset;
  templateStyle: ArtworkTemplateStyle;
  layout: ArtworkLayout;
  seed: number;
}) {
  canvas.width = preset.width;
  canvas.height = preset.height;
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    return;
  }

  const scale = preset.width / 1080;
  const contentBottom = preset.height - layout.bottomInset * scale;
  const portraitX = layout.portraitX * scale;
  const portraitY = layout.portraitY * scale;
  const portraitWidth = preset.width - portraitX + layout.portraitBleed * scale;
  const portraitHeight = contentBottom - portraitY;
  const leftX = layout.leftX * scale;
  const leftWidth = portraitX - leftX - layout.leftGap * scale;
  const baseBarTop = getArtworkBaseBarTop(preset.height, contentBottom, scale, templateStyle);
  let seamlessFadeDrawn = false;

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.clearRect(0, 0, preset.width, preset.height);

  const bg = context.createLinearGradient(0, 0, preset.width, preset.height);
  bg.addColorStop(0, "#ffffff");
  bg.addColorStop(0.52, "#f6fbfd");
  bg.addColorStop(1, "#e7f3f4");
  context.fillStyle = bg;
  context.fillRect(0, 0, preset.width, preset.height);

  context.save();
  context.globalAlpha = 0.14;
  context.fillStyle = "#d9e8ee";
  for (let index = 0; index < 6; index += 1) {
    const width = (60 + index * 18) * scale;
    const height = (70 + (index % 3) * 34) * scale;
    const x = (26 + index * 84) * scale;
    const y = preset.height - height - (42 + (index % 4) * 18) * scale;
    context.fillRect(x, y, width, height);
  }
  context.restore();

  const [portraitImage, logoOneImage, logoTwoImage] = await Promise.all([
    portraitSrc ? loadImage(portraitSrc) : Promise.resolve(null),
    logoOne.src ? loadImage(logoOne.src) : Promise.resolve(null),
    logoTwo.src ? loadImage(logoTwo.src) : Promise.resolve(null)
  ]);

  const portraitCanvas = document.createElement("canvas");
  portraitCanvas.width = Math.max(1, Math.round(portraitWidth));
  portraitCanvas.height = Math.max(1, Math.round(portraitHeight));
  const portraitContext = portraitCanvas.getContext("2d", { willReadFrequently: true });

  if (portraitContext && portraitImage) {
    portraitContext.imageSmoothingEnabled = true;
    portraitContext.imageSmoothingQuality = "high";
    drawImageCover(portraitContext, portraitImage, 0, 0, portraitCanvas.width, portraitCanvas.height);
  }

  if (portraitImage && portraitContext) {
    const portraitData = portraitContext.getImageData(0, 0, portraitCanvas.width, portraitCanvas.height).data;
    const subjectCanvas = buildSubjectCutoutCanvas(portraitCanvas);
    const subjectContext = subjectCanvas.getContext("2d", { willReadFrequently: true });
    const subjectData = subjectContext
      ? subjectContext.getImageData(0, 0, subjectCanvas.width, subjectCanvas.height).data
      : portraitData;
    const cell = clamp(templateStyle.tileSize * scale, 28 * scale, 76 * scale);
    const backgroundAlpha = clamp(templateStyle.backgroundClarity / 100, 0.35, 1);
    const backgroundBoostAlpha = 0.21 * (backgroundAlpha / 0.92);
    const usage = new Map<string, number>();
    let cellIndex = 0;

    if (tiles.length > 0) {
      const fieldCanvas = document.createElement("canvas");
      fieldCanvas.width = portraitCanvas.width;
      fieldCanvas.height = portraitCanvas.height;
      const fieldContext = fieldCanvas.getContext("2d");
      const subjectMosaicCanvas = document.createElement("canvas");
      subjectMosaicCanvas.width = portraitCanvas.width;
      subjectMosaicCanvas.height = portraitCanvas.height;
      const subjectMosaicContext = subjectMosaicCanvas.getContext("2d");
      const featureMosaicCanvas = document.createElement("canvas");
      featureMosaicCanvas.width = portraitCanvas.width;
      featureMosaicCanvas.height = portraitCanvas.height;
      const featureMosaicContext = featureMosaicCanvas.getContext("2d");

      if (fieldContext && subjectMosaicContext && featureMosaicContext) {
        fieldContext.imageSmoothingEnabled = true;
        fieldContext.imageSmoothingQuality = "high";
        subjectMosaicContext.imageSmoothingEnabled = true;
        subjectMosaicContext.imageSmoothingQuality = "high";
        featureMosaicContext.imageSmoothingEnabled = true;
        featureMosaicContext.imageSmoothingQuality = "high";

        for (let y = 0; y < portraitCanvas.height; y += cell) {
          for (let x = 0; x < portraitCanvas.width; x += cell) {
            const cellWidth = Math.min(cell, portraitCanvas.width - x);
            const cellHeight = Math.min(cell, portraitCanvas.height - y);
            const normalX = (x + cellWidth / 2) / portraitCanvas.width;
            const normalY = (y + cellHeight / 2) / portraitCanvas.height;
            const sourceMetrics = sampleCellMetrics(
              portraitData,
              portraitCanvas.width,
              portraitCanvas.height,
              Math.floor(x),
              Math.floor(y),
              Math.ceil(cellWidth),
              Math.ceil(cellHeight)
            );
            const subjectMetrics = sampleCellMetrics(
              subjectData,
              subjectCanvas.width,
              subjectCanvas.height,
              Math.floor(x),
              Math.floor(y),
              Math.ceil(cellWidth),
              Math.ceil(cellHeight),
              "alpha"
            );
            const avg = subjectMetrics.subject > 0.08 ? subjectMetrics.avg : sourceMetrics.avg;
            const tile = chooseBestTile(avg, tiles, usage, cellIndex, seed);
            const presence = Math.max(cellPresence(avg), subjectMetrics.subject);
            const subjectStrength = Math.pow(subjectMetrics.subject, 0.44);
            const faceProtection = faceProtectionWeight(normalX, normalY);
            const readability = tileReadabilityWeight(normalX, normalY, subjectMetrics.subject);

            fieldContext.save();
            fieldContext.beginPath();
            fieldContext.rect(x, y, cellWidth, cellHeight);
            fieldContext.clip();
            fieldContext.globalAlpha = 0.72 + readability * 0.12;
            drawImageCover(fieldContext, tile.image, x, y, cellWidth, cellHeight);
            fieldContext.globalAlpha = 0.01 + cellPresence(sourceMetrics.avg) * 0.016;
            fieldContext.fillStyle = `rgb(${Math.round(sourceMetrics.avg[0])}, ${Math.round(sourceMetrics.avg[1])}, ${Math.round(
              sourceMetrics.avg[2]
            )})`;
            fieldContext.fillRect(x, y, cellWidth, cellHeight);
            fieldContext.globalAlpha = 0.075;
            fieldContext.strokeStyle = "#ffffff";
            fieldContext.lineWidth = 1 * scale;
            fieldContext.strokeRect(x + 0.5 * scale, y + 0.5 * scale, cellWidth, cellHeight);
            fieldContext.restore();

            if (subjectMetrics.subject > 0.025) {
              subjectMosaicContext.save();
              subjectMosaicContext.beginPath();
              subjectMosaicContext.rect(x, y, cellWidth, cellHeight);
              subjectMosaicContext.clip();
              subjectMosaicContext.globalAlpha = clamp(
                0.7 + subjectStrength * 0.12 + readability * 0.12 - faceProtection * 0.16,
                0.42,
                0.88
              );
              drawImageCover(subjectMosaicContext, tile.image, x, y, cellWidth, cellHeight);
              subjectMosaicContext.globalAlpha = clamp(0.025 + presence * 0.045 - readability * 0.015, 0.015, 0.075);
              subjectMosaicContext.fillStyle = `rgb(${Math.round(avg[0])}, ${Math.round(avg[1])}, ${Math.round(avg[2])})`;
              subjectMosaicContext.fillRect(x, y, cellWidth, cellHeight);
              subjectMosaicContext.globalAlpha = 0.055 + subjectStrength * 0.065 + readability * 0.09;
              subjectMosaicContext.strokeStyle = "#ffffff";
              subjectMosaicContext.lineWidth = 1 * scale;
              subjectMosaicContext.strokeRect(x + 0.5 * scale, y + 0.5 * scale, cellWidth, cellHeight);
              subjectMosaicContext.restore();
            }

            cellIndex += 1;
          }
        }

        const featureCell = clamp(cell * 1.38, 46 * scale, 72 * scale);
        for (let y = featureCell * 0.28; y < portraitCanvas.height; y += featureCell) {
          for (let x = featureCell * 0.18; x < portraitCanvas.width; x += featureCell) {
            const cellWidth = Math.min(featureCell, portraitCanvas.width - x);
            const cellHeight = Math.min(featureCell, portraitCanvas.height - y);
            const normalX = (x + cellWidth / 2) / portraitCanvas.width;
            const normalY = (y + cellHeight / 2) / portraitCanvas.height;
            const subjectMetrics = sampleCellMetrics(
              subjectData,
              subjectCanvas.width,
              subjectCanvas.height,
              Math.floor(x),
              Math.floor(y),
              Math.ceil(cellWidth),
              Math.ceil(cellHeight),
              "alpha"
            );
            const readability = tileReadabilityWeight(normalX, normalY, subjectMetrics.subject);

            if (readability < 0.18) {
              cellIndex += 1;
              continue;
            }

            const sourceMetrics = sampleCellMetrics(
              portraitData,
              portraitCanvas.width,
              portraitCanvas.height,
              Math.floor(x),
              Math.floor(y),
              Math.ceil(cellWidth),
              Math.ceil(cellHeight)
            );
            const avg = subjectMetrics.subject > 0.08 ? subjectMetrics.avg : sourceMetrics.avg;
            const tile = chooseBestTile(avg, tiles, usage, cellIndex + 919, seed);

            featureMosaicContext.save();
            featureMosaicContext.beginPath();
            featureMosaicContext.rect(x, y, cellWidth, cellHeight);
            featureMosaicContext.clip();
            featureMosaicContext.globalAlpha = 0.22 + readability * 0.22;
            drawImageCover(featureMosaicContext, tile.image, x, y, cellWidth, cellHeight);
            featureMosaicContext.globalAlpha = 0.02 + cellPresence(avg) * 0.025;
            featureMosaicContext.fillStyle = `rgb(${Math.round(avg[0])}, ${Math.round(avg[1])}, ${Math.round(avg[2])})`;
            featureMosaicContext.fillRect(x, y, cellWidth, cellHeight);
            featureMosaicContext.globalAlpha = 0.09 + readability * 0.065;
            featureMosaicContext.strokeStyle = "#ffffff";
            featureMosaicContext.lineWidth = 1.1 * scale;
            featureMosaicContext.strokeRect(x + 0.5 * scale, y + 0.5 * scale, cellWidth, cellHeight);
            featureMosaicContext.restore();

            cellIndex += 1;
          }
        }

        subjectMosaicContext.save();
        subjectMosaicContext.globalCompositeOperation = "destination-in";
        subjectMosaicContext.drawImage(subjectCanvas, 0, 0);
        subjectMosaicContext.restore();

        featureMosaicContext.save();
        featureMosaicContext.globalCompositeOperation = "destination-in";
        featureMosaicContext.drawImage(subjectCanvas, 0, 0);
        featureMosaicContext.restore();

        const seamlessUnderlay = 190 * scale;
        context.save();
        context.globalAlpha = 0.42;
        context.drawImage(
          fieldCanvas,
          portraitX - seamlessUnderlay,
          portraitY,
          portraitWidth + seamlessUnderlay,
          portraitHeight
        );
        context.restore();

        context.save();
        context.globalAlpha = backgroundAlpha;
        context.drawImage(fieldCanvas, portraitX, portraitY, portraitWidth, portraitHeight);
        context.restore();

        drawSeamlessImageFade(context, preset.width, preset.height, portraitX, portraitWidth, baseBarTop);
        seamlessFadeDrawn = true;
        drawBackgroundMosaicBoost(context, fieldCanvas, portraitX, portraitY, portraitWidth, portraitHeight, backgroundBoostAlpha);
        drawTopImageFade(context, preset.width, portraitX, portraitY, portraitWidth, scale);
        drawBackgroundMosaicVeil(
          context,
          portraitX,
          portraitY,
          portraitWidth,
          portraitHeight,
          scale,
          templateStyle.backgroundWash
        );

        context.save();
        context.globalAlpha = 0.9;
        context.drawImage(subjectCanvas, portraitX, portraitY, portraitWidth, portraitHeight);
        context.restore();

        context.save();
        context.globalAlpha = 0.44;
        context.drawImage(subjectMosaicCanvas, portraitX, portraitY, portraitWidth, portraitHeight);
        context.restore();

        context.save();
        context.globalAlpha = 0.62;
        context.drawImage(featureMosaicCanvas, portraitX, portraitY, portraitWidth, portraitHeight);
        context.restore();

        context.save();
        context.globalCompositeOperation = "multiply";
        context.globalAlpha = 0.22;
        context.drawImage(subjectMosaicCanvas, portraitX, portraitY, portraitWidth, portraitHeight);
        context.restore();

        context.save();
        context.globalAlpha = clamp(templateStyle.clarity / 100 - 0.02, 0.58, 0.76);
        context.drawImage(subjectCanvas, portraitX, portraitY, portraitWidth, portraitHeight);
        context.restore();

        context.save();
        context.beginPath();
        context.ellipse(
          portraitX + portraitWidth * 0.52,
          portraitY + portraitHeight * 0.24,
          portraitWidth * 0.21,
          portraitHeight * 0.16,
          0,
          0,
          Math.PI * 2
        );
        context.clip();
        context.globalAlpha = 0.3;
        context.drawImage(subjectCanvas, portraitX, portraitY, portraitWidth, portraitHeight);
        context.restore();

        context.save();
        context.globalAlpha = 0.16;
        context.drawImage(featureMosaicCanvas, portraitX, portraitY, portraitWidth, portraitHeight);
        context.restore();
      } else {
        context.save();
        context.globalAlpha = 0.98;
        context.drawImage(subjectCanvas, portraitX, portraitY, portraitWidth, portraitHeight);
        context.restore();
      }
    } else {
      context.save();
      context.globalAlpha = 0.98;
      context.drawImage(subjectCanvas, portraitX, portraitY, portraitWidth, portraitHeight);
      context.restore();
    }
  } else {
    drawPlaceholderPortrait(context, portraitX, portraitY, portraitWidth, portraitHeight);
  }

  if (!seamlessFadeDrawn) {
    drawSeamlessImageFade(context, preset.width, preset.height, portraitX, portraitWidth, baseBarTop);
  }

  drawArtworkBaseBar(context, preset.width, preset.height, contentBottom, scale, templateStyle);

  const logoY = layout.logoY * scale;
  drawUploadedOrFallbackLogo(context, logoOne, logoOneImage, leftX, logoY, 238 * scale, 74 * scale, scale);

  context.save();
  context.strokeStyle = "rgba(7, 29, 101, 0.55)";
  context.lineWidth = 2 * scale;
  context.beginPath();
  context.moveTo(leftX + 282 * scale, logoY + 10 * scale);
  context.lineTo(leftX + 282 * scale, logoY + 68 * scale);
  context.stroke();
  context.restore();

  drawUploadedOrFallbackLogo(
    context,
    logoTwo,
    logoTwoImage,
    leftX + 315 * scale,
    logoY + 2 * scale,
    190 * scale,
    70 * scale,
    scale,
    "#5d6570"
  );

  const textTop = layout.textTop * scale;
  const headlineBottom = drawFittedText(context, copy.headline, leftX, textTop, leftWidth, layout.headlineMaxHeight * scale, {
    family: "Georgia, serif",
    size: layout.headlineSize * scale,
    minSize: layout.headlineMinSize * scale,
    lineHeight: layout.headlineLineHeight,
    color: "#071d65",
    style: "italic"
  });

  const dividerY = headlineBottom + layout.dividerGap * scale;
  context.fillStyle = "#071d65";
  context.fillRect(leftX, dividerY, layout.dividerWidth * scale, 4 * scale);

  const identityY = dividerY + layout.identityGap * scale;
  const nameBottom = drawFittedText(context, copy.name, leftX, identityY, leftWidth, 56 * scale, {
    family: "Georgia, serif",
    size: layout.nameSize * scale,
    minSize: 20 * scale,
    lineHeight: 1.1,
    color: "#071d65",
    style: "italic"
  });
  const roleBottom = drawFittedText(context, copy.role.toUpperCase(), leftX, nameBottom + 8 * scale, leftWidth, 44 * scale, {
    family: "Arial, sans-serif",
    size: layout.roleSize * scale,
    minSize: 11 * scale,
    lineHeight: 1.2,
    color: "#071d65",
    weight: "400"
  });

  const footerTargetY = contentBottom - layout.footerBottomInset * scale;
  const footerY = Math.max(roleBottom + 64 * scale, footerTargetY);
  const footerBottom = drawFittedText(context, copy.subline, leftX, footerY, leftWidth, layout.footerMaxHeight * scale, {
    family: "Arial, sans-serif",
    size: layout.footerSize * scale,
    minSize: layout.footerMinSize * scale,
    lineHeight: 1.18,
    color: "#071d65",
    weight: "700"
  });

  drawFittedText(context, copy.hashtag, leftX, footerBottom + layout.hashtagGap * scale, leftWidth, 58 * scale, {
    family: "Arial, sans-serif",
    size: layout.hashtagSize * scale,
    minSize: 20 * scale,
    lineHeight: 1.1,
    color: "#005ce6",
    weight: "700"
  });
}

export function ArtworkGenerator({ accessToken = null, layoutEditorAllowed = false }: ArtworkGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewWrapRef = useRef<HTMLDivElement | null>(null);
  const hasAutoLoadedLibraryRef = useRef(false);
  const [portraitSrc, setPortraitSrc] = useState<string | null>(null);
  const [tiles, setTiles] = useState<MosaicTile[]>([]);
  const [libraryImages, setLibraryImages] = useState<LibraryImage[]>([]);
  const [selectedLibraryPortrait, setSelectedLibraryPortrait] = useState("");
  const [loadingLibraryPortrait, setLoadingLibraryPortrait] = useState(false);
  const [copy, setCopy] = useState<ArtworkCopy>(defaultCopy);
  const [audienceMode, setAudienceMode] = useState<AudienceMode>("local");
  const [location, setLocation] = useState("Medellin");
  const [presetId, setPresetId] = useState<OutputPreset["id"]>("portrait");
  const [seed, setSeed] = useState(1);
  const [processingTiles, setProcessingTiles] = useState(false);
  const [tileProgress, setTileProgress] = useState({ done: 0, total: 0 });
  const [renderingArtwork, setRenderingArtwork] = useState(false);
  const [status, setStatus] = useState("Ready");
  const [layouts, setLayouts] = useState<ArtworkLayouts>(() => cloneLayouts(defaultLayouts));
  const [templateStyle, setTemplateStyle] = useState<ArtworkTemplateStyle>(() => cloneTemplateStyle(defaultTemplateStyle));
  const [publishingTemplate, setPublishingTemplate] = useState(false);
  const [templatePublishStatus, setTemplatePublishStatus] = useState("");
  const [editorEnabled, setEditorEnabled] = useState(false);
  const [selectedEditorElement, setSelectedEditorElement] = useState<EditorElementId>("headline");

  const selectedPreset = useMemo(
    () => outputPresets.find((preset) => preset.id === presetId) ?? outputPresets[0],
    [presetId]
  );

  const selectedLayout = layouts[selectedPreset.id];
  const editorElements = useMemo(() => getEditorElements(selectedLayout, selectedPreset), [selectedLayout, selectedPreset]);
  const selectedEditorControls = editorControlGroups[selectedEditorElement];

  const activeCopy = useMemo<ArtworkCopy>(
    () => ({
      ...copy,
      headline: audienceMode === "network" ? networkHeadline(location) : localHeadline,
      subline: defaultCopy.subline,
      hashtag: defaultCopy.hashtag
    }),
    [audienceMode, copy, location]
  );

  const isBusy = processingTiles || renderingArtwork;
  const loadingTitle = processingTiles
    ? tileProgress.total > 0
      ? "Preparing people library"
      : "Reading people library"
    : "Building artwork";
  const loadingDetail = processingTiles
    ? tileProgress.total > 0
      ? `${Math.min(tileProgress.done, tileProgress.total)} of ${tileProgress.total} photos processed`
      : "Looking for photos in the shared artwork-library folder"
    : tiles.length > 0
      ? `Composing the mosaic with ${tiles.length} people photos`
      : "Composing the campaign artwork preview";
  const loadingProgress =
    processingTiles && tileProgress.total > 0
      ? Math.round((Math.min(tileProgress.done, tileProgress.total) / tileProgress.total) * 100)
      : null;
  const visibleStatus = processingTiles
    ? tileProgress.total > 0
      ? `${Math.min(tileProgress.done, tileProgress.total)}/${tileProgress.total} photos`
      : "Reading library"
    : renderingArtwork
      ? "Building artwork"
      : status;

  useEffect(() => {
    let cancelled = false;
    const timeout = window.setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }

      setRenderingArtwork(true);
      setStatus("Building artwork");

      void (async () => {
        await waitForPaint();

        if (cancelled) {
          return;
        }

        await renderArtwork({
          canvas,
          preset: selectedPreset,
          copy: activeCopy,
          portraitSrc,
          tiles,
          logoOne: lockedLogoOne,
          logoTwo: lockedLogoTwo,
          templateStyle,
          layout: selectedLayout,
          seed
        });
      })()
        .then(() => {
          if (!cancelled) {
            setStatus("Ready");
          }
        })
        .catch((error) => {
          if (!cancelled) {
            setStatus(error instanceof Error ? error.message : "Render failed");
          }
        })
        .finally(() => {
          if (!cancelled) {
            setRenderingArtwork(false);
          }
        });
    }, 120);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [activeCopy, portraitSrc, seed, selectedLayout, selectedPreset, templateStyle, tiles]);

  useEffect(() => {
    if (hasAutoLoadedLibraryRef.current) {
      return;
    }

    hasAutoLoadedLibraryRef.current = true;
    void handleLoadFolderLibrary();
  }, []);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const response = await fetch(`/api/artwork-template?ts=${Date.now()}`, {
          cache: "no-store",
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        const payload = (await response.json()) as ArtworkTemplateResponse;

        if (cancelled || !response.ok || !payload.ok || !payload.config) {
          return;
        }

        const template = mergeTemplateConfig(payload.config);
        setLayouts(template.layouts);
        setTemplateStyle(template.style);
        setTemplatePublishStatus(
          payload.updatedBy ? `Loaded published template from ${payload.updatedBy}` : "Loaded published template"
        );
      } catch {
        if (!cancelled) {
          setTemplatePublishStatus("Published template could not be loaded");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const editorRequested = params.get("layoutEditor") === "1" || params.get("templateEditor") === "1";
    const shouldEnableEditor = editorRequested && layoutEditorAllowed;
    setEditorEnabled(shouldEnableEditor);

    if (!shouldEnableEditor) {
      if (editorRequested) {
        setStatus("Template editor is restricted in this environment");
      }
      return;
    }

    try {
      const saved = window.localStorage.getItem(editorStorageKey);
      if (saved) {
        const template = mergeTemplateConfig(JSON.parse(saved));
        setLayouts(template.layouts);
        setTemplateStyle(template.style);
      } else {
        const legacySaved = window.localStorage.getItem(legacyEditorStorageKey);
        if (legacySaved) {
          setLayouts(mergeLayouts(JSON.parse(legacySaved)));
        }
      }
    } catch {
      setStatus("Template editor could not load saved layout settings");
    }
  }, [layoutEditorAllowed]);

  useEffect(() => {
    if (!editorEnabled) {
      return;
    }

    try {
      window.localStorage.setItem(editorStorageKey, JSON.stringify({ layouts, style: templateStyle }));
    } catch {
      setStatus("Template editor could not save layout settings");
    }
  }, [editorEnabled, layouts, templateStyle]);

  async function handlePortraitChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setStatus("Preparing portrait");
    try {
      const keepsTransparency = file.type === "image/png" || file.type === "image/webp";
      const src = await compressImage(file, 1900, 0.92, keepsTransparency);
      setPortraitSrc(src);
      setSelectedLibraryPortrait("");
      setStatus("Ready");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Portrait could not be prepared");
    }
  }

  async function handleTileChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).filter((file) => file.type.startsWith("image/"));

    if (!files.length) {
      return;
    }

    setProcessingTiles(true);
    setTileProgress({ done: 0, total: files.length });
    setStatus("Preparing photo library");

    const preparedTiles: MosaicTile[] = [];

    for (const [index, file] of files.entries()) {
      try {
        preparedTiles.push(await buildMosaicTile(file));
      } catch {
        // Skip unreadable images while keeping the rest of the batch moving.
      }

      if (index % 12 === 0 || index === files.length - 1) {
        setTileProgress({ done: index + 1, total: files.length });
        await new Promise((resolve) => window.setTimeout(resolve, 0));
      }
    }

    setTiles(preparedTiles);
    setProcessingTiles(false);
    setStatus(`${preparedTiles.length} photos ready`);
  }

  async function handleLoadFolderLibrary() {
    setProcessingTiles(true);
    setTileProgress({ done: 0, total: 0 });
    setStatus("Reading people library");

    try {
      const response = await fetch(`/api/artwork-library?ts=${Date.now()}`, {
        cache: "no-store",
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined
      });
      const payload = (await response.json()) as FolderLibraryResponse;

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "The folder library could not be read.");
      }

      const images = payload.images ?? [];
      setLibraryImages(images);

      if (!images.length) {
        setTiles([]);
        setSelectedLibraryPortrait("");
        setStatus("People library is empty");
        return;
      }

      setTileProgress({ done: 0, total: images.length });
      const preparedTiles: MosaicTile[] = [];

      for (const [index, image] of images.entries()) {
        let objectUrl: string | null = null;

        try {
          objectUrl = await fetchProtectedImageObjectUrl(image.src, accessToken);
          preparedTiles.push(
            await buildMosaicTileFromSource(
              image.name,
              objectUrl,
              `${image.name}-${image.size}-${Math.round(image.updatedAt)}`
            )
          );
        } catch {
          // Keep loading the usable images if one file is corrupt or unsupported by the browser.
        } finally {
          if (objectUrl) {
            URL.revokeObjectURL(objectUrl);
          }
        }

        if (index % 12 === 0 || index === images.length - 1) {
          setTileProgress({ done: index + 1, total: images.length });
          await new Promise((resolve) => window.setTimeout(resolve, 0));
        }
      }

      setTiles(preparedTiles);
      setSelectedLibraryPortrait((current) => current || images[0]?.name || "");
      setStatus(`${preparedTiles.length} people loaded`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "The people library could not be loaded");
    } finally {
      setProcessingTiles(false);
    }
  }

  async function handleUseLibraryPortrait(imageName = selectedLibraryPortrait) {
    const image = libraryImages.find((item) => item.name === imageName);

    if (!image) {
      setStatus("Choose a person photo first");
      return;
    }

    setLoadingLibraryPortrait(true);
    setStatus("Preparing selected photo");

    try {
      const src = await fetchProtectedImageDataUrl(image.src, accessToken);
      setPortraitSrc(src);
      setSelectedLibraryPortrait(image.name);
      setStatus(`Selected ${image.name}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "The selected photo could not be prepared");
    } finally {
      setLoadingLibraryPortrait(false);
    }
  }

  function handleCopyChange(field: keyof ArtworkCopy, value: string) {
    setCopy((current) => ({ ...current, [field]: value }));
  }

  function updateCurrentLayout(updates: Partial<ArtworkLayout>) {
    setLayouts((current) => ({
      ...current,
      [selectedPreset.id]: sanitizeLayout({ ...current[selectedPreset.id], ...updates }, selectedPreset)
    }));
  }

  function updateCurrentLayoutValue(key: keyof ArtworkLayout, value: number) {
    updateCurrentLayout({ [key]: value });
  }

  function updateTemplateStyle(updates: Partial<ArtworkTemplateStyle>) {
    setTemplateStyle((current) => sanitizeTemplateStyle({ ...current, ...updates }));
  }

  function updateTemplateStyleValue(key: keyof ArtworkTemplateStyle, value: number) {
    updateTemplateStyle({ [key]: value });
  }

  function resetCurrentLayout() {
    setLayouts((current) => ({
      ...current,
      [selectedPreset.id]: { ...defaultLayouts[selectedPreset.id] }
    }));
  }

  function resetAllLayouts() {
    setLayouts(cloneLayouts(defaultLayouts));
  }

  function resetTemplateStyle() {
    setTemplateStyle(cloneTemplateStyle(defaultTemplateStyle));
  }

  function resetEntireTemplate() {
    setLayouts(cloneLayouts(defaultLayouts));
    resetTemplateStyle();
  }

  async function publishTemplate() {
    if (!accessToken) {
      setTemplatePublishStatus("Connect Supabase login to publish this template.");
      return;
    }

    setPublishingTemplate(true);
    setTemplatePublishStatus("Publishing template...");

    try {
      const response = await fetch("/api/artwork-template", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ config: { layouts, style: templateStyle } })
      });
      const payload = (await response.json()) as ArtworkTemplateResponse;

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Template could not be published.");
      }

      setTemplatePublishStatus("Published template saved to Supabase");
    } catch (error) {
      setTemplatePublishStatus(error instanceof Error ? error.message : "Template could not be published.");
    } finally {
      setPublishingTemplate(false);
    }
  }

  function getDraggedLayout(target: EditorDragTarget, startLayout: ArtworkLayout, dx: number, dy: number) {
    if (target === "portrait-resize") {
      return sanitizeLayout(
        {
          ...startLayout,
          portraitBleed: startLayout.portraitBleed + dx,
          bottomInset: startLayout.bottomInset - dy
        },
        selectedPreset
      );
    }

    if (target === "portrait") {
      return sanitizeLayout(
        {
          ...startLayout,
          portraitX: startLayout.portraitX + dx,
          portraitY: startLayout.portraitY + dy
        },
        selectedPreset
      );
    }

    if (target === "logos") {
      return sanitizeLayout(
        {
          ...startLayout,
          leftX: startLayout.leftX + dx,
          logoY: startLayout.logoY + dy
        },
        selectedPreset
      );
    }

    if (target === "headline") {
      return sanitizeLayout(
        {
          ...startLayout,
          leftX: startLayout.leftX + dx,
          textTop: startLayout.textTop + dy
        },
        selectedPreset
      );
    }

    if (target === "identity") {
      return sanitizeLayout(
        {
          ...startLayout,
          leftX: startLayout.leftX + dx,
          identityGap: startLayout.identityGap + dy
        },
        selectedPreset
      );
    }

    return sanitizeLayout(
      {
        ...startLayout,
        leftX: startLayout.leftX + dx,
        footerBottomInset: startLayout.footerBottomInset - dy
      },
      selectedPreset
    );
  }

  function handleEditorPointerDown(event: ReactPointerEvent<HTMLElement>, target: EditorDragTarget) {
    if (!editorEnabled) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const naturalPerCssX = selectedPreset.width / rect.width;
    const naturalPerCssY = selectedPreset.height / rect.height;
    const startX = event.clientX;
    const startY = event.clientY;
    const startLayout = { ...selectedLayout };

    const handleMove = (moveEvent: PointerEvent) => {
      const dx = (moveEvent.clientX - startX) * naturalPerCssX;
      const dy = (moveEvent.clientY - startY) * naturalPerCssY;
      const nextLayout = getDraggedLayout(target, startLayout, dx, dy);
      setLayouts((current) => ({
        ...current,
        [selectedPreset.id]: nextLayout
      }));
    };

    const handleUp = () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp, { once: true });
  }

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const link = document.createElement("a");
    const safeName = copy.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "artwork";
    link.href = canvas.toDataURL("image/png");
    link.download = `${safeName}-${selectedPreset.id}-photomosaic.png`;
    link.click();
  }

  return (
    <main className="mosaic-generator-page">
      <section className="mosaic-generator-shell">
        <div className="mosaic-generator-header">
          <div>
            <p className="mosaic-eyebrow">Campaign artwork generator</p>
            <h1>Photomosaic artwork studio</h1>
          </div>
          <div className="mosaic-status" role="status">
            {visibleStatus}
          </div>
        </div>

        <div className="mosaic-workbench">
          <form className="mosaic-controls" onSubmit={(event) => event.preventDefault()}>
            <section className="mosaic-section">
              <div className="mosaic-section-head">
                <h2>1. Pick your photo</h2>
                <span>{tiles.length} people loaded</span>
              </div>

              <div className="mosaic-upload-grid">
                <label className="mosaic-upload-button mosaic-upload-button-wide">
                  <input type="file" accept="image/*" onChange={(event) => void handlePortraitChange(event)} />
                  Upload your photo
                </label>
                <button
                  type="button"
                  className="mosaic-upload-button mosaic-upload-button-wide"
                  onClick={() => void handleLoadFolderLibrary()}
                  disabled={processingTiles}
                >
                  {processingTiles ? "Loading people..." : "Refresh people library"}
                </button>
              </div>

              {libraryImages.length > 0 ? (
                <div className="mosaic-two-fields">
                  <label className="mosaic-field">
                    <span>Choose from library</span>
                    <select
                      value={selectedLibraryPortrait}
                      onChange={(event) => setSelectedLibraryPortrait(event.target.value)}
                    >
                      {libraryImages.map((image) => (
                        <option key={image.name} value={image.name}>
                          {image.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    className="mosaic-upload-button"
                    onClick={() => void handleUseLibraryPortrait()}
                    disabled={processingTiles || loadingLibraryPortrait || !selectedLibraryPortrait}
                  >
                    {loadingLibraryPortrait ? "Preparing..." : "Use selected photo"}
                  </button>
                </div>
              ) : null}

              <p className="mosaic-folder-note">
                Pick your main portrait from the shared library, or upload a new photo. The mosaic uses the people photos
                in <strong>artwork-library</strong>.
              </p>

              <div className="mosaic-brand-lock">
                <img
                  className="mosaic-logo-lock-image mosaic-logo-lock-image-oasis"
                  src={lockedLogoOne.src}
                  alt="Oasis Outsourcing"
                />
                <span className="mosaic-logo-divider" aria-hidden="true" />
                <img
                  className="mosaic-logo-lock-image mosaic-logo-lock-image-solvo"
                  src={lockedLogoTwo.src}
                  alt="Solvo"
                />
              </div>
            </section>

            <section className="mosaic-section">
              <div className="mosaic-section-head">
                <h2>2. Add your details</h2>
                <span>{activeCopy.hashtag}</span>
              </div>

              <div className="mosaic-segmented mosaic-segmented-two" aria-label="Artwork version">
                <button
                  type="button"
                  className={audienceMode === "local" ? "is-active" : ""}
                  onClick={() => setAudienceMode("local")}
                >
                  Nairobi-based employee
                </button>
                <button
                  type="button"
                  className={audienceMode === "network" ? "is-active" : ""}
                  onClick={() => setAudienceMode("network")}
                >
                  Solvo network
                </button>
              </div>

              {audienceMode === "network" ? (
                <label className="mosaic-field">
                  <span>Location</span>
                  <input value={location} onChange={(event) => setLocation(event.target.value)} maxLength={34} />
                </label>
              ) : null}

              <div className="mosaic-two-fields">
                <label className="mosaic-field">
                  <span>Name</span>
                  <input
                    value={copy.name}
                    onChange={(event) => handleCopyChange("name", event.target.value)}
                    maxLength={42}
                  />
                </label>
                <label className="mosaic-field">
                  <span>Title</span>
                  <input
                    value={copy.role}
                    onChange={(event) => handleCopyChange("role", event.target.value)}
                    maxLength={42}
                  />
                </label>
              </div>

              <div className="mosaic-locked-copy">
                <strong>{activeCopy.headline}</strong>
                <span>{activeCopy.subline} {activeCopy.hashtag}</span>
              </div>
            </section>

            <section className="mosaic-section">
              <div className="mosaic-section-head">
                <h2>3. Download artwork</h2>
                <span>
                  {selectedPreset.width} x {selectedPreset.height}
                </span>
              </div>

              <div className="mosaic-segmented" aria-label="Output size">
                {outputPresets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    className={preset.id === presetId ? "is-active" : ""}
                    onClick={() => setPresetId(preset.id)}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </section>

            {editorEnabled ? (
              <section className="mosaic-section mosaic-template-editor">
                <div className="mosaic-section-head">
                  <h2>Private layout editor</h2>
                  <span>{selectedPreset.label}</span>
                </div>

                <div className="mosaic-template-element-grid" aria-label="Editable canvas elements">
                  {editorElements.map((element) => (
                    <button
                      key={element.id}
                      type="button"
                      className={selectedEditorElement === element.id ? "is-active" : ""}
                      onClick={() => setSelectedEditorElement(element.id)}
                    >
                      {element.label}
                    </button>
                  ))}
                </div>

                <div className="mosaic-editor-field-grid">
                  {selectedEditorControls.map((control) => (
                    <label className="mosaic-editor-number" key={control.key}>
                      <span>{control.label}</span>
                      <input
                        type="number"
                        value={Number(selectedLayout[control.key].toFixed(control.step === 0.01 ? 2 : 0))}
                        min={control.min}
                        max={control.max}
                        step={control.step ?? 1}
                        onChange={(event) => updateCurrentLayoutValue(control.key, Number(event.target.value))}
                      />
                    </label>
                  ))}
                </div>

                <div className="mosaic-template-subhead">
                  <strong>Template style</strong>
                  <span>Applies to every output size</span>
                </div>

                <div className="mosaic-editor-field-grid">
                  {templateStyleControls.map((control) => (
                    <label className="mosaic-editor-number" key={control.key}>
                      <span>{control.label}</span>
                      <input
                        type="number"
                        value={Number(templateStyle[control.key].toFixed(control.step === 0.01 ? 2 : 0))}
                        min={control.min}
                        max={control.max}
                        step={control.step ?? 1}
                        onChange={(event) => updateTemplateStyleValue(control.key, Number(event.target.value))}
                      />
                    </label>
                  ))}

                  <label className="mosaic-editor-number mosaic-editor-color">
                    <span>Bottom bar color</span>
                    <input
                      type="color"
                      value={templateStyle.bottomBarColor}
                      onChange={(event) => updateTemplateStyle({ bottomBarColor: event.target.value })}
                    />
                  </label>
                </div>

                <label className="mosaic-editor-check">
                  <input
                    type="checkbox"
                    checked={templateStyle.bottomBarEnabled}
                    onChange={(event) => updateTemplateStyle({ bottomBarEnabled: event.target.checked })}
                  />
                  <span>Show bottom grounding bar</span>
                </label>

                <div className="mosaic-editor-actions">
                  <button
                    type="button"
                    className="mosaic-button-primary"
                    onClick={() => void publishTemplate()}
                    disabled={publishingTemplate}
                  >
                    {publishingTemplate ? "Publishing..." : "Publish template"}
                  </button>
                  <button type="button" className="mosaic-button-secondary" onClick={resetCurrentLayout}>
                    Reset {selectedPreset.label}
                  </button>
                  <button type="button" className="mosaic-button-secondary" onClick={resetAllLayouts}>
                    Reset layouts
                  </button>
                  <button type="button" className="mosaic-button-secondary" onClick={resetTemplateStyle}>
                    Reset style
                  </button>
                  <button type="button" className="mosaic-button-secondary" onClick={resetEntireTemplate}>
                    Reset template
                  </button>
                </div>

                {templatePublishStatus ? <p className="mosaic-template-status">{templatePublishStatus}</p> : null}

                <p className="mosaic-folder-note">
                  Drag the outlined areas on the preview. Changes save locally in this browser. Publish the template to
                  Supabase when it should become the default for everyone.
                </p>
              </section>
            ) : null}
          </form>

          <section className="mosaic-preview-panel">
            <div className="mosaic-preview-toolbar">
              <div>
                <p className="mosaic-eyebrow">Preview</p>
                <h2>{selectedPreset.label} artwork</h2>
              </div>
              <div className="mosaic-action-row">
                <button
                  type="button"
                  className="mosaic-button-secondary"
                  onClick={() => setSeed((current) => current + 1)}
                  disabled={isBusy}
                >
                  Regenerate
                </button>
                <button type="button" className="mosaic-button-primary" onClick={handleDownload} disabled={isBusy}>
                  Download PNG
                </button>
              </div>
            </div>

            <div className="mosaic-canvas-wrap" ref={previewWrapRef}>
              <div className={editorEnabled ? "mosaic-canvas-stage is-editing" : "mosaic-canvas-stage"}>
                <canvas
                  ref={canvasRef}
                  width={selectedPreset.width}
                  height={selectedPreset.height}
                  className="mosaic-canvas"
                  aria-label="Generated campaign artwork preview"
                />

                {editorEnabled ? (
                  <div className="mosaic-template-overlay" aria-label="Private layout editor overlay">
                    {editorElements.map((element) => (
                      <button
                        key={element.id}
                        type="button"
                        className={
                          selectedEditorElement === element.id
                            ? "mosaic-template-handle is-active"
                            : "mosaic-template-handle"
                        }
                        style={{
                          left: `${(element.x / selectedPreset.width) * 100}%`,
                          top: `${(element.y / selectedPreset.height) * 100}%`,
                          width: `${(element.width / selectedPreset.width) * 100}%`,
                          height: `${(element.height / selectedPreset.height) * 100}%`
                        }}
                        onClick={() => setSelectedEditorElement(element.id)}
                        onPointerDown={(event) => {
                          setSelectedEditorElement(element.id);
                          handleEditorPointerDown(event, element.id);
                        }}
                      >
                        <span>{element.label}</span>
                        {element.id === "portrait" ? (
                          <span
                            className="mosaic-template-resize"
                            onPointerDown={(event) => {
                              setSelectedEditorElement("portrait");
                              handleEditorPointerDown(event, "portrait-resize");
                            }}
                          />
                        ) : null}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              {isBusy ? (
                <div className="mosaic-loading-overlay" role="status" aria-live="polite">
                  <div className="mosaic-loading-card">
                    <span className="mosaic-loading-spinner" aria-hidden="true" />
                    <strong>{loadingTitle}</strong>
                    <span>{loadingDetail}</span>
                    {loadingProgress !== null ? (
                      <div className="mosaic-progress-track" aria-hidden="true">
                        <span style={{ width: `${loadingProgress}%` }} />
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
