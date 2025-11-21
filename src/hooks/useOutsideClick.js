import { useEffect, useRef } from "react";

export function useOutsideClick(handler) {
  const ref = useRef();

  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) return;
      handler(event);
    };
    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, [handler]);

  return ref;
}
