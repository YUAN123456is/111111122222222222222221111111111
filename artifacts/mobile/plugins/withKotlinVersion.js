const { withProjectBuildGradle, withDangerousMod } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

const KOTLIN_VERSION = "2.0.21";

module.exports = function withKotlinVersion(config) {
  // 1. Set kotlinVersion in root build.gradle
  config = withProjectBuildGradle(config, (config) => {
    if (!config.modResults.contents.includes("ext.kotlinVersion")) {
      config.modResults.contents = config.modResults.contents.replace(
        "buildscript {",
        "buildscript {\n  ext.kotlinVersion = '" + KOTLIN_VERSION + "'"
      );
    }
    return config;
  });

  // 2. Patch react-native-google-mobile-ads build.gradle to fix Kotlin compilation
  config = withDangerousMod(config, [
    "android",
    (config) => {
      const adsGradle = path.join(
        config.modRequest.platformProjectRoot,
        "..",
        "node_modules",
        "react-native-google-mobile-ads",
        "android",
        "build.gradle"
      );

      if (fs.existsSync(adsGradle)) {
        let content = fs.readFileSync(adsGradle, "utf8");
        let patched = false;

        // Replace invertase plugin with standard android library
        const pluginBlock = 'plugins {\n  id "io.invertase.gradle.build" version "1.5"\n}';
        if (content.includes(pluginBlock)) {
          content = content.replace(pluginBlock, 'apply plugin: "com.android.library"');
          patched = true;
        }

        // Replace PackageJson import with groovy.json.JsonSlurper
        if (content.includes("import io.invertase.gradle.common.PackageJson")) {
          content = content.replace(
            "import io.invertase.gradle.common.PackageJson",
            "import groovy.json.JsonSlurper"
          );
          patched = true;
        }

        // Replace PackageJson.getForProject with inline JSON parsing
        if (content.includes("PackageJson.getForProject(project)")) {
          content = content.replace(
            "def packageJson = PackageJson.getForProject(project)",
            'def packageJson = new JsonSlurper().parse(new File(projectDir, "../../react-native-google-mobile-ads/package.json"))'
          );
          patched = true;
        }

        if (patched) {
          fs.writeFileSync(adsGradle, content, "utf8");
          console.log("[withKotlinVersion] Patched react-native-google-mobile-ads build.gradle");
        }
      }

      return config;
    },
  ]);

  return config;
};