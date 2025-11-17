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
}
export const ClientToServerEvents = {
    currentGroup: () => 'current',
    writting: () => 'writting'
}
export const ServerSideRooms = {
    group: (groupId: number) => `group_${groupId}`,
}

type UserConnectionProps = {
    currentGroup: string | null
    writting: boolean
    socket: Socket
}

class UserConnections {
    private conn: { [socketId: string]: UserConnectionProps } = {}

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

    get sockets() {
        return Object.values(this.conn).map((c) => c.socket)
    }
}

export class SocketIoWrapper {
    private users: { [userId: number]: UserConnections } = {}

    constructor(private fastify: FastifyInstance) {}

    async handleConnection(socket: Socket) {
        if(!this.users[socket.user.userId]) {
            this.users[socket.user.userId] = new UserConnections()
        }
        this.users[socket.user.userId].addConnection(socket)

        console.log(`User ${socket.user.userId} connected to socket ${socket.id}`)

        socket.on('disconnect', () => {
            const remaining = this.users[socket.user.userId].removeConnection(socket.id)
            if(remaining === 0) {
                delete this.users[socket.user.userId]
            }

            console.log(`User ${socket.user.userId} disconnected from socket ${socket.id}`)
        })

        socket.on(ClientToServerEvents.currentGroup(), (group: string) => {
            this.users[socket.user.userId].updateConnection(socket.id, (c) => {
                c.currentGroup = group
                return c
            })
        })
        socket.on(ClientToServerEvents.writting(), (newValue: boolean) => {
            this.users[socket.user.userId].updateConnection(socket.id, (c) => {
                c.writting = newValue
                return c
            })
        })

        const channels = await this.fastify.pg.getUserGroups(socket.user.userId)
        await socket.join(channels.map(g => ServerSideRooms.group(g.id)))
    }
 
    async message(msg: Message, operation: 'create' | 'update' | 'delete') {
        this.fastify.io
            .to(ServerSideRooms.group(msg.group_id))
            .emit(ServerToClientEvents.message(), { operation, msg })
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
        details: { group: Group, members: UserWithoutPassword[], messages: Message[] },
        newMemberId: number, 
    ) {
        // notify current members of group
        this.members({ group: details.group, members: details.members })

        // add new member
        const room = ServerSideRooms.group(details.group.id)
        if(this.users[newMemberId]) {
            for (const s of this.users[newMemberId].sockets) {
                await s.join(room)
                s.send(ServerToClientEvents.newGroup(), details)
            }
        }
    }
}

// const sockets = await this.fastify.io.in(room).fetchSockets()
