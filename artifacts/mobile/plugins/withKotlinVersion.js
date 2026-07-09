const { withProjectBuildGradle, withDangerousMod } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

const KOTLIN_VERSION = "2.0.21";
const ADS_SDK_VERSION = "23.6.0";

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
        let patched = false;

        // Only override the ads SDK version - keep everything else intact
        if (content.includes("play-services-ads:${googleMobileAdsVersion}")) {
          content = content.replace(
            'implementation("com.google.android.gms:play-services-ads:${googleMobileAdsVersion}")',
            'implementation("com.google.android.gms:play-services-ads:' + ADS_SDK_VERSION + '")'
          );
          patched = true;
        }

        if (patched) {
          fs.writeFileSync(adsGradle, content, "utf8");
          console.log("[withKotlinVersion] Patched play-services-ads version to ' + ADS_SDK_VERSION + '");
        }
      }

      return config;
    },
  ]);

  return config;
};