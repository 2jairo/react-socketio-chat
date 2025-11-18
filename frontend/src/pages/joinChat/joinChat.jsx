import { useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useApi } from "../../hooks/useApi"
import { joinGroupWithUuid } from "../../helpers/axios"

const JoinChat = () => {
    const params = useParams()
    const navigate = useNavigate()
    const api = useApi()

    useEffect(() => {
        const { joinUuid } = params
        if(!joinUuid) {
            navigate('/chats')
        }

        joinGroupWithUuid(api, joinUuid).then(() => {
            navigate('/chats')
        })
    }, [api, params])

    return (
        <></>
    )
}

export default JoinChat