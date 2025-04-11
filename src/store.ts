import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

export type Joker = { name: string; id: number };
export type AppState = {
  jokers: Joker[];
  createJoker: (name: string) => void;
};

const createJoker = (name: string): Joker => ({ name, id: Math.random() });

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set: any) => ({
        jokers: [],
        createJoker: (name: string) =>
          set((state: AppState) => ({
            jokers: [...state.jokers, createJoker(name)],
          })),
      }),
      { name: "balatroStore" },
    ),
  ),
);
