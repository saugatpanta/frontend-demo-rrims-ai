import { useEffect, useState } from "react";

export function useAsync<T>(factory: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);

    factory()
      .then((value) => {
        if (alive) setData(value);
      })
      .catch((caught) => {
        if (alive) setError(caught instanceof Error ? caught : new Error(String(caught)));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, deps);

  return { data, loading, error, setData };
}
