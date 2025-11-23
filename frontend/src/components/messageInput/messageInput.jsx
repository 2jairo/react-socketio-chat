import { useState } from "react"
import { useApi } from "../../hooks/useApi"
import { createMessage } from '../../helpers/axios'
import { ChatsContext } from "../../providers/chats/chatsContext"
import { useContext } from "react"
import './messageInput.css'
import { useEffect } from "react"
import { SocketIoContext } from "../../providers/socket.io/socketIoContext"

export const MessageInput = () => {
    const { currentChat } = useContext(ChatsContext)
    const { setWritting } = useContext(SocketIoContext)
    const api = useApi()
    const [newMessage, setNewMessage] = useState('')
    const [writting, setWrittingInner] = useState(false)

    useEffect(() => {
        setWrittingInner(newMessage !== '')
    }, [newMessage])

    useEffect(() => {
        setWritting(writting)
    }, [writting])

    const handleSendMessage = async (e) => {
        if(e) e.preventDefault()
        if (!newMessage.trim()) return

        await createMessage(api, currentChat.group.id, newMessage)
        setNewMessage('')
    }

    const handleOnChange = (e) => {
        if(e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            e.stopPropagation()
            handleSendMessage()
        }
    }

    return (
        <form onSubmit={handleSendMessage}>
            <div className="input-container">
                <input type="file" />    

                <textarea
                    type="text"
                    placeholder="Escribe un mensaje..."
                    value={newMessage}
                    onKeyDown={handleOnChange}
                    onChange={(e) => setNewMessage(e.target.value)}
                ></textarea>

                <button type="submit" disabled={!newMessage.trim()}>
                    Enviar
                </button>
            </div>
        </form>
    )
}