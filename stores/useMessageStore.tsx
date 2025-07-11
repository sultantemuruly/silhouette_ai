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
  date: '',
  setDate: (date: string) => set({ date }),
  showSchedule: false,
  setShowSchedule: (showSchedule: boolean) => set({ showSchedule }),
  isGraphicMessage: false,
  setIsGraphicMessage: (isGraphicMessage: boolean) => set({ isGraphicMessage }),
  selectedTemplate: null,
  setSelectedTemplate: (selectedTemplate: { id: number; name: string; html: string; prompt: string; created_at: string; } | null) => set({ selectedTemplate }),
}))

// Custom hooks for recipient and date
export const useRecipient = () => useMessageStore(state => (state as DraftState).recipient);
export const useSetRecipient = () => useMessageStore(state => (state as DraftState).setRecipient);
export const useDate = () => useMessageStore(state => (state as DraftState).date);
export const useSetDate = () => useMessageStore(state => (state as DraftState).setDate);
export const useShowSchedule = () => useMessageStore(state => (state as DraftState).showSchedule);
export const useSetShowSchedule = () => useMessageStore(state => (state as DraftState).setShowSchedule);
