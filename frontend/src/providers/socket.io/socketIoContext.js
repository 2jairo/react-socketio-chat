import { createContext } from "react";

/**
 * @typedef {Object} JwtContextType
 * @property {boolean} connected
 * @property {(id: number) => void} setCurrentChat
 * @property {(newValue: boolean) => void} setWritting
 * @property {() => string} getSocketId
 */

/**
 * @type {import('react').Context<JwtContextType>}
 */
export const SocketIoContext = createContext()

export const ServerToClientEvents = {
    message: () => 'message',
    members: () => 'members',
    newGroup: () => 'newGroup',
    removeGroup: () => 'removeGroup',
    online: () => 'online',
}

export const ClientToServerEvents = {
    currentGroup: () => 'current',
    writting: () => 'writting'
}