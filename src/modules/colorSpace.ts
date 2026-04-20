import {
  CLMS_TO_OKLAB,
  DEG2RAD,
  formatCSS,
  GAMUT_EPSILON,
  isInGamut,
  LMS_TO_LRGB,
  LRGB_TO_LMS,
  OKLAB_TO_CLMS,
  oklabToLinearSRGB,
  P3_TO_SRGB,
  P3_TO_XYZ,
  parseCSS,
  RAD2DEG,
  SRGB_TO_P3,
  srgbGammaDecode,
  srgbGammaEncode,
  XYZ_TO_SRGB,
} from 'colorizr';

import { clamp } from './helpers';

export interface HSV {
  h: number; // 0-360
  s: number; // 0-1
  v: number; // 0-1
}

/**
 * RGB (0-1) → HSV. Standard formula.
 */
function rgbToHsv(r: number, g: number, b: number): HSV {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;

  if (delta !== 0) {
    if (max === r) {
      h = ((g - b) / delta) % 6;
    } else if (max === g) {
      h = (b - r) / delta + 2;
    } else {
      h = (r - g) / delta + 4;
    }

    h *= 60;

    if (h < 0) {
      h += 360;
    }
  }

  const s = max === 0 ? 0 : delta / max;

  return { h, s, v: max };
}

export function colorToHsv(color: string): HSV {
  const { b, g, r } = parseCSS(color, 'rgb');

  return rgbToHsv(r / 255, g / 255, b / 255);
}

export function hsvToHex({ h, s, v }: HSV): string {
  const [r, g, b] = hsvToRgb(h, s, v);

  return formatCSS(
    {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255),
    },
    { format: 'hex' },
  );
}

/**
 * HSV → RGB (0-1 range). Standard formula.
 */
export function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;

  let r = 0;
  let g = 0;
  let b = 0;

  if (h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }

  return [r + m, g + m, b + m];
}

/**
 * Check whether the OKLCH color is in sRGB using the same rule colorizr
 * itself applies when converting OKLCH to hex/rgb/hsl (direct OKLab →
 * linear sRGB → `isInGamut`). If this returns true, colorizr will not
 * clip the color on output.
 */
export function isOklchInSRGB(l: number, c: number, h: number): boolean {
  const hRad = h * DEG2RAD;
  const labA = c * Math.cos(hRad);
  const labB = c * Math.sin(hRad);

  return isInGamut(oklabToLinearSRGB(l, labA, labB));
}

/**
 * Check if a P3 HSV color is within the sRGB gamut.
 * P3 RGB → linear P3 → XYZ D50 → linear sRGB → bounds check.
 */
export function isP3HSVInSRGB(h: number, s: number, v: number): boolean {
  const [r, g, b] = hsvToRgb(h, s, v);

  const rLin = srgbGammaDecode(r);
  const gLin = srgbGammaDecode(g);
  const bLin = srgbGammaDecode(b);

  const x = P3_TO_XYZ[0][0] * rLin + P3_TO_XYZ[0][1] * gLin + P3_TO_XYZ[0][2] * bLin;
  const y = P3_TO_XYZ[1][0] * rLin + P3_TO_XYZ[1][1] * gLin + P3_TO_XYZ[1][2] * bLin;
  const z = P3_TO_XYZ[2][0] * rLin + P3_TO_XYZ[2][1] * gLin + P3_TO_XYZ[2][2] * bLin;

  const sr = XYZ_TO_SRGB[0][0] * x + XYZ_TO_SRGB[0][1] * y + XYZ_TO_SRGB[0][2] * z;
  const sg = XYZ_TO_SRGB[1][0] * x + XYZ_TO_SRGB[1][1] * y + XYZ_TO_SRGB[1][2] * z;
  const sb = XYZ_TO_SRGB[2][0] * x + XYZ_TO_SRGB[2][1] * y + XYZ_TO_SRGB[2][2] * z;

  const min = -GAMUT_EPSILON;
  const max = 1 + GAMUT_EPSILON;

  return sr >= min && sr <= max && sg >= min && sg <= max && sb >= min && sb <= max;
}

/**
 * Convert an OKLCH hue to an HSV hue by converting a saturated reference color.
 */
export function oklchHueToHsvHue(oklchHue: number): number {
  return oklchToP3Hsv(0.7, 0.15, oklchHue).h;
}

/**
 * OKLCH → P3 HSV. Full conversion without sRGB clamping.
 * OKLCH → OKLab → LMS → sRGB linear → P3 linear → P3 gamma RGB → HSV
 */
export function oklchToP3Hsv(l: number, c: number, h: number): HSV {
  const hRad = h * DEG2RAD;
  const labA = c * Math.cos(hRad);
  const labB = c * Math.sin(hRad);

  // OKLab → cube root LMS
  const cl = OKLAB_TO_CLMS[0][0] * l + OKLAB_TO_CLMS[0][1] * labA + OKLAB_TO_CLMS[0][2] * labB;
  const cm = OKLAB_TO_CLMS[1][0] * l + OKLAB_TO_CLMS[1][1] * labA + OKLAB_TO_CLMS[1][2] * labB;
  const cs = OKLAB_TO_CLMS[2][0] * l + OKLAB_TO_CLMS[2][1] * labA + OKLAB_TO_CLMS[2][2] * labB;

  // Cube
  const lmsL = cl ** 3;
  const lmsM = cm ** 3;
  const lmsS = cs ** 3;

  // LMS → sRGB linear
  const sr = LMS_TO_LRGB[0][0] * lmsL + LMS_TO_LRGB[0][1] * lmsM + LMS_TO_LRGB[0][2] * lmsS;
  const sg = LMS_TO_LRGB[1][0] * lmsL + LMS_TO_LRGB[1][1] * lmsM + LMS_TO_LRGB[1][2] * lmsS;
  const sb = LMS_TO_LRGB[2][0] * lmsL + LMS_TO_LRGB[2][1] * lmsM + LMS_TO_LRGB[2][2] * lmsS;

  // sRGB linear → P3 linear
  const p3r = SRGB_TO_P3[0][0] * sr + SRGB_TO_P3[0][1] * sg + SRGB_TO_P3[0][2] * sb;
  const p3g = SRGB_TO_P3[1][0] * sr + SRGB_TO_P3[1][1] * sg + SRGB_TO_P3[1][2] * sb;
  const p3b = SRGB_TO_P3[2][0] * sr + SRGB_TO_P3[2][1] * sg + SRGB_TO_P3[2][2] * sb;

  // P3 linear → P3 gamma
  const r = clamp(srgbGammaEncode(p3r), 0, 1);
  const g = clamp(srgbGammaEncode(p3g), 0, 1);
  const b = clamp(srgbGammaEncode(p3b), 0, 1);

  return rgbToHsv(r, g, b);
}

/**
 * P3 HSV → OKLCH. Full conversion without sRGB clamping.
 * P3 gamma RGB → P3 linear → sRGB linear → LMS → OKLab → OKLCH
 */
export function p3HsvToOKLCH(h: number, s: number, v: number): { c: number; h: number; l: number } {
  const [r, g, b] = hsvToRgb(h, s, v);

  // P3 gamma → P3 linear
  const p3r = srgbGammaDecode(r);
  const p3g = srgbGammaDecode(g);
  const p3b = srgbGammaDecode(b);

  // P3 linear → sRGB linear
  const sr = P3_TO_SRGB[0][0] * p3r + P3_TO_SRGB[0][1] * p3g + P3_TO_SRGB[0][2] * p3b;
  const sg = P3_TO_SRGB[1][0] * p3r + P3_TO_SRGB[1][1] * p3g + P3_TO_SRGB[1][2] * p3b;
  const sb = P3_TO_SRGB[2][0] * p3r + P3_TO_SRGB[2][1] * p3g + P3_TO_SRGB[2][2] * p3b;

  // sRGB linear → LMS
  const lmsL = LRGB_TO_LMS[0][0] * sr + LRGB_TO_LMS[0][1] * sg + LRGB_TO_LMS[0][2] * sb;
  const lmsM = LRGB_TO_LMS[1][0] * sr + LRGB_TO_LMS[1][1] * sg + LRGB_TO_LMS[1][2] * sb;
  const lmsS = LRGB_TO_LMS[2][0] * sr + LRGB_TO_LMS[2][1] * sg + LRGB_TO_LMS[2][2] * sb;

  // LMS → cube root
  const cl = Math.cbrt(lmsL);
  const cm = Math.cbrt(lmsM);
  const cs = Math.cbrt(lmsS);

  // Cube root LMS → OKLab
  const labL = CLMS_TO_OKLAB[0][0] * cl + CLMS_TO_OKLAB[0][1] * cm + CLMS_TO_OKLAB[0][2] * cs;
  const labA = CLMS_TO_OKLAB[1][0] * cl + CLMS_TO_OKLAB[1][1] * cm + CLMS_TO_OKLAB[1][2] * cs;
  const labB = CLMS_TO_OKLAB[2][0] * cl + CLMS_TO_OKLAB[2][1] * cm + CLMS_TO_OKLAB[2][2] * cs;

  // OKLab → OKLCH
  const oklchC = Math.sqrt(labA * labA + labB * labB);
  let oklchH = Math.atan2(labB, labA) * RAD2DEG;

  if (oklchH < 0) oklchH += 360;

  return { c: oklchC, h: oklchH, l: labL };
}
