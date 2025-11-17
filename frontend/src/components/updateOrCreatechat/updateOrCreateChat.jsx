import { useRef } from 'react'
import { useEffect } from 'react'
import './updateOrCreateChat.css'

export const UpdateOrCreateChat = ({ setOpenDialog, isCreate = false }) => {
    const dialogElmt = useRef(null)
    const dialogContent = useRef(null) 

    useEffect(() => {
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
    
    const closeDialog = () => {
        dialogElmt.current.close()
        document.removeEventListener('click', closeOnOuterClick)
    }

    return (
        <dialog ref={dialogElmt}>
            <article ref={dialogContent}>
                <header>
                    <h3>Group name</h3>

                    <button onClick={closeDialog}>Cerrar</button>
                </header>

                <p>body</p>

                <footer>
                    <button>Crear</button>
                    <button onClick={closeDialog} className='secondary'>Cancelar</button>
                </footer>
            </article>
        </dialog>
    )
}