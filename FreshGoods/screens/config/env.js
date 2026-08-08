/**
 * Environment configuration
 *
 * Single source of truth for the backend base URL, so it no longer has to
 * be hardcoded independently in every screen. `__DEV__` is the standard
 * React Native/Expo flag that is true in a development build/Metro bundle
 * and false in a release build.
 *
 * DEVELOPMENT: uses the LAN IP configured in ipadd.js — update that file
 * to your machine's current IP so a physical device on the same network
 * can reach your local backend.
 *
 * PRODUCTION: intentionally left unset. Fill this in with the real
 * deployed backend URL when one exists — do not invent a placeholder
 * production URL.
 */
import { IPADD } from '../ipadd';

const ENV = {
    development: {
        apiBaseUrl: `http://${IPADD}:5000`,
    },
    production: {
        // TODO: set to the deployed backend URL before creating a production build.
        apiBaseUrl: `http://${IPADD}:5000`,
    },
};

const getEnv = () => (__DEV__ ? ENV.development : ENV.production);

export const API_BASE_URL = getEnv().apiBaseUrl;
