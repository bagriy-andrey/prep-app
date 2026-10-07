import { useEffect, useRef } from "react";
import type { RefObject } from "react";

/**
 * Прокручивает горизонтальный список так, чтобы активный элемент был по центру.
 * Браузер не даёт прокрутить за края, поэтому в начале и конце списка центрирования нет.
 * Активным считается элемент с aria-selected="true" или aria-current.
 */
export function useCenterActive(container: RefObject<HTMLElement | null>, activeKey: string | number) {
  const first = useRef(true);
  useEffect(() => {
    const box = container.current;
    const active = box?.querySelector<HTMLElement>('[aria-selected="true"], [aria-current]');
    if (!box || !active || typeof box.scrollTo !== "function") return;
    const left = active.offsetLeft - (box.clientWidth - active.offsetWidth) / 2;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    // Первая прокрутка мгновенная, чтобы страница не «ехала» при открытии.
    box.scrollTo({ left, behavior: first.current || reduce ? "auto" : "smooth" });
    first.current = false;
  }, [container, activeKey]);
}
