import { createContext } from 'react'


/**
 * @typedef {{
 *      group: {
 *          id: number
 *          name: string
 *          owner_id: number
 *          is_general: boolean
 *      }
 *      members: {
 *          username: string
 *          id: number
 *      }[]
 *      messages: {
 *           id: number
 *           group_id: number
 *           user_id: number
 *           content: string
 *           created_at: string
 *           updated_at: string | null
 *      }[]
 *      last_msg: null | {
 *          user_id: number
 *          username: string
 *          id: number
 *          group_id: number
 *          content: string
 *          created_at: string
 *          updated_at: any
 *      }
 *      not_seen: number
 *      join_uuid: string | null
 * }} Chat
 */

/**
 * @typedef {{
 *      [userId: number]: { online: boolean, writting: boolean }
 * }} MemberState
 */

/**
 * @typedef {Object} ChatscontextType
 * @property {Chat[]} chats
 * @property {boolean} loading
 * @property {null | string} error
 * @property {Chat} currentChat
 * @property {() => Promise<void>} fetchChats
 * @property {MemberState} membersState
 * @property {import('react').Dispatch<import('react').SetStateAction<MemberState>>} setMembersState
 * @property {(c: Chat) => void} addChat
 * @property {(chatId: number) => void} removeChat
 * @property {(chatId: number, cb: (c: Chat) => Chat) => void} updateChat
 * @property {(chatId: number) => Promise<void>} fetchChatDetails
 * @property {(chatId: number | null) => void} setCurrentChat
 * @property {import('react').Dispatch<import('react').SetStateAction<Chat[]>>} setChatsInner
 */

/**
 * @type {import('react').Context<ChatscontextType>}
 */
export const ChatsContext = createContext()