import { useEffect } from "react"
import { useApi } from "../../hooks/useApi"
import { ChatsContext } from "./chatsContext"
import { useState } from "react"
import { useContext } from "react"
import { JwtContext } from "../jwt/jwtContext"

export const ChatsProvider = ({ children }) => {
    const { token } = useContext(JwtContext)
    const api = useApi()
    const [chats, setChats] = useState([])
    const [membersState, setMembersState] = useState({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [currentChat, setCurrentChatInner] = useState(null)
    
    useEffect(() => {
        if(!token) return

        const fetchChats = async () => {
            try {
                setLoading(true)
                const response = await api.get('/api/groups')
                const newChats = response.data.map((c) => {
                    return {
                        ...c,
                        members: [],
                        messages: []
                    }
                })
                
                setChats(newChats)
                setError(null)
            } catch (err) {
                setError('Failed to load chats')
                console.error('Error fetching chats:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchChats()
    }, [api, token])


    useEffect(() => {
        if(currentChat) {
            setCurrentChat(currentChat.group.id)
        }
    }, [chats])

    const addChat = (chat) => {
        setChats((prev) => {
            return [chat, ...prev]
        })
    }

    const removeChat = (chatId) => {
        setChats((prev) => prev.filter((chat) => chat.group.id !== chatId))
    }
    
    const updateChat = (chatId, cb) => {
        setChats((prev) => {
            const updated = prev.map((chat) => {
                return chat.group.id === chatId ? cb(chat) : chat
            })
            return [...updated]
        })
    }

    const fetchChatDetails = async (chatId) => {        
        try {
            setLoading(true)
            setError(null)
            const response = await api.get(`/api/groups/details/${chatId}`)
            
            updateChat(chatId, (c) => {
                return {
                    ...c,
                    group: response.data.group,
                    members: response.data.members.map(m => ({ ...m, online: false, writting: false })),
                    messages: response.data.messages,
                    not_seen: 0
                }
            })
        } catch {
            setError('Error al cargar los detalles del chat')
        } finally {
            setLoading(false)
        }
    }

    const setCurrentChat = (chatId) => {
        setCurrentChatInner(structuredClone(chats.find((ch) => ch.group.id === chatId) || null))
    }
 
    const value = {
        chats,
        loading,
        error,
        currentChat,
        membersState,
        setMembersState,
        setCurrentChat,
        addChat,
        removeChat,
        updateChat,
        setChatsInner: setChats,
        fetchChatDetails
    }

    return (
        <ChatsContext.Provider value={value}>{children}</ChatsContext.Provider>
    )
}