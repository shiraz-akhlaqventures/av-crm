"use client";

import { useEffect, useState } from "react";

export type TimeOfDay = "night" | "dawn" | "morning" | "afternoon" | "evening";

export interface TimeState {
  /** Current hour (0-23) in Asia/Kolkata */
  hour: number;
  /** Time-of-day bucket */
  tod: TimeOfDay;
  /** Sky / background color (hex) */
  skyColor: string;
  /** Directional light color (sun / moon tint) */
  sunColor: string;
  /** Sun position (drives directional light direction) */
  sunPosition: [number, number, number];
  /** Ambient intensity */
  ambientIntensity: number;
  /** Sun intensity */
  sunIntensity: number;
  /** Window glow on building walls */
  windowGlow: number;
  /** Human-readable label */
  label: string;
}

/**
 * Returns the current Asia/Kolkata hour (0-23).
 */
function getIndianHour(): number {
  // toLocaleString with timeZone is the simplest cross-runtime way.
  const s = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    hour12: false,
  });
  const h = parseInt(s, 10);
  return Number.isFinite(h) ? h : 12;
}

function timeStateForHour(hour: number): TimeState {
  if (hour >= 19 || hour < 5) {
    // Night
    return {
      hour,
      tod: "night",
      skyColor: "#0a0a14",
      sunColor: "#a5b4fc",
      sunPosition: [-30, 25, 30],
      ambientIntensity: 0.15,
      sunIntensity: 0.25,
      windowGlow: 1.0,
      label: "Night",
    };
  }
  if (hour < 7) {
    // Dawn
    return {
      hour,
      tod: "dawn",
      skyColor: "#1e1b4b",
      sunColor: "#fb923c",
      sunPosition: [-40, 8, 25],
      ambientIntensity: 0.3,
      sunIntensity: 0.6,
      windowGlow: 0.7,
      label: "Dawn",
    };
  }
  if (hour < 12) {
    // Morning
    return {
      hour,
      tod: "morning",
      skyColor: "#7dd3fc",
      sunColor: "#fef3c7",
      sunPosition: [25, 30, 15],
      ambientIntensity: 0.45,
      sunIntensity: 1.0,
      windowGlow: 0.2,
      label: "Morning",
    };
  }
  if (hour < 17) {
    // Afternoon
    return {
      hour,
      tod: "afternoon",
      skyColor: "#38bdf8",
      sunColor: "#ffffff",
      sunPosition: [5, 35, 5],
      ambientIntensity: 0.55,
      sunIntensity: 1.3,
      windowGlow: 0.05,
      label: "Afternoon",
    };
  }
  // Evening
  return {
    hour,
    tod: "evening",
    skyColor: "#fb923c",
    sunColor: "#f97316",
    sunPosition: [-30, 12, -15],
    ambientIntensity: 0.4,
    sunIntensity: 0.8,
    windowGlow: 0.6,
    label: "Evening",
  };
}

/**
 * React hook that polls Asia/Kolkata time every `intervalMs` ms
 * and returns the current TimeState.
 *
 * Pass intervalMs = 0 to disable polling (one-shot read).
 */
export function useIndianTime(intervalMs = 60_000): TimeState {
  const [state, setState] = useState<TimeState>(() =>
    timeStateForHour(getIndianHour()),
  );

  useEffect(() => {
    if (intervalMs <= 0) return;
    const id = setInterval(() => {
      setState(timeStateForHour(getIndianHour()));
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return state;
}
