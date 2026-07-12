const fs = require('fs');
const files = {
  'artifacts/mobile/app/player.tsx': s => s.includes('...(userId ? { userId } : {}),') && s.includes('Number.isFinite(requestedInitialEpisode)'),
  'artifacts/mobile/app/search.tsx': s => s.includes('isError, refetch') && s.includes('retryButton'),
  'artifacts/mobile/components/ErrorFallback.tsx': s => s.includes('{t("error.title")}') && s.includes('{t("error.message")}'),
};
for (const [p, ok] of Object.entries(files)) {
  const s = fs.readFileSync(p, 'utf8');
  console.log(p, ok(s) ? 'OK' : 'ISSUE');
}
