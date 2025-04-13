import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Joker, JokerId, Hand, JokerName } from "./calculator";
import { scoreRounds, newJoker } from "./calculator";

// TODO:
// configuration:
// - plasma has a different scoring and different blind amounts
// - stake, green stake & purple stake increase the blind amounts
//

export type AppState = {
  jokers: Joker[];
  setJokers: (jokers: Joker[]) => void;
  deleteJoker: (id: JokerId) => void;
  updateJoker: (index: number, joker: Partial<Joker>) => void;
  pushJoker: (name: JokerName | null) => void;
  // hand name or exact cards
  rounds: string[];
  getScoredHands: () => (Hand | null)[];
  setHand: (index: number, hand: string) => Hand[];
};

export const useAppStore = create<AppState>()(
  // @ts-ignore
  persist(
    (set: any, get: any) => ({
      jokers: [],
      setJokers: (jokers: Joker[]) => set({ jokers }),
      deleteJoker: (id) =>
        set((state: AppState) => ({
          jokers: state.jokers.filter((joker) => joker.id !== id),
        })),
      pushJoker: (name: JokerName | null) =>
        set((state: AppState) => ({
          jokers: [...state.jokers, newJoker(name)],
        })),
      updateJoker: (index: number, joker: Partial<Joker>) => {
        const { jokers } = get();
        const copy = Array.from(jokers);
        // @ts-ignore
        Object.assign(copy[index], joker);
        set({ jokers: copy });
      },
      rounds: makeArray(4, () => ""),
      getScoredHands: () => {
        const { rounds, jokers } = get();
        return scoreRounds(rounds, jokers);
      },
      setHand: (index, hand) =>
        set((state: AppState) => {
          const rounds = Array.from(state.rounds);
          console.log("hand", hand);
          rounds.splice(index, 1, hand);
          console.log("rounds", rounds);
          return { rounds };
        }),
    }),
    {
      name: "balatro",
      partialize: (state: AppState) =>
        Object.fromEntries(
          Object.entries(state).filter((pair) => typeof pair[1] !== "function"),
        ),
    },
  ),
);

function makeArray<T>(length: number, fn: (k: number) => T) {
  return Array.from({ length }, (_, k) => fn(k));
}
