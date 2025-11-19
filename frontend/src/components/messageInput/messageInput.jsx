import { useState } from "react"
import { useApi } from "../../hooks/useApi"
import { createMessage } from '../../helpers/axios'
import { ChatsContext } from "../../providers/chats/chatsContext"
import { useContext } from "react"
import './messageInput.css'
import { useEffect } from "react"

export const MessageInput = () => {
    const { currentChat } = useContext(ChatsContext)
    const api = useApi()
    const [newMessage, setNewMessage] = useState('')
    const [writting, setWritting] = useState(false)

    useEffect(() => {
        setWritting(newMessage !== '')
    }, [newMessage])

    useEffect(() => {
        //TODO
    }, [writting])

    const handleSendMessage = async (e) => {
        e.preventDefault()
        if (!newMessage.trim()) return

        await createMessage(api, currentChat.group.id, newMessage)
        setNewMessage('')
    }

    return (
        <form onSubmit={handleSendMessage}>
            <div className="input-container">
                <input
                    type="text"
                    placeholder="Escribe un mensaje..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                />

                <button type="submit" disabled={!newMessage.trim()}>
                    Enviar
                </button>
            </div>
        </form>
    )
}