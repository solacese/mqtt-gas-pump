/**
 * useContainerDimensions hook
 * An awesome hook that measures the height/width of a container
 *
 * All credit goes to a guy named Swizec Teller
 * https://swizec.com/blog/usedimensions-a-react-hook-to-measure-dom-nodes/swizec/8983
 *
 */
import { useLayoutEffect, useRef, useState } from "react";

function useContainerDimension() {
  const ref = useRef();
  const [dimensions, setDimensions] = useState({});
  useLayoutEffect(() => {
    setDimensions(ref.current.getBoundingClientRect().toJSON());
  }, [ref.current]);

  return [ref, dimensions];
}

export default useContainerDimension;
