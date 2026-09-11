"use client";

import { useEffect, useRef } from "react";

export function useModalFocus(key: string | null, onClose: () => void, dismissible = true) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!key) return;
    const dialog = [...document.querySelectorAll<HTMLElement>('[role="dialog"]')].at(-1);
    if (!dialog) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const oldOverflow = document.body.style.overflow;
    const inactive: Array<[HTMLElement, boolean]> = [];
    let ancestor: HTMLElement = dialog;
    while (ancestor.parentElement) {
      for (const sibling of ancestor.parentElement.children) {
        if (sibling !== ancestor && sibling instanceof HTMLElement) {
          inactive.push([sibling, sibling.inert]);
          sibling.inert = true;
        }
      }
      ancestor = ancestor.parentElement;
      if (ancestor === document.body) break;
    }
    document.body.style.overflow = "hidden";
    const focusable = () => [...dialog.querySelectorAll<HTMLElement>(
      'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), summary, [tabindex="0"]',
    )].filter((element) => element.getClientRects().length > 0 && !element.closest("[inert]"));
    dialog.tabIndex = -1;
    (focusable()[0] || dialog).focus({ preventScroll: true });
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (dismissible) closeRef.current();
      }
      if (event.key !== "Tab") return;
      const elements = focusable();
      const first = elements[0] || dialog;
      const last = elements.at(-1) || dialog;
      if (!dialog.contains(document.activeElement) || document.activeElement === dialog ||
        (event.shiftKey ? document.activeElement === first : document.activeElement === last)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = oldOverflow;
      for (const [element, wasInert] of inactive) element.inert = wasInert;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [key, dismissible]);
}
