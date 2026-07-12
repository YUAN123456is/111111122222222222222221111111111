const fs = require('fs');
const p = 'artifacts/mobile/app/player.tsx';
let s = fs.readFileSync(p, 'utf8');

if (!s.includes('import { useLocale } from "@/context/LocaleContext";')) {
  console.error('locale import not found');
  process.exit(1);
}

if (!s.includes('  const { locale, t } = useLocale();')) {
  console.error('useLocale destructuring not found');
  process.exit(1);
}

const oldHook = `  const { locale, t } = useLocale();`;
const newHook = `  const { locale, t } = useLocale();
  const [lockedHint, setLockedHint] = useState(false);`;
if (!s.includes(oldHook)) { console.error('oldHook not found'); process.exit(1); }
s = s.replace(oldHook, newHook);

const oldClose = `        onClose={() => {\n          setShowAdWall(false);\n          if (!isUnlocked) router.back();\n        }}`;
const newClose = `        onClose={() => {\n          setShowAdWall(false);\n          if (!isUnlocked) {\n            setLockedHint(true);\n            setTimeout(() => setLockedHint(false), 2000);\n          }\n        }}`;
if (!s.includes(oldClose)) { console.error('oldClose not found'); process.exit(1); }
s = s.replace(oldClose, newClose);

const oldBottomStart = `      <SafeAreaView style={styles.bottomInfo}>`;
if (!s.includes(oldBottomStart)) { console.error('bottom info block not found'); process.exit(1); }

const inject = `      {lockedHint && (\n        <View style={styles.lockedHintWrap} pointerEvents="none">\n          <View style={styles.lockedHintBox}>\n            <Text style={styles.lockedHintText}>{t("player.previewPlaying")}</Text>\n          </View>\n        </View>\n      )}\n\n      `;
s = s.replace(oldBottomStart, inject + oldBottomStart);

if (!s.includes('  lockedHintWrap: {')) {
  const stylesOld = `  epRow: {\n    flexDirection: 'row',\n    alignItems: 'center',\n    justifyContent: 'space-between',\n    marginBottom: 4,\n  },`;
  const stylesNew = `  lockedHintWrap: {\n    ...StyleSheet.absoluteFillObject,\n    justifyContent: 'center',\n    alignItems: 'center',\n    zIndex: 12,\n  },\n  lockedHintBox: {\n    paddingHorizontal: 16,\n    paddingVertical: 10,\n    borderRadius: 20,\n    backgroundColor: 'rgba(0,0,0,0.72)',\n  },\n  lockedHintText: {\n    color: '#fff',\n    fontSize: 14,\n    fontWeight: '600',\n  },\n\n  epRow: {\n    flexDirection: 'row',\n    alignItems: 'center',\n    justifyContent: 'space-between',\n    marginBottom: 4,\n  },`;
  if (!s.includes(stylesOld)) { console.error('stylesOld not found'); process.exit(1); }
  s = s.replace(stylesOld, stylesNew);
}

fs.writeFileSync(p, s, 'utf8');
console.log('patched ' + p);
