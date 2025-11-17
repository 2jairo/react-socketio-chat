import { AuthContext } from '../../providers/auth/authContext'
import { Message } from '../message/message'
import { ChatsContext } from '../../providers/chats/chatsContext'
import { MessageInput } from '../messageInput/messageInput'
import { useContext } from 'react'
import './currentChat.css'
import { Link } from 'react-router-dom'

export const CurrentChat = () => {
    const { user } = useContext(AuthContext)
    const { currentChat } = useContext(ChatsContext)

    const formatMessageDate = (dateString) => {
        const date = new Date(dateString)
        const today = new Date()
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)

        if (date.toDateString() === today.toDateString()) {
            return 'Hoy'
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Ayer'
        } else {
            return date.toLocaleDateString('es-ES', { 
                month: 'short', 
                day: 'numeric', 
                year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined 
            })
        }
    }

    const copyJoinUrlToClipboard = () => {
        navigator.clipboard.writeText(``);
    }

    // Group messages by date
    const groupedMessages = currentChat.messages.reduce((groups, message) => {
        const date = formatMessageDate(message.created_at)
        if (!groups[date]) {
            groups[date] = []
        }
        groups[date].push(message)
        return groups
    }, {})

    return (
        <div className="current-chat">
            <div className="chat-header">
                <div className="chat-header-info">
                    <h5>{currentChat.group.name}</h5>
                    <small className="chat-members">
                        {currentChat.members.length} miembro{currentChat.members.length !== 1 ? 's' : ''}: {' '}
                        {currentChat.members.map(m => m.username).join(', ')}
                    </small>

                    {currentChat.join_uuid && (
                        <Link to={`/join/${currentChat.join_uuid}`}>
                            {currentChat.join_uuid}
                        </Link>
                    )}
                </div>
            </div>

            <div className="chat-messages">
                {currentChat.messages.length === 0 ? (
                    <div className="no-messages">
                        <p>No hay mensajes todavía. ¡Inicia la conversación!</p>
                    </div>
                ) : (
                    Object.entries(groupedMessages).map(([date, messages]) => (
                        <div key={date} className="message-group">
                            <div className="date-divider">
                                <span>{date}</span>
                            </div>

                            {messages.map((message) => {
                                const messageUser = currentChat.members.find(m => m.id === message.user_id)
                                const isCurrentUser = user?.id === message.user_id

                                return <Message
                                    key={message.id}
                                    message={message}
                                    username={messageUser?.username}
                                    isCurrentUser={isCurrentUser}
                                />
                            })}
                        </div>
                    ))
                )}
            </div>

            <div className="chat-input">
                <MessageInput />
            </div>
        </div>
    )
}