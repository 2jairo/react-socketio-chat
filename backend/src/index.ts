import dotenv from 'dotenv'
import { errorHandler } from 'error/error'
import Fastify from 'fastify'
import { corsPlugin } from 'plugins/cors/cors'
import { pgDbPlugin } from 'plugins/pgDB/db'
import { socketIoPlugin } from 'plugins/socketio/socket'
import { authRoutes } from 'routes/auth/auth'
import { groupsRoutes } from 'routes/groups/groups'
import { jwtPlugin } from 'plugins/jwt/jwt'
import { messagesRoutes } from 'routes/messages/messages'

dotenv.config()

async function main() {
    const port = parseInt(process.env.PORT!) || 8900
    const host = process.env.HOST! || '127.0.0.1'

    const fastify = Fastify()

    await fastify.register(errorHandler)
    await fastify.register(corsPlugin)
    await fastify.register(pgDbPlugin)
    await fastify.register(socketIoPlugin)
    await fastify.register(jwtPlugin)

    await fastify.register(authRoutes, { prefix: '/api/auth' })
    await fastify.register(groupsRoutes, { prefix: '/api/groups' })
    await fastify.register(messagesRoutes, { prefix: '/api/messages' })

    try {
        await fastify.listen({ host, port })
        console.log(`Server running in http://${host}:${port}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
}

main()