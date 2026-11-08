// Config plugin propio (CNG): `android/` no se versiona, así que los límites de RAM de Gradle
// se escriben en cada `expo prebuild` en vez de editarse a mano (laptop con 8 GB, WSL2).
const { withGradleProperties } = require('expo/config-plugins');

const PROPIEDADES = {
  'org.gradle.workers.max': '2',
  'org.gradle.jvmargs': '-Xmx2560m -XX:MaxMetaspaceSize=640m -Dfile.encoding=UTF-8',
  'org.gradle.parallel': 'false',
  'org.gradle.daemon': 'false',
  // Kotlin dentro del proceso de Gradle: una JVM menos (con daemon aparte el worker de javac se colgaba por swap).
  'kotlin.compiler.execution.strategy': 'in-process',
  reactNativeArchitectures: 'arm64-v8a',
  // Release sin R8: R8 pide mucha RAM y puede quitar clases de WebRTC que se usan por reflexión.
  'android.enableMinifyInReleaseBuilds': 'false',
  'android.enablePngCrunchInReleaseBuilds': 'false',
};

module.exports = function withGradleRam(config) {
  return withGradleProperties(config, (cfg) => {
    for (const [key, value] of Object.entries(PROPIEDADES)) {
      cfg.modResults = cfg.modResults.filter((p) => !(p.type === 'property' && p.key === key));
      cfg.modResults.push({ type: 'property', key, value });
    }
    return cfg;
  });
};
