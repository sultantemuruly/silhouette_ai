import { create } from 'zustand'
import { DraftState } from '@/types'

export const useMessageStore = create((set) => ({
  isDraft: false,
  handleDraft: () => set((state: DraftState) => ({ isDraft: !state.isDraft })),
  draftMessage: '',
  setDraftMessage: (draftMessage: string) => set({ draftMessage }),
  draftSubject: '',
  setDraftSubject: (draftSubject: string) => set({ draftSubject }),
  recipient: '',
  setRecipient: (recipient: string) => set({ recipient }),
}))
