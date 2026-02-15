import { create } from "zustand";

interface UIState {
  isMobileMenuOpen: boolean;
  isCartDrawerOpen: boolean;
  isSearchOpen: boolean;
  isLoading: boolean;
  loadingMessage: string | null;
}

interface UIActions {
  toggleMobileMenu: () => void;
  openMobileMenu: () => void;
  closeMobileMenu: () => void;
  toggleCartDrawer: () => void;
  openCartDrawer: () => void;
  closeCartDrawer: () => void;
  toggleSearch: () => void;
  openSearch: () => void;
  closeSearch: () => void;
  setLoading: (isLoading: boolean, message?: string) => void;
}

type UIStore = UIState & UIActions;

export const useUIStore = create<UIStore>((set) => ({
  isMobileMenuOpen: false,
  isCartDrawerOpen: false,
  isSearchOpen: false,
  isLoading: false,
  loadingMessage: null,

  toggleMobileMenu: () =>
    set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  openMobileMenu: () => set({ isMobileMenuOpen: true }),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),

  toggleCartDrawer: () =>
    set((state) => ({ isCartDrawerOpen: !state.isCartDrawerOpen })),
  openCartDrawer: () => set({ isCartDrawerOpen: true }),
  closeCartDrawer: () => set({ isCartDrawerOpen: false }),

  toggleSearch: () => set((state) => ({ isSearchOpen: !state.isSearchOpen })),
  openSearch: () => set({ isSearchOpen: true }),
  closeSearch: () => set({ isSearchOpen: false }),

  setLoading: (isLoading, message?: string | null) =>
    set({ isLoading, loadingMessage: message }),
}));
