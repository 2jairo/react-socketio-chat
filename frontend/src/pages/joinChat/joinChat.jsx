import { useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useApi } from "../../hooks/useApi"

const JoinChat = () => {
    const params = useParams()
    const navigate = useNavigate()
    const api = useApi()

    useEffect(() => {
        const { joinUuid } = params
        if(!joinUuid) {
            navigate('/chats')
        }

        api.post
    }, [api, params])

    return (
        <></>
    )
}

export default JoinChat