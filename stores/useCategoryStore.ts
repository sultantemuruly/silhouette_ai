import { create } from "zustand";
import { CategoryState } from "@/types";

export const useCategoryStore = create<CategoryState>((set) => ({
  selectedCategory: "all-mail",
  setCategory: (category) => set({ selectedCategory: category }),
}));
