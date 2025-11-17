import { ErrKind, LocalError } from 'error/error'
import { FastifyReply } from 'fastify'
import fp from 'fastify-plugin'
import jwt from 'jsonwebtoken'

export type JwtClaims = {
    userId: number
}

declare module "fastify" {
    interface FastifyRequest {
        user: JwtClaims
    }

    interface FastifyInstance {
        authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>

        generateToken: (claims: JwtClaims) => string
        authenticateToken: (accessToken: string) => Promise<JwtClaims>
    }
}

export const jwtPlugin = fp((fastify) => {
    fastify.decorate('authenticate', async (req, reply) => {
        const authHeader = (req.headers.authorization || req.headers.Authorization)?.toString()

        if (!authHeader || !authHeader?.startsWith('Bearer ')) {
            throw new LocalError(ErrKind.Unauthorized, 401)
        }

        const accessToken = authHeader.split(' ')[1]!
        const claims = await fastify.authenticateToken(accessToken)
        req.user = claims
    })

    fastify.decorate('generateToken', (claims) => {
        //@ts-ignore
        return jwt.sign(
            claims,
            process.env.JWT_SECRET!,
            { expiresIn: `${process.env.JWT_EXPIRES_IN_HOURS!}h` }
        )
    })

    fastify.decorate('authenticateToken', (accessToken) => {
        return new Promise((resolve, reject) => {
            jwt.verify(
                accessToken,
                process.env.JWT_SECRET!,
                (err, decoded) => {
                    if (err) {
                        console.log(err)
                        reject(new LocalError(ErrKind.Unauthorized, 401))
                    } else {
                        resolve(decoded as JwtClaims)
                    }
                }
            )
        })
    })
})