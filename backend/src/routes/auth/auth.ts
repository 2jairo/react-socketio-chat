import { FastifyReply, FastifyRequest } from 'fastify'
import fp from 'fastify-plugin'
import { ErrKind, LocalError } from 'error/error'
import bcrypt from 'bcryptjs'
import { RouteCommonOptions } from 'types/routesCommon'
import { GENERAL_GROUP_ID, ROOT_ID } from 'plugins/pgDB/db'

type LoginBody = { username: string, password: string }
type SigninBody = { username: string, password: string }

export const authRoutes = fp((fastify, options: RouteCommonOptions) => {
	fastify.route({
		method: 'POST',
		url: `${options.prefix}/login`,
		handler: async (req: FastifyRequest<{ Body: LoginBody }>, reply: FastifyReply) => {
			const { username, password } = req.body || {}

			if (!username || !password) {
				throw new LocalError(ErrKind.InternalServerError, 400, 'username and password are required')
			}

			const dbUser = await fastify.pg.getUserByUsername(username)
			if (!dbUser) {
				throw new LocalError(ErrKind.UserNotFound, 404, 'User not found')
			}

			const isValid = await bcrypt.compare(password, dbUser.password)
			if (!isValid) {
				throw new LocalError(ErrKind.PasswordMismatch, 401, 'Invalid credentials')
			}

			const token = fastify.generateToken({ userId: dbUser.id })
			return reply.status(200).send({
				token,
				user: { username: dbUser.username, id: dbUser.id }
			})
		}
	})

	fastify.route({
		method: 'POST',
		url: `${options.prefix}/signin`,
		handler: async (req: FastifyRequest<{ Body: SigninBody }>, reply: FastifyReply) => {
			const { username, password } = req.body || {}

			if (!username || !password) {
				throw new LocalError(ErrKind.Unauthorized, 400, 'username and password are required')
			}

			const exists = await fastify.pg.getUserByUsername(username)
			if (exists) {
				throw new LocalError(ErrKind.InternalServerError, 409, 'Username already exists')
			}

			const salt = await bcrypt.genSalt(10)
			const passwordHash = await bcrypt.hash(password, salt)

			const user = await fastify.pg.createUser(username, passwordHash)
			await fastify.pg.addUserToGroup(GENERAL_GROUP_ID, user.id)

			const generalLastMsgId = await fastify.pg.getGroupLastMessage(GENERAL_GROUP_ID)
			if(generalLastMsgId) {
				await fastify.pg.markAsSeen([user.id], GENERAL_GROUP_ID, generalLastMsgId.id)
			}

			await fastify.ioWrapper.newGroup(
				{},
				user.id,
				GENERAL_GROUP_ID
			)

			const token = fastify.generateToken({ userId: user.id })
			reply.code(201).send({ token, user: { username: user.username, id: user.id } })
		}
	})

	fastify.route({
		method: 'GET',
		url: `${options.prefix}/profile`,
		preValidation: [fastify.authenticate],
		handler: async (req, reply) => {
			const userId = req.user.userId
			const user = await fastify.pg.getUserById(userId)
			if (!user) {
				throw new LocalError(ErrKind.UserNotFound, 404, 'User not found')
			}
			reply.send({ username: user.username, id: user.id })
		}
	})
})