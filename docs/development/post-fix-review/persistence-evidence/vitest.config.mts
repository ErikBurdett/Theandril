export default {
  root: '/home/telephoneheater/Work/Theandril',
  cacheDir: '/tmp/theandril-persistence-rereview-hxguo7sl/vite-cache',
  test: {
    include: ['packages/persistence/**/*.test.ts', 'packages/chronicle/src/journal.test.ts'],
    testTimeout: 20000,
    cache: false,
    maxWorkers: 1,
    fileParallelism: false,
    attachmentsDir: '/tmp/theandril-persistence-rereview-hxguo7sl/attachments',
  },
};
