import './message.css'

export const Message = ({ message, user, isCurrentUser }) => {
    const formatMessageTime = (dateString) => {
        const date = new Date(dateString)
        return date.toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit' 
        })
    }

    function colorFromIdSpread(id) {
        const hue = (id * 137) % 360;  // 137° = golden angle → best spread
        return `hsl(${hue}, 65%, 55%)`;
    }

    return (
        <div className={`message-wrapper ${isCurrentUser ? 'message-own' : 'message-other'}`}>
            <article className="message">
                {!isCurrentUser && (
                    <div className="message-header">
                        <strong className="message-username" style={{ color: colorFromIdSpread(user?.id || 0) }}>
                            {user?.username || 'Desconocido'}
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
