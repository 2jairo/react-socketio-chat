import fp from 'fastify-plugin'
import { Server } from 'socket.io'
import fastifySocketIO from 'fastify-socket.io'
import { JwtClaims } from '../jwt/jwt'
import { SocketIoWrapper } from './msgSender'

declare module "fastify" {
    interface FastifyInstance {
        io: Server
        ioWrapper: SocketIoWrapper
    }
}

declare module "socket.io" {
    interface Socket {
        user: JwtClaims
    }
}

export const socketIoPlugin = fp(async (fastify) => {
    await fastify.register(fastifySocketIO, {
        cors: {
            origin(requestOrigin, callback) {
                return callback(null, true)
            },
        }
    })
    fastify.decorate('ioWrapper', new SocketIoWrapper(fastify))
    
    fastify.io.use(async (socket, next) => {
        try {
            const token = socket.handshake.headers.authorization as string

            if (!token) {
                return next(new Error('Authentication error: Token not provided'))
            }

            // Validate token using the existing JWT authentication
            const t = token.split(' ')[1]
            const claims = await fastify.authenticateToken(t)            
            socket.user = claims

            next()
        } catch (error) {
            next(new Error('Authentication error: Invalid token'))
        }
    })

    fastify.io.on('connection', async (socket) => {
        await fastify.ioWrapper.handleConnection(socket)
    })
})