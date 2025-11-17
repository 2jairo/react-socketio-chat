import fp from 'fastify-plugin'

export const enum ErrKind {
    InternalServerError = 'InternalServerError',
    RouteNotFound = 'RouteNotFound',
    InvalidId = 'InvalidId',
    UserNotFound = 'UserNotFound',
    Unauthorized = 'Unauthorized',
    PasswordMismatch = 'PasswordMismatch',
    GroupNotFound = 'GroupNotFound',
    Forbidden = 'Forbidden',
    MessageNotFound = 'MessageNotFound',
    NotGroupMember = 'NotGroupMember'
}

export class LocalError {
    statusCode: number
    errKind: ErrKind
    msg?: string

    constructor(kind: ErrKind, code: number, msg?: string) {
        this.statusCode = code
        this.errKind = kind
        
        if(msg) {
            this.msg = msg
        }
    }
    
    toJSON() {
        return {
            error: this.errKind,
            ...(this.msg ? { message: this.msg } : {})
        }
    }
}

export const errorHandler = fp((fastify) => {
    fastify.setErrorHandler((err, req, reply) => {
        console.log({err})

        if(err instanceof LocalError) {
            reply.status(err.statusCode).send(err.toJSON())
        }

        let localErr = new LocalError(ErrKind.InternalServerError, 500, err.message)
        reply.status(localErr.statusCode).send(localErr.toJSON())
    })


    fastify.setNotFoundHandler((req, reply) => {
        throw new LocalError(ErrKind.RouteNotFound, 404, `Cannot find ${req.method} ${req.url}`)
    })
})