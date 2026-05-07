import mongoose, { Document, Schema} from 'mongoose'

export interface IUser extends Document {
    name: string
    email: string
    password: string
    avatar: string
    color: string
    createdAt: Date
    updatedAt: Date 
}


const userSchema = new Schema<IUser>(
    {
        name:{
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            minlength:2,
            maxlength: 40,
        },

        email: {
            type: String,
            required: [true, 'Email is required'],
            lowercase:true,
            unique: true,
            trim:true,
            match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],

        },

        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: 6,
        },
        avatar:{
            type: String,
            default: ''

        },

        color:{
            type: String,
            default: () => {
                const colors =[
                    '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
                    '#f97316', '#eab308', '#22c55e', '#06b6d4',
                ]
                return colors[Math.floor(Math.random() * colors.length)]
            },
        },
    },
    { timestamps: true}
)

//Dont return password in JSON response
userSchema.methods.toJSON = function ( ) {
    const obj = this.toObject()
    delete obj.passowrd
    return obj

} 

export const User = mongoose.model<IUser>('User', userSchema)