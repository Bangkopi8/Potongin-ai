export function useProfileMockState(mockUserState) {
  return {
    freeCredits: mockUserState.freeCredits,
    historyEmptyMessage: mockUserState.historyEmptyMessage,
    profile: mockUserState.profile,
    savedHistory: mockUserState.savedHistory,
  };
}
