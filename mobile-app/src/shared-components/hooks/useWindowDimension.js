/**
 * useWindowDimension React custom hook
 * Useful for integrating react components that expect px value dimensions into a responsive layout
 *
 * Usage:
 *    const { width, height } = useWindowDimension();
 */

import { useState, useEffect } from "react";

function useWindowDimension() {
  const [width, setWidth] = useState(window.innerWidth);
  const [height, setHeight] = useState(window.innerHeight);

  const listener = () => {
    setWidth(window.innerWidth);
    setHeight(window.innerHeight);
  };

  useEffect(() => {
    window.addEventListener("resize", listener);
    return () => {
      window.removeEventListener("resize", listener);
    };
  }, []);

  return {
    width,
    height
  };
}

export default useWindowDimension;
