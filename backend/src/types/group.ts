import { ErrKind, LocalError } from "error/error"
import { FastifyRequest } from "fastify"

export interface Group {
  id: number
  name: string
  owner_id: number
  is_general: boolean
  members_length: number
}

export interface GroupWithOwnerName extends Group {
  owner_name: string
}

export interface GroupMember {
  group_id: number
  user_id: number
}


export interface JoinGroupUuid {
  group_id: number
  join_uuid: string
}


export const getIdFromParams = (req: FastifyRequest,  prop: string) => {
  const value = (req.params as any)[prop]
  const valueNum = Math.floor(Number.isNaN(Number(value)) ? 0 : Number(value))
  
  if(valueNum < 0) {
    throw new LocalError(ErrKind.InvalidId, 400)
  }
  
  return valueNum
} 