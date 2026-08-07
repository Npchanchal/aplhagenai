import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getTour,
  loadTourSeen,
  saveTourSeen,
  type TourId,
  type TourSeenMap,
} from "./tours";

type TourContextValue = {
  activeTourId: TourId | null;
  stepIndex: number;
  seen: TourSeenMap;
  startTour: (id: TourId, step?: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  finishTour: () => void;
  markWelcomePrompted: () => void;
  resetSeen: () => void;
};

const TourContext = createContext<TourContextValue | null>(null);

export function TourProvider({ children }: { children: ReactNode }) {
  const [activeTourId, setActiveTourId] = useState<TourId | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [seen, setSeen] = useState<TourSeenMap>(() => loadTourSeen());

  const persist = useCallback((next: TourSeenMap) => {
    setSeen(next);
    saveTourSeen(next);
  }, []);

  const startTour = useCallback((id: TourId, step = 0) => {
    if (!getTour(id)) return;
    setActiveTourId(id);
    setStepIndex(Math.max(0, step));
  }, []);

  const finishTour = useCallback(() => {
    setActiveTourId((id) => {
      if (id) {
        setSeen((prev) => {
          const next = { ...prev, [id]: true, welcome_prompt: true };
          saveTourSeen(next);
          return next;
        });
      }
      return null;
    });
    setStepIndex(0);
  }, []);

  const skipTour = useCallback(() => {
    finishTour();
  }, [finishTour]);

  const nextStep = useCallback(() => {
    if (!activeTourId) return;
    const tour = getTour(activeTourId);
    if (!tour) return;
    setStepIndex((i) => {
      if (i >= tour.steps.length - 1) {
        queueMicrotask(() => finishTour());
        return i;
      }
      return i + 1;
    });
  }, [activeTourId, finishTour]);

  const prevStep = useCallback(() => {
    setStepIndex((i) => Math.max(0, i - 1));
  }, []);

  const markWelcomePrompted = useCallback(() => {
    persist({ ...seen, welcome_prompt: true });
  }, [persist, seen]);

  const resetSeen = useCallback(() => {
    persist({});
  }, [persist]);

  const value = useMemo(
    () => ({
      activeTourId,
      stepIndex,
      seen,
      startTour,
      nextStep,
      prevStep,
      skipTour,
      finishTour,
      markWelcomePrompted,
      resetSeen,
    }),
    [
      activeTourId,
      stepIndex,
      seen,
      startTour,
      nextStep,
      prevStep,
      skipTour,
      finishTour,
      markWelcomePrompted,
      resetSeen,
    ]
  );

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}

export function useTour(): TourContextValue {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error("useTour requires TourProvider");
  return ctx;
}
