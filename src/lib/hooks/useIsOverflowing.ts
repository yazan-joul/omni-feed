import { useState, useEffect, useLayoutEffect, RefObject } from 'react';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export function useIsOverflowing(ref: RefObject<HTMLElement | null>) {
  const [isOverflowing, setIsOverflowing] = useState(false);

  useIsomorphicLayoutEffect(() => {
    const checkOverflow = () => {
      if (ref.current) {
        setIsOverflowing(ref.current.scrollWidth > ref.current.clientWidth + 1);
      }
    };

    checkOverflow();

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && ref.current) {
      resizeObserver = new ResizeObserver(() => checkOverflow());
      resizeObserver.observe(ref.current);
    }

    window.addEventListener('resize', checkOverflow);
    return () => {
      window.removeEventListener('resize', checkOverflow);
      if (resizeObserver && ref.current) resizeObserver.unobserve(ref.current);
    };
  }, [ref]);

  return isOverflowing;
}
