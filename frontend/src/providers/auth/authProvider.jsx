import { AuthContext } from "./authContext"
import { useState, useCallback } from "react"
import { useApi } from "../../hooks/useApi"
import { useContext } from "react"
import { JwtContext } from "../jwt/jwtContext"
import { useEffect } from "react"

export const AuthProvider = ({ children }) => {
    const { setToken, token } = useContext(JwtContext)
    const [user, setUser] = useState(null)
    const [fetching, setFetching] = useState(true)
    const api = useApi()

    useEffect(() => {
        if(!token) {
            setFetching(false)
            return
        }

        setFetching(true)
        api.get('/api/auth/profile')
            .then(resp => {
                setUser(resp.data)
            })
            .catch(() => {
                signOut()
            })
            .finally(() => {
                setFetching(false)
            })
    }, [])

    const signIn = useCallback(async (username, password) => {
        if (!username || !password) {
            throw new Error('Usuario o contraseña inválidos')
        }
        try {
            setFetching(true)
            const resp = await api.post('/api/auth/login', { username, password })
            setToken(resp.data.token)
            setUser(resp.data.user)
        } catch (error) {
            console.log(error)
        }
        setFetching(false)
    }, [])

    const signUp = useCallback(async (username, password) => {
        if (!username || !password) {
            throw new Error('Usuario o contraseña inválidos')
        }
        try {
            setFetching(true)
            const resp = await api.post('/api/auth/signin', { username, password })
            setToken(resp.data.token)
            setUser(resp.data.user)
        } catch (error) {
            console.log(error)
        }
        setFetching(false)
    }, [])

    const signOut = () => {
        setUser(null)
        setToken(null)
    }

    const value = {
        user,
        fetching,
        signIn,
        signUp,
        signOut,
    }

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    )
}