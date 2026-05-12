'use client'

interface OnlineUser{
    socketId:string
    userId: string
    name: string
    color: string
}


interface Props {
    users: OnlineUser[]
    currentUserId: string
}

function getInitials( name: string): string {
    return name
    .split(' ')
    .map((n) => n[0])
    .join(' ')
    .toUpperCase()
    .slice(0,2)
}

export default function PresenceBar({ users, currentUserId }: Props ) {
    const MAX_SHOW = 5
    const visible = users.slice(0, MAX_SHOW)
    const overflow = users.length - MAX_SHOW

    if(users.length ===0) return null

    return(

<div className="flex items-center gap-3">
    <div className="flex items-centetr gap-1.5">
    <span className="relative flex h-2 w-2">
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
    </span>
    <span  className="text-xs text-gray-500 hidden sm:block">
    {users.length} online
</span>
    </div>
    <div className="flex -space-x-2">
        {visible.map((user) =>(
            <div
            key= {user.socketId}
            title= {user.userId === currentUserId ? `${user.name} (you)` : user.name}
            className="relative w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold shadow-sm cursor-default"
        style={{ backgroundColor: user.color}}
    >
    { getInitials (user.name)}
    {user.userId === currentUserId && (
        <span className="absolute inset-0 rounded-full ring-2 ring-indigo-400"  />
    )}
    </div>
        ))}
    {overflow > 0 && (
        <div
         className="w-7 h-7 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-bold shadow-sm"
        title= {`${overflow} more online`}
        >
         +{overflow}
        </div>
    )}

    </div>
</div>
)
}