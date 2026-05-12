/**
 * In-memory presence store
 * boardId → Map<socketId, { userId, name, color }>
 *
 * This resets on server restart which is fine for a portfolio project.
 * For production you'd use Redis.
 */


export interface RoomMember{
    socketId: string
    userId: string
    name: string
    color: string
}

const rooms = new Map<string, Map<string, RoomMember>>()

export const RoomManager = {
    join(boardId: string, member: RoomMember): void {
        if(!rooms.has(boardId)) {
            rooms.set(boardId, new Map())
        }
        rooms.get(boardId)!.set(member.socketId, member)
    },
    
    /**Remove a socket from a board room */
    leave(boardId:string, socketId: string): void {
        const room = rooms.get(boardId)
        if (!room) return
        room.delete(socketId)
        if (room.size === 0)rooms.delete(boardId)
    },
   /**Remove a socket from all rooms */
    leaveAll(socketId: string): string[] {
        const leftBoards: string[] = []
        for (const [boardId, room] of rooms.entries()) {
            if(room.has(socketId)){
                room.delete(socketId)
                leftBoards.push(boardId)
                if(room.size === 0 ) rooms.delete(boardId)
            }
        }
        return leftBoards
    },

   /** Get all members in a board room */
    getMembers(boardId: string ): RoomMember[] {
        const room = rooms.get(boardId)
        if (!room) return []
        return Array.from(room.values())
    },
    
    /** How many users are in a room */
    getCount(boardId: string): number {
        return rooms.get(boardId)?.size ?? 0
    },

}


