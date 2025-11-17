import { useState, useContext } from "react"
import { AuthContext } from "../../providers/auth/authContext"
import "./authForm.css"
import { Link } from "react-router-dom"
// import { useNavigate } from "react-router-dom"

export const AuthForm = ({ isLoginMode }) => {
    const { signIn, signUp } = useContext(AuthContext)
    const [formUser, setFormUser] = useState("")
    const [formPassword, setFormPassword] = useState("")
    const [formConfirmPassword, setFormConfirmPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")

        if (!formUser.trim() || !formPassword) {
            setError("Por favor completa usuario y contraseña.")
            return
        }

        if (!isLoginMode && formPassword !== formConfirmPassword) {
            setError("Las contraseñas no coinciden.")
            return
        }

        try {
            setLoading(true)
            if (isLoginMode) {
                await signIn(formUser.trim(), formPassword)
            } else {
                await signUp(formUser.trim(), formPassword)
            }
            setFormUser("")
            setFormPassword("")
            setFormConfirmPassword("")
        } catch {
            if (isLoginMode) {
                setError("No se pudo iniciar sesión. Revisa tus credenciales.")
            } else {
                setError("No se pudo crear la cuenta. Intenta con otro usuario.")
            }
        }

        setLoading(false)
    }

    return (
        <section className="container">
            <form onSubmit={handleSubmit}>
                <h2>{isLoginMode ? "Iniciar sesión" : "Crear cuenta"}</h2>

                {error && (
                    <div role="alert" className="error">
                        {error}
                    </div>
                )}

                <label htmlFor="user">Usuario</label>
                <input
                    name="user"
                    type="text"
                    placeholder="usuario"
                    value={formUser}
                    onChange={(e) => setFormUser(e.target.value)}
                    aria-required="true"
                />

                <label htmlFor="password">Contraseña</label>
                <input
                    name="password"
                    type="password"
                    placeholder="Tu contraseña"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    aria-required="true"
                />

                {!isLoginMode && (
                    <>
                        <label htmlFor="confirm-password">
                            Confirmar contraseña
                        </label>
                        <input
                            id="confirm-password"
                            name="confirm-password"
                            type="password"
                            placeholder="Confirma tu contraseña"
                            value={formConfirmPassword}
                            onChange={(e) => setFormConfirmPassword(e.target.value)}
                            aria-required="true"
                        />
                    </>
                )}

                <button type="submit" disabled={loading}>
                    {loading 
                        ? (isLoginMode ? "Iniciando sesión..." : "Creando cuenta...") 
                        : (isLoginMode ? "Iniciar sesión" : "Crear cuenta")
                    }
                </button>

                {isLoginMode
                    ? <p>No tienes cuenta? <Link to="/signin">Registrate aquí</Link></p>
                    : <p>Ya tienes cuenta? <Link to="/login">Inicia sesión aquí</Link></p>
                }
            </form>
        </section>
    )
}