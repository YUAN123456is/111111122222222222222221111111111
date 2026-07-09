const { withProjectBuildGradle, withDangerousMod } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

const KOTLIN_VERSION = "2.0.21";
const ADS_SDK_VERSION = "23.6.0"; // Last version compatible with Kotlin 2.0.x

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

  // 2. Patch react-native-google-mobile-ads build.gradle
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

        // Replace PackageJson import
        content = content.replace(
          "import io.invertase.gradle.common.PackageJson",
          "import groovy.json.JsonSlurper"
        );

        // Replace invertase plugin
        content = content.replace(
          'plugins {\n  id "io.invertase.gradle.build" version "1.5"\n}',
          'apply plugin: "com.android.library"'
        );

        // Replace PackageJson.getForProject
        content = content.replace(
          "def packageJson = PackageJson.getForProject(project)",
          'def packageJson = new JsonSlurper().parse(new File(projectDir, "../../react-native-google-mobile-ads/package.json"))'
        );

        // Add compileSdk and namespace
        content = content.replace(
          "android {\n  defaultConfig {",
          "android {\n  compileSdk jsonCompileSdk as Integer\n  namespace 'io.invertase.googlemobileads'\n  defaultConfig {"
        );

        // Override ads SDK version to one compatible with Kotlin 2.0
        content = content.replace(
          'implementation("com.google.android.gms:play-services-ads:${googleMobileAdsVersion}")',
          'implementation("com.google.android.gms:play-services-ads:' + ADS_SDK_VERSION + '")'
        );

        // Remove ReactNative helper calls
        content = content.replace(
          "ReactNative.shared.applyPackageVersion()\nReactNative.shared.applyDefaultExcludes()\nReactNative.module.applyAndroidVersions()\nReactNative.module.applyReactNativeDependency(\"api\")",
          "// ReactNative helpers removed - using standard deps"
        );

        fs.writeFileSync(adsGradle, content, "utf8");
        console.log("[withKotlinVersion] Patched react-native-google-mobile-ads build.gradle");
      }

      return config;
    },
  ]);

  return config;
};