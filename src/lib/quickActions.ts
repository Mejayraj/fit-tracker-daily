import { useEffect } from "react";

const EVENT = "kadak:open-log-meal";
let pending = false;

export function requestLogMeal(immediate: boolean) {
  if (immediate) window.dispatchEvent(new CustomEvent(EVENT));
  else pending = true;
}

export function useLogMealRequest(open: () => void) {
  useEffect(() => {
    if (pending) {
      pending = false;
      open();
    }
    const handler = () => open();
    window.addEventListener(EVENT, handler);
    return () => window.removeEventListener(EVENT, handler);
  });
}
