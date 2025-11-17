import { useEffect } from 'react'
import { CurrentChat } from './currentChat'
import { useContext } from 'react'
import { ChatsContext } from '../../providers/chats/chatsContext'
import './currentChat.css'

export const CurrentChatWrapper = ({ chatId }) => {
    const { fetchChatDetails, error, loading } = useContext(ChatsContext)

    useEffect(() => {
        if (chatId === null) {
            return
        }
        fetchChatDetails(chatId)
    }, [chatId])

    if (!chatId) {
        return (
            <div className="current-chat-empty">
                <div className="empty-state">
                    <h4>Bienvenido a ChatApp</h4>
                    <p>Selecciona un chat para empezar a conversar</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="current-chat-error">
                <article>
                    <header>
                        <strong>Error</strong>
                    </header>
                    <p>{error}</p>
                    <footer>
                        <button onClick={() => window.location.reload()}>
                            Reintentar
                        </button>
                    </footer>
                </article>
            </div>
        )
    }

    if(loading) {
        return (
            <div className="current-chat-empty">
                <div className="empty-state">
                    <p>Cargando</p>
                </div>
            </div>
        )
    }

    return <CurrentChat />
}
