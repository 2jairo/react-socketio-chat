import { useContext } from "react"
import { useMemo } from "react"
import { JwtContext } from "../providers/jwt/jwtContext"
import axios from 'axios'

export const useApi = () => {
    const { token } = useContext(JwtContext)
    
    const api = useMemo(() => {
        const instance = axios.create({
            baseURL: 'http://localhost:8900'
        })
    
        instance.interceptors.request.use((conf) => {
            if(token) {
                conf.headers.set('Authorization', `Bearer ${token}`)
            }
            return conf
        })

        return instance
    }, [token])

    return api
}
