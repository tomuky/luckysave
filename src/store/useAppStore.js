import { create } from "zustand";

const useAppStore = create((set) => ({
  theme: "dark",
  setTheme: (theme) => set({ theme }),
  toggleTheme: () =>
    set((state) => ({
      theme: state.theme === "light" ? "dark" : "light",
    })),
  entered: false,
  setEntered: (entered) => set({ entered }),
  lastResult: null,
  setLastResult: (lastResult) => set({ lastResult }),
}));

export default useAppStore;
