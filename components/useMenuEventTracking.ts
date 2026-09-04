"use client";

import { useCallback, useEffect, useRef } from "react";
import type { MenuInteractionEvent } from "@/lib/menu-event-types";

const visitorStorageKey = "easyqr-anonymous-visitor";
const visitorExpirationKey = "easyqr-anonymous-visitor-expires";
const visitorLifetimeMs = 180 * 24 * 60 * 60 * 1000;
const flushDelayMs = 500;
const maximumBatchSize = 20;

function createAnonymousVisitorId() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const random = new Uint8Array(24);
  crypto.getRandomValues(random);
  return Array.from(random, (value) => value.toString(16).padStart(2, "0")).join("");
}

function getAnonymousVisitorId() {
  try {
    const stored = window.localStorage.getItem(visitorStorageKey);
    const expiresAt = Number(window.localStorage.getItem(visitorExpirationKey));
    if (
      stored &&
      /^[a-zA-Z0-9_-]{20,100}$/.test(stored) &&
      Number.isFinite(expiresAt) &&
      expiresAt > Date.now()
    ) return stored;
    const visitorId = createAnonymousVisitorId();
    window.localStorage.setItem(visitorStorageKey, visitorId);
    window.localStorage.setItem(visitorExpirationKey, String(Date.now() + visitorLifetimeMs));
    return visitorId;
  } catch {
    return createAnonymousVisitorId();
  }
}

export function useMenuEventTracking(visitId?: string) {
  const queueRef = useRef<MenuInteractionEvent[]>([]);
  const timerRef = useRef<number | null>(null);
  const visitorIdRef = useRef("");
  const flushRef = useRef<(preferBeacon?: boolean) => void>(() => undefined);

  const flush = useCallback((preferBeacon = false) => {
    if (!visitId || !visitorIdRef.current || queueRef.current.length === 0) return;
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const events = queueRef.current.splice(0, maximumBatchSize);
    const payload = JSON.stringify({
      visitId,
      visitorId: visitorIdRef.current,
      events,
    });
    let sent = false;
    if (preferBeacon && typeof navigator.sendBeacon === "function") {
      sent = navigator.sendBeacon(
        "/api/menu-events",
        new Blob([payload], { type: "application/json" }),
      );
    }

    if (!sent) {
      void fetch("/api/menu-events", {
        body: payload,
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        method: "POST",
      }).catch(() => undefined);
    }

    if (queueRef.current.length > 0) {
      timerRef.current = window.setTimeout(() => flushRef.current(), flushDelayMs);
    }
  }, [visitId]);

  flushRef.current = flush;

  const trackEvent = useCallback((event: MenuInteractionEvent) => {
    if (!visitId) return;
    queueRef.current.push(event);
    if (queueRef.current.length >= maximumBatchSize) {
      flushRef.current();
      return;
    }
    if (timerRef.current === null) {
      timerRef.current = window.setTimeout(() => flushRef.current(), flushDelayMs);
    }
  }, [visitId]);

  useEffect(() => {
    if (!visitId) return;
    visitorIdRef.current = getAnonymousVisitorId();
    trackEvent({ type: "session_start" });

    const flushOnExit = () => flushRef.current(true);
    const flushWhenHidden = () => {
      if (document.visibilityState === "hidden") flushOnExit();
    };
    window.addEventListener("pagehide", flushOnExit);
    document.addEventListener("visibilitychange", flushWhenHidden);
    return () => {
      window.removeEventListener("pagehide", flushOnExit);
      document.removeEventListener("visibilitychange", flushWhenHidden);
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      flushOnExit();
    };
  }, [trackEvent, visitId]);

  return trackEvent;
}
