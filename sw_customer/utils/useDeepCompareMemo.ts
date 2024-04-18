import React from "react";
import { dequal } from "dequal";

function useDeepCompareMemoize(dependencies: React.DependencyList) {
  const dependenciesRef = React.useRef<React.DependencyList>(dependencies);
  const signalRef = React.useRef<number>(0);

  if (!dequal(dependencies, dependenciesRef.current)) {
    dependenciesRef.current = dependencies;
    signalRef.current += 1;
  }

  return React.useMemo(() => dependenciesRef.current, [signalRef.current]);
}

/**
 * `useDeepCompareMemo` will only recompute the memoized value when one of the
 * `dependencies` has changed.
 *
 * Warning: `useDeepCompareMemo` should not be used with dependencies that
 * are all primitive values. Use `React.useMemo` instead.
 *
 */
export default function useDeepCompareMemo<T>(
  factory: () => T,
  dependencies: React.DependencyList
) {
  return React.useMemo(factory, useDeepCompareMemoize(dependencies));
}
