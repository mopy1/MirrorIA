const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Metro no trata .glb/.gltf como asset binario por defecto (los intentaría
// parsear como código) — hace falta para poder hacer require() del modelo
// 3D del vestidor AR (Fase 5).
config.resolver.assetExts.push('glb', 'gltf', 'bin');

// three.js publica dos builds distintos ("exports" del package.json): uno
// CJS (build/three.cjs, el que usa @react-three/fiber vía require('three'))
// y uno ESM (build/three.module.js, el que resuelve un `import ... from
// 'three'` como el de GLTFLoader.js). Metro no las deduplica: cada archivo
// termina siendo una copia de la librería con sus propias clases
// (THREE.FileLoader, THREE.LoaderUtils, etc.), así que un `instanceof` o un
// parche de prototipo hecho sobre una copia nunca es visto por la otra —
// eso rompía GLTFLoader (warning "Multiple instances of Three.js" + luego
// un TypeError leyendo `.match()` de un método que nunca quedó parchado).
// Se fuerza acá que CUALQUIER import/require de 'three' en todo el bundle
// resuelva siempre al mismo archivo físico, para que exista una sola copia.
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'three') {
    return {
      filePath: path.resolve(__dirname, 'node_modules/three/build/three.cjs'),
      type: 'sourceFile',
    };
  }
  return originalResolveRequest
    ? originalResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './global.css', inlineRem: 16 });
