import { create } from 'zustand';
import { Shop } from '../types';
import { shopRepository } from '../database/shopRepository';

interface ShopState {
  shops: Shop[];
  currentShop: Shop | null;
  searchQuery: string;
  filterDay: string;
  isLoading: boolean;
  loadShops: () => void;
  setSearchQuery: (query: string) => void;
  setFilterDay: (day: string) => void;
  setCurrentShop: (shop: Shop | null) => void;
  addNewShop: (data: {
    name: string;
    ownerName: string;
    phone: string;
    address: string;
    latitude?: number;
    longitude?: number;
    debtBalance?: number;
    visitDay?: string;
  }) => Shop;
  markShopVisited: (shopId: string) => void;
}

export const useShopStore = create<ShopState>((set, get) => ({
  shops: [],
  currentShop: null,
  searchQuery: '',
  filterDay: 'Barchasi',
  isLoading: false,

  loadShops: () => {
    const { searchQuery, filterDay } = get();
    const list = shopRepository.getAll(searchQuery, filterDay);
    set({ shops: list });
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
    get().loadShops();
  },

  setFilterDay: (day: string) => {
    set({ filterDay: day });
    get().loadShops();
  },

  setCurrentShop: (shop: Shop | null) => {
    set({ currentShop: shop });
  },

  addNewShop: (data) => {
    const newShop = shopRepository.create(data);
    get().loadShops();
    return newShop;
  },

  markShopVisited: (shopId: string) => {
    shopRepository.markVisited(shopId);
    get().loadShops();
    const current = get().currentShop;
    if (current && current.id === shopId) {
      set({ currentShop: { ...current, lastVisitedAt: new Date().toISOString() } });
    }
  },
}));
