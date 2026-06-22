import { useEffect, useState } from "react";
import { useStore } from "./store";

export function useHydratedStore() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    useStore.persist.rehydrate();
    setHydrated(true);
  }, []);
  return hydrated;
}
