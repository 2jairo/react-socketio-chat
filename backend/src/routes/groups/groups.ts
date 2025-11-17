import fp from 'fastify-plugin'
import { ErrKind, LocalError } from 'error/error'
import { RouteCommonOptions } from 'types/routesCommon'
import { getIdFromParams } from 'types/group'

type CreateGroupBody = { name: string }

export const groupsRoutes = fp((fastify, options: RouteCommonOptions) => {
    fastify.route({
        method: 'GET',
        url: `${options.prefix}`,
        preValidation: [fastify.authenticate],
        handler: async (req, reply) => {
            const groups = await fastify.pg.getUserGroups(req.user.userId)

            const withLastMessage = await Promise.all(
                groups.map(async (g) => {
                    const last_msg = await fastify.pg.getGroupLastMessage(g.id)
                    const not_seen = await fastify.pg.getNotSeenCount(req.user.userId, g.id)
                    const join_uuid = g.owner_id === req.user.userId
                        ? await fastify.pg.getJoinUuid(g.id)
                        : null

                    return { group: g, last_msg, not_seen, join_uuid }
                })
            )
            reply.code(200).send(withLastMessage)
        }
    })

    fastify.route({
        method: 'GET',
        url: `${options.prefix}/details/:groupId`,
        preValidation: [fastify.authenticate],
        handler: async (req, reply) => {
            const groupId = getIdFromParams(req, 'groupId')

            const group = await fastify.pg.getGroupById(groupId)
            if (!group) {
                throw new LocalError(ErrKind.GroupNotFound, 404, 'Group not found')
            }

            const limit = 999_999_999
            const offset = 0
            const members = await fastify.pg.getGroupMembers(groupId)
            const messages = await fastify.pg.listMessagesByGroup(groupId, limit, offset)

            if(messages.length) {
                await fastify.pg.markAsSeen([req.user.userId], groupId, messages[messages.length -1].id)
            }
            
            reply.code(200).send({
                group,
                members,
                messages
            })            
        }
    })

    // Create a group
    fastify.route({
        method: 'POST',
        url: `${options.prefix}/group`,
        preValidation: [fastify.authenticate],
        handler: async (req, reply) => {
            const body = req.body as CreateGroupBody
            if (!body?.name) {
                throw new LocalError(ErrKind.InternalServerError, 400, 'name is required')
            }

            const ownerId = req.user.userId
            const group = await fastify.pg.createGroup(body.name, ownerId)
            
            await fastify.pg.refreshJoinUuid(group.id)
            await fastify.pg.addUserToGroup(group.id, ownerId)

            const user = await fastify.pg.getUserById(ownerId)
        
            await fastify.ioWrapper.newGroup(
                { group, members: [{ username: user!.username, id: ownerId }], messages: [] },
                ownerId
            )
            
            reply.code(201).send({ group })
        }
    })

    fastify.route({
        method: 'GET',
        url: `${options.prefix}/group/join-uuid`,
        preValidation: [fastify.authenticate],
        handler: async (req, reply) => {
            const groupId = getIdFromParams(req, 'groupId')
            const isOwner = await fastify.pg.isGroupOwner(groupId, req.user.userId)
            if (!isOwner) {
                throw new LocalError(ErrKind.Forbidden, 403, 'Only owner can refresh join uuid')
            }

            const uuid = await fastify.pg.getJoinUuid({ groupId })
            reply.code(200).send({ uuid })
        }
    })

    fastify.route({
        method: 'POST',
        url: `${options.prefix}/group/join-uuid/refresh`,
        preValidation: [fastify.authenticate],
        handler: async (req, reply) => {
            const groupId = getIdFromParams(req, 'groupId')
            const isOwner = await fastify.pg.isGroupOwner(groupId, req.user.userId)
            if (!isOwner) {
                throw new LocalError(ErrKind.Forbidden, 403, 'Only owner can refresh join uuid')
            }

            const uuid = await fastify.pg.refreshJoinUuid(groupId)
            reply.code(200).send({ uuid })
        }
    })

    fastify.route({
        method: 'POST',
        url: `${options.prefix}/join/:uuid`,
        preValidation: [fastify.authenticate],
        handler: async (req, reply) => {
            const uuidParam = (req.params as { uuid: string }).uuid
            const uuid = await fastify.pg.getJoinUuid({ joinUuid: uuidParam })
            if(!uuid) {
                //TODO
                return
            }
            
            await fastify.pg.addUserToGroup(uuid.group_id, req.user.userId)
            // fastify.pg.markAsSeen([req.user.userId], uuid.group_id)
            
            const members = await fastify.pg.getGroupMembers(groupId)
            const messages = await fastify.pg.listMessagesByGroup(groupId)
            await fastify.ioWrapper.newGroup(
                { group, members, messages },
                req.user.userId
            )
        }
    })

    // Delete group (owner only)
    fastify.route({
        method: 'DELETE',
        url: `${options.prefix}/group/:groupId`,
        preValidation: [fastify.authenticate],
        handler: async (req, reply) => {
            const groupId = getIdFromParams(req, 'groupId')

            const isOwner = await fastify.pg.isGroupOwner(groupId, req.user.userId)
            if (!isOwner) {
                throw new LocalError(ErrKind.Forbidden, 403, 'Only owner can delete group')
            }

            await fastify.pg.deleteGroup(groupId, req.user.userId)
            fastify.ioWrapper.removeGroup(groupId)
            reply.code(204).send()
        }
    })

    // Add user to group (owner only)
    fastify.route({
        method: 'POST',
        url: `${options.prefix}/user/:userId/group/:groupId`,
        preValidation: [fastify.authenticate],
        handler: async (req, reply) => {
            const groupId = getIdFromParams(req, 'groupId')
            const userId = getIdFromParams(req, 'userId')

            const group = await fastify.pg.getGroupById(groupId)
            if (!group) {
                throw new LocalError(ErrKind.GroupNotFound, 404, 'Group not found')
            }
            if(group.owner_id !== req.user.userId) {
                throw new LocalError(ErrKind.Forbidden, 403, 'Only owner can add users')
            }

            await fastify.pg.addUserToGroup(groupId, userId)
            // fastify.pg.markAsSeen([userId])
            
            const members = await fastify.pg.getGroupMembers(groupId)
            const messages = await fastify.pg.listMessagesByGroup(groupId)


            await fastify.ioWrapper.newGroup(
                { group, members, messages },
                userId
            )
            
            reply.status(200).send()
        }
    })

    // Remove user from group (owner or the user themself)
    fastify.route({
        method: 'DELETE',
        url: `${options.prefix}/user/:userId/group/:groupId`,
        preValidation: [fastify.authenticate],
        handler: async (req, reply) => {
            const groupId = getIdFromParams(req, 'groupId')
            const userId = getIdFromParams(req, 'userId')

            const group = await fastify.pg.getGroupById(groupId)
            if (!group) {
                throw new LocalError(ErrKind.GroupNotFound, 404, 'Group not found')
            }

            if(group.owner_id !== req.user.userId || req.user.userId === userId) {
                throw new LocalError(ErrKind.Forbidden, 403)
            }

            await fastify.pg.removeUserFromGroup(groupId, userId)

            const members = await fastify.pg.getGroupMembers(groupId)
            fastify.ioWrapper.members({ group, members })

            reply.code(204).send()
        }
    })
})