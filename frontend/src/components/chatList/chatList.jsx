import { useContext } from 'react'
import { ChatsContext } from '../../providers/chats/chatsContext'
import './chatList.css'
import { UpdateOrCreateChat } from '../updateOrCreatechat/updateOrCreateChat'
import { useRef } from 'react'

export const ChatList = ({ widthPercent, onSelectChat, selectedChatId }) => {
    const { chats, error, loading } = useContext(ChatsContext)
    const openDialog = useRef(() => {})

    const formatDate = (dateString) => {
        if (!dateString) return ''
        const date = new Date(dateString)
        const now = new Date()
        const diffMs = now - date
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 1) return 'Ahora mismo'
        if (diffMins < 60) return `hace ${diffMins} min`
        if (diffHours < 24) return `hace ${diffHours} h`
        if (diffDays < 7) return `hace ${diffDays} d`
        return date.toLocaleDateString()
    }

    const sortedChats = (a, b) => {
        const diffNotSeen = b.not_seen - a.not_seen
        if (diffNotSeen !== 0) return diffNotSeen

        const timeA = a.last_msg ? new Date(a.last_msg.created_at).getTime() : 0
        const timeB = b.last_msg ? new Date(b.last_msg.created_at).getTime() : 0
        return timeB - timeA
    }

    return (
        <div className='list' style={{width: `${widthPercent}%`}}>
            <UpdateOrCreateChat isCreate={true} setOpenDialog={(d) => openDialog.current = d}/>
            <div className="chat-list-header">
                <h5>Chats</h5>

                <button onClick={(e) => openDialog.current(e)}>Nuevo</button>
            </div>
            
            {error && (
                <article className="chat-list-error">
                    <p>{error}</p>
                </article>
            )}

            {!loading && !error && chats.length === 0 && (
                <div className="chat-list-empty">
                    <p>No hay chats disponibles</p>
                </div>
            )}

            <div className="chat-list-items">
                {!error && chats.toSorted(sortedChats).map((c) => (
                    <article
                        key={c.group.id} 
                        className={`chat-item ${selectedChatId === c.group.id ? 'selected' : ''}`}
                        onClick={() => onSelectChat(c.group.id)}
                    >
                        <div className="chat-item-content">
                            <div className="chat-item-header">
                                <strong>{c.group.name}</strong>

                                {c.last_msg && (
                                    <small className="chat-item-time">
                                        {formatDate(c.last_msg.created_at)}
                                    </small>
                                )}
                            </div>
                            <div className='chat-item-header'>
                                <div className="chat-item-preview">
                                    {c.last_msg ? (
                                        <>
                                            <small className="chat-item-username">
                                                {c.last_msg.username}:
                                            </small>
                                            <small className="chat-item-message">
                                                {c.last_msg.content}
                                            </small>
                                        </>
                                    ) : (
                                        <small className="chat-item-no-messages">
                                            No hay mensajes
                                        </small>
                                    )}
                                </div>
                                
                                {c.not_seen > 0 && (
                                    <div className='chat-item-not-seen'>
                                        <small>{c.not_seen}</small>
                                    </div>
                                )}
                            </div>
                        </div>
                    </article>
                ))}
            </div>
        </div>
    )
}