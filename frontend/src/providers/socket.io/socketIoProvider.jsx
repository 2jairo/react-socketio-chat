import { ServerToClientEvents, SocketIoContext, ClientToServerEvents } from './socketIoContext'
import { io } from 'socket.io-client'
import { JwtContext } from '../jwt/jwtContext'
import { useRef, useEffect, useState, useContext } from 'react'
import { ChatsContext } from '../chats/chatsContext'


export const SocketIoProvider = ({ children }) => {
    const { token } = useContext(JwtContext)
    const { updateChat, addChat, removeChat, setMembersState } = useContext(ChatsContext)
    const socketRef = useRef(null)
    const [connected, setConnected] = useState(false)

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
        socket.onAny((event, args) => {
            console.log({ event, args })
        })

        socket.on(ServerToClientEvents.message(), ({ msg, operation }) => {
            updateChat(msg.group_id, (c) => {
                if (operation === 'create') {
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
                return c
            })
        })

        socket.on(ServerToClientEvents.members(), ({ members, group }) => {
            updateChat(group.id, (c) => {
                c.membes = members
                return c
            })
        })
        socket.on(ServerToClientEvents.newGroup(), ({ members, group, messages }) => {
            let last_msg = null
            if(messages.length) {
                const lastMsg = messages[messages.length -1]
                const author = members.find(member => member.id === lastMsg.user_id)
                last_msg = { ...lastMsg, username: author.username }
            }
            addChat({ group, members, messages, last_msg, not_seen: 0 })
        })

        socket.on(ServerToClientEvents.removeGroup(), (groupId) => {
            removeChat(groupId)
        })

        socket.on(ServerToClientEvents.online(), ({ userId, value }) => {
            setMembersState((prev) => {
                if(!prev[userId]) prev[userId] = { online: false, writting: false }

                prev[userId].online = value
                return {...prev}
            })
        })

        socket.on(ServerToClientEvents.writting(), ({ userId, value }) => {
            
        })

        socketRef.current = socket

        return () => {
            socketRef.current?.disconnect()
        }
    }, [token])

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