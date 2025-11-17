import { Link } from 'react-router-dom'
import './header.css'
import { useContext } from 'react'
import { AuthContext } from '../../providers/auth/authContext'

export const Header = () => {
    const { user, signOut } = useContext(AuthContext)

    return (
        <nav>
            <ul>
                <li>
                    <Link to="/">
                        <h2>Chatapp</h2>
                    </Link>
                </li>
            </ul>

            <ul>
                { Boolean(user) && <li><Link to="/chats">Chats</Link></li> }
                {user
                    ? <li><button onClick={signOut}>Cerrar sesión</button></li>
                    : <li><Link to="/login">Iniciar sesión</Link></li>
                }
            </ul>
        </nav>
    )
}