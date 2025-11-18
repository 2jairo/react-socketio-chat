import { Pool } from 'pg'
import { User, UserWithoutPassword } from 'types/user'
import { Group, JoinGroupUuid } from '../../types/group'
import { MessageWithAuthor, Message } from 'types/messages'
import fp from 'fastify-plugin'

export const GENERAL_GROUP_ID = 1
export const ROOT_ID =1

export class Postgres {
    constructor(private pool: Pool) {}

    // users
    async getUserByUsername(username: string) {
        const res = await this.pool.query<User>(
            'SELECT id, username, password FROM users WHERE username = $1', 
            [username]
        )
        return res.rows.length ? res.rows[0] : null
    }

    async getUserById(id: number) {
        const res = await this.pool.query<User>(
            'SELECT id, username, password FROM users WHERE id = $1', 
            [id]
        )
        return res.rows.length ? res.rows[0] : null
    }

    async createUser(username: string, passwordHash: string) {
        const res = await this.pool.query<User>(
            'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username, password',
            [username, passwordHash]
        )
        return res.rows[0]
    }

    // groups
    async getUserGroups(userId: number) {
        const res = await this.pool.query<Group>(
            `
                SELECT g.*
                FROM groups g
                JOIN group_members gm ON g.id = gm.group_id
                WHERE gm.user_id = $1
            `,
            [userId]
        )
        return res.rows
    }

    async getGroupMembers(groupId: number) {
        const res = await this.pool.query<UserWithoutPassword>(
            `
                SELECT u.id, u.username
                FROM group_members gm
                JOIN users u ON gm.user_id = u.id
                WHERE gm.group_id = $1
            `,
            [groupId]
        )
        return res.rows
    }

    // CREATE TABLE message_seen(
    //     user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    //     message_id INT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    //     seen BOOLEAN NOT NULL DEFAULT FALSE,
    //     PRIMARY KEY (user_id, message_id)
    // )

    async getGroupLastMessage(groupId: number) {
        const res = await this.pool.query<MessageWithAuthor>(
            `
                SELECT u.id as user_id, u.username, m.*
                FROM messages m
                JOIN users u ON m.user_id = u.id
                WHERE m.group_id = $1
                ORDER BY m.id DESC LIMIT 1
            `,
            [groupId]
        )
        return res.rows.length ? res.rows[0] : null
    }

    async createGroup(name: string, ownerId: number) {
        const res = await this.pool.query<Group>(
            'INSERT INTO groups (name, owner_id) VALUES ($1, $2, $3) RETURNING *',
            [name, ownerId]
        )
        return res.rows[0]
    }

    async refreshJoinUuid(groupId: number) {
        const joinUuid = crypto.randomUUID().replaceAll('-', '')
        await this.pool.query(
            `
                INSERT INTO group_join_uuids (group_id, join_uuid)
                VALUES ($1, $2)
                ON CONFLICT (group_id) DO UPDATE SET join_uuid = EXCLUDED.join_uuid
            `,
            [groupId, joinUuid]
        )

        return { join_uuid: joinUuid, group_id: groupId }
    }
    async getJoinUuid({ groupId, joinUuid }: { groupId?: number, joinUuid?: string }) {
        const res = await this.pool.query<JoinGroupUuid>(
            `
                SELECT join_uuid, group_id FROM group_join_uuids 
                WHERE ${joinUuid ? 'join_uuid' : 'group_id'} = $1
            `,
            [joinUuid || groupId]
        )
        return res.rows.length ? res.rows[0] : null
    }

    async getGroupById(groupId: number) {
        const res = await this.pool.query<Group>(
            'SELECT * FROM groups WHERE id = $1',
            [groupId]
        )
        return res.rows.length ? res.rows[0] : null
    }

    async isGroupOwner(groupId: number, userId: number) {
        const res = await this.pool.query<{ exists: boolean }>(
            'SELECT EXISTS(SELECT 1 FROM groups WHERE id = $1 AND owner_id = $2) as exists',
            [groupId, userId]
        )
        return res.rows.length ? res.rows[0].exists : false
    }

    async addUserToGroup(groupId: number, userId: number) {
        await this.pool.query(
            `
                INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)
            `,
            [groupId, userId]
        )
    }

    async removeUserFromGroup(groupId: number, userId: number) {
        await this.pool.query(
            'DELETE FROM group_members WHERE group_id = $1 AND user_id = $2',
            [groupId, userId]
        )
    }

    async deleteGroup(groupId: number, ownerId: number) {
        await this.pool.query(
            'DELETE FROM groups WHERE id = $1 AND owner_id = $2',
            [groupId, ownerId]
        )
    }

    // Group membership check
    async isUserInGroup(groupId: number, userId: number) {
        const res = await this.pool.query<{ exists: boolean }>(
            'SELECT EXISTS(SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2) as exists',
            [groupId, userId]
        )
        return res.rows.length ? res.rows[0].exists : false
    }

    // Messages CRUD
    async createMessage(groupId: number, userId: number, content: string) {
        const res = await this.pool.query<Message>(
            `
                INSERT INTO messages (group_id, user_id, content)
                VALUES ($1, $2, $3)
                RETURNING id, group_id, user_id, content, created_at, updated_at
            `,
            [groupId, userId, content]
        )
        return res.rows[0]
    }

    async getMessageById(messageId: number) {
        const res = await this.pool.query<Message>(
            `
                SELECT id, group_id, user_id, content, created_at, updated_at
                FROM messages WHERE id = $1
            `,
            [messageId]
        )
        return res.rows.length ? res.rows[0] : null
    }

    async listMessagesByGroup(groupId: number, limit = 99999, offset = 0) {
        const res = await this.pool.query<Message>(
            `
                SELECT id, group_id, user_id, content, created_at, updated_at
                FROM messages
                WHERE group_id = $1
                ORDER BY created_at ASC
                LIMIT $2 OFFSET $3
            `,
            [groupId, limit, offset]
        )
        return res.rows
    }

    async updateMessage(messageId: number, content: string) {
        const res = await this.pool.query<Message>(
            `
                UPDATE messages SET content = $2, updated_at = now()
                WHERE id = $1
                RETURNING id, group_id, user_id, content, created_at, updated_at
            `,
            [messageId, content]
        )
        return res.rows.length ? res.rows[0] : null
    }

    async deleteMessage(messageId: number) {
        await this.pool.query(
            `DELETE FROM messages WHERE id = $1`,
            [messageId]
        )
    }

    async getNotSeenCount(userId: number, groupId: number) {
        const resp = await this.pool.query<{ count: number }>(
            `
                SELECT CAST(COUNT(*) as INT) as count FROM messages 
                WHERE group_id = $1 AND id > COALESCE((
                    SELECT last_read_message_id FROM message_reads
                    WHERE group_id = $1 AND user_id = $2
                ), 0)
            `,
            [groupId, userId]
        )
        return resp.rows.length ? resp.rows[0].count : 0
    }

    async markAsSeen(usersId: number[], groupId: number, msgId: number) {
        if (usersId.length === 0) return

        const values = usersId
            .map((userId) => `(${groupId}, ${userId}, ${msgId})`)
            .join(',')

        await this.pool.query(
            `
                INSERT INTO message_reads (group_id, user_id, last_read_message_id)
                VALUES ${values}
                ON CONFLICT (group_id, user_id)
                DO UPDATE SET last_read_message_id = EXCLUDED.last_read_message_id
            `,
        )
    }
}



declare module "fastify" {
    interface FastifyInstance {
        pg: Postgres,
    }
}

export const pgDbPlugin = fp(async (fastify) => {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL!,
    })
    await pool.connect()


    fastify.decorate('pg', new Postgres(pool))
})