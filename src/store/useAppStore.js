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
  // Global refetch trigger - increment to signal data should be refreshed
  refetchTrigger: 0,
  triggerRefetch: () => set((state) => ({ refetchTrigger: state.refetchTrigger + 1 })),
}));

export default useAppStore;
