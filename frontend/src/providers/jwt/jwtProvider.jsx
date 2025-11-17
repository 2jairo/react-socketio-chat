import { useState } from "react"
import { JwtContext } from "./jwtContext"

export const JwtProvider = ({ children }) => {
    const [token, setTokenInner] = useState(localStorage.getItem('jwt') || null)

    const setToken = (token) => {
        if(token) {
            localStorage.setItem('jwt', token)
            setTokenInner(token)
        } else {
            localStorage.removeItem('jwt')
            setTokenInner(null)
        }
    }

    return (
        <JwtContext.Provider value={{token, setToken}}>{ children }</JwtContext.Provider>
    )
}