import { create } from "zustand";
import { CategoryState } from "@/types";

export const useCategoryStore = create<CategoryState>((set) => ({
  selectedCategory: "fancy-template",
  setCategory: (category) => set({ selectedCategory: category }),
}));
