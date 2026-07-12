const fs = require('fs');
const p = 'artifacts/mobile/app/index.tsx';
let s = fs.readFileSync(p, 'utf8');

const oldImport = `import { View, StyleSheet } from "react-native";`;
const newImport = `import { ActivityIndicator, View, StyleSheet } from "react-native";`;
if (!s.includes(oldImport)) { console.error('import block not found'); process.exit(1); }
s = s.replace(oldImport, newImport);

const oldLoading = `  if (isLoading) {\n    return (\n      <View style={styles.container} />\n    );\n  }`;
const newLoading = `  if (isLoading) {\n    return (\n      <View style={styles.container}>\n        <ActivityIndicator color={colors.primary} size="small" />\n      </View>\n    );\n  }`;
if (!s.includes(oldLoading)) { console.error('loading block not found'); process.exit(1); }
s = s.replace(oldLoading, newLoading);

fs.writeFileSync(p, s, 'utf8');
console.log('patched ' + p);
