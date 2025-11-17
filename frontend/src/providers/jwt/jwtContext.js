import { createContext } from 'react';

/**
 * @typedef {Object} JwtContextType
 * @property {(token?: string) => void} setToken
 * @property {string | null} token
 */

/**
 * @type {import('react').Context<JwtContextType>}
 */
export const JwtContext = createContext()