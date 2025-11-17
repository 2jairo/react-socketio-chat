import './message.css'

export const Message = ({ message, username, isCurrentUser }) => {
    const formatMessageTime = (dateString) => {
        const date = new Date(dateString)
        return date.toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit' 
        })
    }

    return (
        <div className={`message-wrapper ${isCurrentUser ? 'message-own' : 'message-other'}`}>
            <article className="message">
                {!isCurrentUser && (
                    <div className="message-header">
                        <strong className="message-username">
                            {username || 'Desconocido'}
                        </strong>
                    </div>
                )}

                <div className="message-content">
                    {message.content}
                </div>

                <div className="message-footer">
                    <small className="message-time">
                        {formatMessageTime(message.updated_at || message.created_at)}
                    </small>

                    {message.updated_at && (
                        <small className="message-edited">
                            (editado)
                        </small>
                    )}
                </div>
            </article>
        </div>
    )
}
