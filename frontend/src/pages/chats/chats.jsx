import { useState, useRef, useContext } from "react"
import { ChatList } from "../../components/chatList/chatList"
import { CurrentChatWrapper } from '../../components/currentChat/currentChatWrapper'
import { ChatsContext } from "../../providers/chats/chatsContext";
import './chats.css'
import { SocketIoContext } from "../../providers/socket.io/socketIoContext";

const Chats = () => {
    const { setCurrentChat: chatsCtxSetCurrentChat } = useContext(ChatsContext)
    const { setCurrentChat: socketioCtxSetCurrentChat } = useContext(SocketIoContext)
    const [widthPercent, setWidthPercent] = useState(30)
    const [isDragging, setIsDragging] = useState(false)
    const [selectedChatId, setSelectedChatId] = useState(null)
    const containerRef = useRef(null)

    const handleMouseDown = () => {
        setIsDragging(true)
    }

    const handleMouseMove = (e) => {
        if (!isDragging) return
        
        const container = containerRef.current
        if (!container) return

        const containerRect = container.getBoundingClientRect()
        const offsetX = e.clientX - containerRect.left
        const newWidthPercent = (offsetX / containerRect.width) * 100

        const constrainedWidth = Math.min(Math.max(newWidthPercent, 15), 50)
        setWidthPercent(constrainedWidth)
    }

    const handleMouseUp = () => {
        setIsDragging(false)
    }

    const handleSelectChat = (chatId) => {
        chatsCtxSetCurrentChat(chatId)
        setSelectedChatId(chatId)
        socketioCtxSetCurrentChat(chatId)
    }

    return (
        <div 
            className="chatsContainer"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            <div className="chatsContent" ref={containerRef}>  
                <ChatList 
                    widthPercent={widthPercent} 
                    onSelectChat={handleSelectChat}
                    selectedChatId={selectedChatId}
                />                
                <div 
                    className="resizer" 
                    onMouseDown={handleMouseDown}
                />
                <CurrentChatWrapper chatId={selectedChatId} />
            </div>
        </div>
    )
}

export default Chats