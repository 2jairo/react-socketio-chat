import { ErrKind, LocalError } from "error/error";
import { FastifyInstance } from "fastify";
import { Socket } from "socket.io";
import { Group } from "types/group";
import { Message } from "types/messages";
import { UserWithoutPassword } from "types/user";

export const ServerToClientEvents = {
    message: () => 'message',
    members: () => 'members',
    newGroup: () => 'newGroup',
    removeGroup: () => 'removeGroup',
    online: () => 'online',
    writting: () => 'writting'
}
export const ClientToServerEvents = {
    currentGroup: () => 'current',
    writting: () => 'writting'
}
export const ServerSideRooms = {
    group: (groupId: number) => `group_${groupId}`,
}

type UserConnectionProps = {
    currentGroup: number | null
    writting: boolean
    socket: Socket
}

class UserConnections {
    conn: { [socketId: string]: UserConnectionProps } = {}
    groups = new Set<number>()

    updateConnection(socketId: string, cb: (c: UserConnectionProps) => UserConnectionProps) {
        this.conn[socketId] = cb(this.conn[socketId])
    }

    removeConnection(socketId: string) {
        delete this.conn[socketId]
        return Object.keys(this.conn).length
    }

    addConnection(socket: Socket) {
        this.conn[socket.id] = {
            currentGroup: null,
            writting: false,
            socket
        }
    }

    isWritting(groupId: number) {
        return Object.values(this.conn)
            .some((props) => props.writting && props.currentGroup === groupId)
    }

    get sockets() {
        return Object.values(this.conn).map((c) => c.socket)
    }
}

export class SocketIoWrapper {
    private users: { [userId: number]: UserConnections } = {}

    constructor(private fastify: FastifyInstance) {}

    async handleConnection(socket: Socket) {
        const userId = socket.user.userId

        if(!this.users[userId]) {
            this.users[userId] = new UserConnections()
        }
        this.users[userId].addConnection(socket)

        console.log(`User ${userId} connected to socket ${socket.id}`)

        socket.on('disconnect', () => {
            const remaining = this.users[userId].removeConnection(socket.id)
            if(remaining === 0) {
                this.online(userId, false)
                delete this.users[userId]
            }

            console.log(`User ${userId} disconnected from socket ${socket.id}`)
        })

        socket.on(ClientToServerEvents.currentGroup(), (group: number) => {
            this.users[userId].updateConnection(socket.id, (c) => {
                c.currentGroup = group
                return c
            })
        })
        socket.on(ClientToServerEvents.writting(), (newValue: boolean) => {
            const user = this.users[userId]
            user.updateConnection(socket.id, (c) => {
                c.writting = newValue
                return c
            })

            const group = user.conn[socket.id].currentGroup
            if(!group) return

            this.writting(group, userId, user.isWritting(group))
        })

        const channels = await this.fastify.pg.getUserGroups(userId)
        this.users[userId].groups = new Set(channels.map(g => g.id))
        await socket.join(channels.map(g => ServerSideRooms.group(g.id)))
        this.online(userId, true)
    }
 
    async message(msg: Message, operation: 'create' | 'update' | 'delete') {
        this.fastify.io
            .to(ServerSideRooms.group(msg.group_id))
            .emit(ServerToClientEvents.message(), { operation, msg })
    }

    writting(groupId: number, userId: number, value: boolean) {
        this.fastify.io
            .to(ServerSideRooms.group(groupId))
            .emit(ServerToClientEvents.writting(), { userId, value })
    }

    online(userId: number, value: boolean) {
        for (const g of this.users[userId].groups) {
            this.fastify.io
                .to(ServerSideRooms.group(g))
                .emit(ServerToClientEvents.online(), { userId, value })
        }
    }

    members(details: { group: Group, members: UserWithoutPassword[] }) {
        this.fastify.io
            .to(ServerSideRooms.group(details.group.id))
            .emit(ServerToClientEvents.members(), details)
    }

    removeGroup(groupId: number) {
        this.fastify.io
            .to(ServerSideRooms.group(groupId))
            .emit(ServerToClientEvents.removeGroup(), groupId)
    }

    async newGroup(
        detailsPartial: { group?: Group, members?: UserWithoutPassword[], messages?: Message[], join_uuid?: string | null },
        newMemberId: number, 
        groupId: number
    ) {
        const group = await this.fastify.pg.getGroupById(groupId)
        if(!group) {
            throw new LocalError(ErrKind.GroupNotFound, 404)
        }
        const details = {
            group: detailsPartial.group || group,
            members: detailsPartial.members || await this.fastify.pg.getGroupMembers(groupId),
            messages: detailsPartial.messages || await this.fastify.pg.listMessagesByGroup(groupId),
            join_uuid: detailsPartial.join_uuid || null
        }

        // notify current members of group
        this.members({ group: details.group, members: details.members })

        // add new member
        const room = ServerSideRooms.group(details.group.id)
        if(this.users[newMemberId]) {
            this.users[newMemberId].groups.add(details.group.id)

            for (const s of this.users[newMemberId].sockets) {
                await s.join(room)
                s.send(ServerToClientEvents.newGroup(), details)
            }
        }
    }
}

// const sockets = await this.fastify.io.in(room).fetchSockets()
