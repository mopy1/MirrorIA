import Constants, { ExecutionEnvironment } from 'expo-constants';

/**
 * true cuando la app corre dentro de Expo Go (la app de la tienda), no en un APK propio.
 * Expo Go no trae los módulos nativos del probador (LiveKit/WebRTC) ni el dictado por voz:
 * con esto se apagan esas dos partes y el resto de la app funciona igual.
 */
export const EN_EXPO_GO = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
