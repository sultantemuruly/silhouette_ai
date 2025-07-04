import { create } from "zustand";
import { CategoryState } from "@/types";

export const useCategoryStore = create<CategoryState>((set) => ({
  selectedCategory: "wise-write",
  setCategory: (category) => set({ selectedCategory: category }),
}));
