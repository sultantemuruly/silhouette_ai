import { create } from 'zustand'
import { DraftState } from '@/types'

export const useMessageStore = create((set) => ({
  isDraft: false,
  handleDraft: () => set((state: DraftState) => ({ isDraft: !state.isDraft })),
}))
