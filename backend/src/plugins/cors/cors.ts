import cors from '@fastify/cors'

import fp from 'fastify-plugin'

export const corsPlugin = fp(async (fastify) => {
    await fastify.register(cors, {
        origin: (o, cb) => {
            cb(null, true)
        },
        methods: [ "GET", "HEAD", "POST", "PUT", "DELETE", "CONNECT", "OPTIONS", "TRACE", "PATCH"],
        credentials: true
    })
})