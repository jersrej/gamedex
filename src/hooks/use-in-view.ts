import { useEffect, useRef, useState } from "react";

/**
 * Flips to true the first time the element comes within `rootMargin` of the
 * viewport, and stays true. Used to hold back below-the-fold queries.
 */
export function useInView<T extends Element>(rootMargin = "400px") {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || inView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setInView(true);
      },
      { rootMargin },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [inView, rootMargin]);

  return { ref, inView };
}
