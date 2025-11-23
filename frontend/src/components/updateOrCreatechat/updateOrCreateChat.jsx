import { useRef } from 'react'
import { useEffect } from 'react'
import { useState } from 'react'
import './updateOrCreateChat.css'
import { useContext } from 'react'
import { ChatsContext } from '../../providers/chats/chatsContext'
import { Link } from 'react-router-dom'
import { copyToClipboard } from '../../helpers/copyToClipboard'
import { createChat, updateChat as updateChatAxios, refreshGroupJoinUuid } from '../../helpers/axios'
import { useApi } from '../../hooks/useApi'

export const UpdateOrCreateChat = ({ setOpenDialog, isCreate = false }) => {
    const { currentChat, updateChat } = useContext(ChatsContext)
    const dialogElmt = useRef(null)
    const dialogContent = useRef(null)
    const [newChatName, setNewChatName] = useState('')
    const api = useApi()


    useEffect(() => {
        if(!isCreate && currentChat) {
            setNewChatName(currentChat.group.name)
        }
        setOpenDialog(openDialog)
    }, [])
    
    const closeOnOuterClick = (e) => {
        if(!dialogContent.current.contains(e.target)) {
            closeDialog()
        }
    }

    const openDialog = (e) => {
        e.stopPropagation()
        dialogElmt.current.showModal()
        document.addEventListener('click', closeOnOuterClick)
    }

    const copyJoinUuid = (e) => {
        e.preventDefault()
        copyToClipboard(`${location.origin}/join/${currentChat?.join_uuid}`)
    }

    const refreshJoinUuid = (e) => {
        const groupId = currentChat.group.id

        e.preventDefault()
        refreshGroupJoinUuid(api, groupId).then((resp) => {
            updateChat(groupId, (ch) => {
                ch.join_uuid = resp.data.uuid.join_uuid
                return ch
            })
        })
    }

    const handleSubmit = async (e) => {
        if(e) e.preventDefault()

        if(isCreate) {
            await createChat(api, newChatName)
        } else {
            await updateChatAxios(api, currentChat.group.id, newChatName)
        }
        closeDialog()
    }
    
    const closeDialog = () => {
        dialogElmt.current.close()
        document.removeEventListener('click', closeOnOuterClick)
    }

    return (
        <dialog ref={dialogElmt}>
            <article ref={dialogContent}>
                <header>
                    <h3>{isCreate ? 'Nuevo grupo' : currentChat?.group.name}</h3>
                    <button className='secondary' onClick={closeDialog}>Cerrar</button>
                </header>

                <form onSubmit={handleSubmit}>
                    <label>
                        <p>Nombre:</p>
                        <input type='text' value={newChatName} onChange={(e) => setNewChatName(e.currentTarget.value)} placeholder='Nombre del grupo'/>
                    </label>

                    {!isCreate && currentChat?.join_uuid && (
                        <div>
                            <label>
                                <p>Url de unión</p>

                                <Link to={'/join/' + currentChat.join_uuid}>
                                    <code>{location.origin}/join/{currentChat.join_uuid}</code>
                                </Link>
                            </label>

                            <button onClick={copyJoinUuid}>
                                Copiar
                            </button>
                            <button onClick={refreshJoinUuid}>
                                Actualizar
                            </button>
                        </div>
                    )}


                </form>

                <footer>
                    <button onClick={handleSubmit}>{isCreate ? 'Crear' : 'Actualizar'}</button>
                    <button onClick={closeDialog} className='secondary'>Cancelar</button>
                </footer>
            </article>
        </dialog>
    )
}