import { AuthProvider } from './providers/auth/authProvider'
import { AppLayout } from './layout'
import { JwtProvider } from './providers/jwt/jwtProvider'
import { SocketIoProvider } from './providers/socket.io/socketIoProvider'
import { ChatsProvider } from './providers/chats/chatsProvider'

function App() {
  return (
    <JwtProvider>
      <AuthProvider>
        <ChatsProvider>
          <SocketIoProvider>
            <AppLayout />
          </SocketIoProvider>
        </ChatsProvider>
      </AuthProvider>
    </JwtProvider>
  )
}

export default App
