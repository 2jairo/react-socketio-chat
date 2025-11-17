import { createContext } from 'react'

/**
 * @typedef {Object} AuthContextType
 * @property {{username: string, id: number} | null} user
 * @property {boolean} fetching
 * @property {(username: string, password: string) => Promise<void>} signIn
 * @property {(username: string, password: string) => Promise<void>} signUp
 * @property {() => void} signOut
 */

/**
 * @type {import('react').Context<AuthContextType>}
 */
export const AuthContext = createContext()