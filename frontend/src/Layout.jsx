import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { Header } from "./components/header/header"
import { Suspense, lazy } from "react"
import { LoadingPage } from "./components/loadingPage/loadingPage"
import { AuthGuard, NoAuthGuard } from './guards/auth'

const AuthForm = lazy(() => import('./pages/auth-form/authForm'))
const Chats = lazy(() => import('./pages/chats/chats'))
const JoinChat = lazy(() => import('./pages/joinChat/joinChat'))

export const AppLayout = () => {
    return (
        <BrowserRouter>
            <Header />

            <Suspense fallback={<LoadingPage />}>
                <Routes>
                    <Route
                        path="/login"
                        element={
                            <NoAuthGuard>
                                <AuthForm isLoginMode={true} />
                            </NoAuthGuard>
                        }
                    />
                    <Route
                        path="/signin"
                        element={
                            <NoAuthGuard>
                                <AuthForm isLoginMode={false} />
                            </NoAuthGuard>
                        }
                    />
                    <Route
                        path="/chats" 
                        element={
                            <AuthGuard>
                                <Chats />
                            </AuthGuard>
                        } 
                    />
                    <Route 
                        path="/join/:joinUuid"
                        element={
                            <AuthGuard>
                                <JoinChat />
                            </AuthGuard>
                        }
                    />
                    <Route 
                        path="*" 
                        element={<Navigate to="/chats" replace />} 
                    />
                </Routes>
            </Suspense>
        </BrowserRouter>
    )
}