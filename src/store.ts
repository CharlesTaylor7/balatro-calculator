import { create, type ExtractState } from "zustand";
import { persist, combine } from "zustand/middleware";
import type { Joker, JokerId, JokerName } from "./calculator";
import { newJoker, newHandInfo } from "./calculator";

type Stake = "white" | "green" | "purple";
export type State = ExtractState<typeof useAppState>;

// TODO:
// configuration:
// - plasma has a different scoring and different blind amounts
// - stake, green stake & purple stake increase the blind amounts
//
export const useAppState = create(
  persist(
    combine(
      {
        jokers: [] as Joker[],
        rounds: makeArray(4, () => ""),
        handInfo: newHandInfo(),
        stake: "white" as Stake,
      },

      (set, get) => ({
        setJokers: (jokers: Joker[]) => set({ jokers }),
        deleteJoker: (id: JokerId) =>
          set((state) => ({
            jokers: state.jokers.filter((joker) => joker.id !== id),
          })),
        pushJoker: (name: JokerName | null) =>
          set((state) => ({
            jokers: [...state.jokers, newJoker(name)],
          })),
        updateJoker<K extends keyof Joker>(
          index: number,
          key: K,
          value: Joker[K],
        ) {
          const { jokers } = get();
          const copy = Array.from(jokers);
          let updates: Partial<Joker>;
          if (key === "vars" && typeof value === "object" && "name" in value)
            updates = newJoker(value.name);
          else if (key === "vars")
            // @ts-ignore
            updates = { vars: { ...copy[index].vars, ...value } };
          else updates = { [key]: value };

          console.log("updates", updates);

          Object.assign(copy[index], updates);
          console.log("jokers", copy);
          set({ jokers: copy });
        },
        setHand: (index: number, hand: string) =>
          set((state) => {
            const rounds = Array.from(state.rounds);
            console.log("hand", hand);
            rounds.splice(index, 1, hand);
            console.log("rounds", rounds);
            return { rounds };
          }),
      }),
    ),
    {
      name: "balatro",
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter((pair) => typeof pair[1] !== "function"),
        ),
    },
  ),
);

function makeArray<T>(length: number, fn: (k: number) => T) {
  return Array.from({ length }, (_, k) => fn(k));
}
