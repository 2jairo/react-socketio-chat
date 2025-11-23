import fp from 'fastify-plugin'
import { RouteCommonOptions } from 'types/routesCommon'
import { ErrKind, LocalError } from 'error/error'
import { getIdFromParams } from 'types/group'

type CreateMessageBody = { content: string }
type UpdateMessageBody = { content: string }

export const messagesRoutes = fp((fastify, options: RouteCommonOptions) => {
	// Create a message in a group
	fastify.route({
		method: 'POST',
		url: `${options.prefix}/group/:groupId`,
		preValidation: [fastify.authenticate],
		handler: async (req, reply) => {
            const { content } = (req.body as CreateMessageBody) || {}
			const groupId = getIdFromParams(req, 'groupId')

			if (!content || !content.trim()) {
				throw new LocalError(ErrKind.InternalServerError, 400, 'content is required')
			}

			const isMember = await fastify.pg.isUserInGroup(groupId, req.user.userId)
			if (!isMember) {
				throw new LocalError(ErrKind.NotGroupMember, 403, 'User is not a member of the group')
			}

			const message = await fastify.pg.createMessage(groupId, req.user.userId, content.trim())

			await fastify.ioWrapper.message(message, 'create')				
			reply.code(201).send()
		}
	})

	// Update a message (author only)
	fastify.route({
		method: 'PATCH',
		url: `${options.prefix}/message/:messageId`,
		preValidation: [fastify.authenticate],
		handler: async (req, reply) => {
			const messageId = getIdFromParams(req, 'messageId')
			const { content } = (req.body as UpdateMessageBody) || {}

			if (!content || !content.trim()) {
				throw new LocalError(ErrKind.InternalServerError, 400, 'content is required')
			}

			const existing = await fastify.pg.getMessageById(messageId)
			if (!existing) {
				throw new LocalError(ErrKind.MessageNotFound, 404, 'Message not found')
			}

			// only author can update
			if (existing.user_id !== req.user.userId) {
				throw new LocalError(ErrKind.Forbidden, 403, 'Only the author can update this message')
			}

			const updated = await fastify.pg.updateMessage(messageId, content.trim())
			fastify.ioWrapper.message(updated!, 'update')

			reply.code(200).send()
		}
	})

	// Delete a message (author or group owner)
	fastify.route({
		method: 'DELETE',
		url: `${options.prefix}/message/:messageId`,
		preValidation: [fastify.authenticate],
		handler: async (req, reply) => {
			const messageId = getIdFromParams(req, 'messageId')

			const msg = await fastify.pg.getMessageById(messageId)
			if (!msg) {
				throw new LocalError(ErrKind.MessageNotFound, 404)
			}

			const group = await fastify.pg.getGroupById(msg.group_id)
			if (!group) {
				throw new LocalError(ErrKind.GroupNotFound, 404)
			}

			const isAuthor = msg.user_id === req.user.userId
			const isGroupOnwer = group.owner_id === req.user.userId
			if (!isAuthor && !isGroupOnwer) {
				throw new LocalError(ErrKind.Forbidden, 403, 'Not allowed to delete this message')
			}

			await fastify.pg.deleteMessage(messageId)
			fastify.ioWrapper.message(msg, 'delete')
			
			reply.code(204).send()
		}
	})
})