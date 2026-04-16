import type { MockDiffFile } from '@/types/mock';

export const mockDiffFiles: MockDiffFile[] = [
  {
    file: 'SessionService.kt',
    add: 4,
    del: 0
  },
  {
    file: 'ChatSession.kt',
    add: 2,
    del: 1
  },
  {
    file: 'RepoManager.kt',
    add: 6,
    del: 3
  }
];

export const getMockDiffSummary = () => {
  const totalAdd = mockDiffFiles.reduce((sum, f) => sum + f.add, 0);
  const totalDel = mockDiffFiles.reduce((sum, f) => sum + f.del, 0);
  return { files: mockDiffFiles, totalAdd, totalDel };
};
