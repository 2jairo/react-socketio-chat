import { useContext } from "react"
import { AuthContext } from "../providers/auth/authContext"
import { Navigate } from "react-router-dom"

export const AuthGuard = ({ children }) => {
    const { user, fetching } = useContext(AuthContext)

    if(fetching) return null
    return user ? children : <Navigate to="/login" replace />
}

export const NoAuthGuard = ({ children }) => {
    const { user, fetching } = useContext(AuthContext)

    if(fetching) return null
    return user ? <Navigate to="/chats" replace /> : children 
}