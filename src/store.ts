import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { Joker, JokerId, Hand } from "./calculator";
import { scoreRounds } from "./calculator";

// TODO:
// configuration:
// - plasma has a different scoring and different blind amounts
// - stake, green stake & purple stake increase the blind amounts
//

export type AppState = {
  jokers: Joker[];
  setJokers: (jokers: Joker[]) => void;
  deleteJoker: (id: JokerId) => void;
  pushJoker: (name: string) => void;
  // hand name or exact cards
  rounds: string[];
  hands: Hand[];
};

export const useAppStore = create<AppState>()(
  // @ts-ignore
  devtools(
    persist(
      (set: any, get: any) => ({
        jokers: [],
        setJokers: (jokers: Joker[]) => set({ jokers }),
        deleteJoker: (id) =>
          // @ts-ignore
          set((state) => ({
            // @ts-ignore
            jokers: state.jokers.filter((joker) => joker.id !== id),
          })),
        pushJoker: (name: string) =>
          set((state: AppState) => ({
            jokers: [...state.jokers, { name, id: newId() }],
          })),

        rounds: makeArray(4, () => ""),
        hands() {
          const { rounds, jokers } = get();
          return scoreRounds(rounds, jokers);
        },
      }),
      { name: "balatroStore" },
    ),
  ),
);

function makeArray<T>(length: number, fn: (k: number) => T) {
  return Array.from({ length }, (_, k) => fn(k));
}

function newId() {
  return Math.random().toString(36).slice(2);
}
