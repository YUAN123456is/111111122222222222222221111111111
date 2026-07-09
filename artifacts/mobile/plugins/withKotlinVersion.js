const { withProjectBuildGradle, withDangerousMod } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

// RN 0.81 uses Kotlin 2.1.20 (from gradle plugin libs.versions.toml)
// play-services-ads 25.4.0 requires Kotlin 2.3.0+
// react-native-google-mobile-ads 16.4.0 code uses AgeRestrictedTreatment (ads 24+)
// => Downgrade to 15.8.3 which uses older ads SDK compatible with Kotlin 2.1.x

module.exports = function withKotlinVersion(config) {
  // Set kotlinVersion in root build.gradle to match RN's version
  config = withProjectBuildGradle(config, (config) => {
    if (!config.modResults.contents.includes("ext.kotlinVersion")) {
      config.modResults.contents = config.modResults.contents.replace(
        "buildscript {",
        "buildscript {\n  ext.kotlinVersion = '2.1.20'"
      );
    }
    return config;
  });

  return config;
};