const { withProjectBuildGradle } = require("expo/config-plugins");

const KOTLIN_VERSION = "2.0.21";

module.exports = function withKotlinVersion(config) {
  return withProjectBuildGradle(config, (config) => {
    if (!config.modResults.contents.includes("ext.kotlinVersion")) {
      config.modResults.contents = config.modResults.contents.replace(
        "buildscript {",
        "buildscript {\n  ext.kotlinVersion = '" + KOTLIN_VERSION + "'"
      );
    }
    return config;
  });
};