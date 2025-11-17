import { AuthForm as AuthFormComponent } from "../../components/authForm/authForm"

const AuthForm = ({ isLoginMode }) => {
    return (
        <AuthFormComponent isLoginMode={isLoginMode}/>
    )
}
export default AuthForm