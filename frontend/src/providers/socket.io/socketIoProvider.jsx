import { ServerToClientEvents, SocketIoContext, ClientToServerEvents } from './socketIoContext'
import { io } from 'socket.io-client'
import { JwtContext } from '../jwt/jwtContext'
import { useRef, useEffect, useState, useContext } from 'react'
import { ChatsContext } from '../chats/chatsContext'
import { useApi } from '../../hooks/useApi'
import { getChatMembers } from '../../helpers/axios'


export const SocketIoProvider = ({ children }) => {
    const { token } = useContext(JwtContext)
    const { updateChat, addChat, removeChat, setMembersState, currentChat, chats } = useContext(ChatsContext)
    const socketRef = useRef(null)
    const chatsRef = useRef({ currentChat, chats })
    const [connected, setConnected] = useState(false)
    const api = useApi()

    useEffect(() => {
        chatsRef.current = { chats, currentChat }
    }, [currentChat, chats])

    useEffect(() => {
        if(!token) return
        
        const socket = io('ws://localhost:8900', { 
            extraHeaders: {
                authorization: `Bearer ${token}`
            }
        })

        socket.on('connect', () => {
            setConnected(true)
        })
        socket.on('disconnect', () => {
            setConnected(false)
        })
        socket.onAny((event, ...args) => {
            console.log({ event, args })
        })

        socket.on(ServerToClientEvents.message(), async ({ msg, operation }) => {
            let members = chatsRef.current.chats.find(c => c.group.id === msg.group_id)?.members || []
            if(operation === 'create' && !members.length) {
                members = (await getChatMembers(api, msg.group_id)).data.members
            }

            updateChat(msg.group_id, (c) => {
                if (operation === 'create') {
                    c.members = members
                    const author = c.members.find(member => member.id === msg.user_id)
                    c.last_msg = { ...msg, username: author.username }

                    c.messages.push(msg)
                } else if(operation === 'update') {
                    c.messages = c.messages.map((m) => {
                        return m.id === msg.id ? msg : m
                    })
                } else if(operation === 'delete') {
                    c.messages = c.messages.filter((m) => m.id !== msg.id)
                }

                if(chatsRef.current.currentChat?.group.id !== msg.group_id) {
                    c.not_seen += 1;
                }

                return c
            })
        })

        socket.on(ServerToClientEvents.members(), ({ members, group }) => {
            updateChat(group.id, (c) => {
                c.members = members
                c.group.members_length = members.length
                return c
            })
        })
        socket.on(ServerToClientEvents.newGroup(), ({ members, group, messages, join_uuid }) => {
            let last_msg = null
            if(messages.length) {
                const lastMsg = messages[messages.length -1]
                const author = members.find(member => member.id === lastMsg.user_id)
                last_msg = { ...lastMsg, username: author.username }
            }
            addChat({ group, members, messages, last_msg, not_seen: 0, join_uuid: join_uuid || null })
        })

        socket.on(ServerToClientEvents.updateGroup(), ({ newName, groupId }) => {
            updateChat(groupId, (c) => {
                c.group.name = newName
                return c
            })
        })

        socket.on(ServerToClientEvents.removeGroup(), (groupId) => {
            removeChat(groupId)
        })

        socket.on(ServerToClientEvents.online(), ({ userId, value }) => {
            setMembersState((prev) => {
                if(value) {
                    prev[userId] = { online: true, writting: false }
                } else {
                    delete prev[userId]
                }
                return {...prev}
            })
        })

        socket.on(ServerToClientEvents.writting(), ({ userId, value }) => {
            setMembersState((prev) => {
                if(!prev[userId]) {
                    prev[userId] = { online: true, writting: value }
                }

                prev[userId].writting = value
                return {...prev}
            })
        })

        socketRef.current = socket

        return () => {
            socketRef.current?.disconnect()
        }
    }, [token, api])

    const setCurrentChat = (id) => {
        if(!socketRef.current) return
        socketRef.current.emit(ClientToServerEvents.currentGroup(), id)
    }

    const setWritting = (newValue) => {
        if(!socketRef.current) return
        socketRef.current.emit(ClientToServerEvents.writting(), newValue)
    }

    const getSocketId = () => {
        return socketRef.current?.id
    }

    const value = {
        connected,
        setCurrentChat,
        setWritting,
        getSocketId
    }

    return (
        <SocketIoContext.Provider value={value}>{ children }</SocketIoContext.Provider>
    )
}