import mongoose, { Document, mongo, Schema, Types} from "mongoose";

export interface ICard {
    _id: mongoose.Types.ObjectId
    title: string
    description: string
    order: number
    assignee?: mongoose.Types.ObjectId
    label?: string
    createdAt: Date

}


export interface IColumn {
    _id: mongoose.Types.ObjectId
    title: string
    order: number
    cards: Types.DocumentArray<ICard & Document>

}

export interface IBoards extends Document {
     name: string
     description: string
     owner: mongoose.Types.ObjectId
     members: mongoose.Types.ObjectId[]
     columns: Types.DocumentArray<IColumn & Document>
     inviteCode: string
     createdAt: Date
     updatedAt: Date
}

const cardSchema = new Schema<ICard> ({
    title:{ type: String, required: true, trim: true },
    description: { type: String, default:''},
    order: {type: Number, required: true, default: 0},
    assignee:{ type: Schema.Types.ObjectId, ref: 'User', default: null},
    label: {
        type: String,
        enum: ['bug', 'feature', 'improvement', 'task', null ],
        default: null,
    },
    
},{timestamps: true})

const columnSchema  = new Schema<IColumn> ({
    title: {type: String, required: true, trim: true},
    order: {type: Number, required: true, default:0},
    cards: [cardSchema],

})

const boardSchema = new Schema<IBoards> ({

    name: {
        type: String,
        required: [true, 'Board name is required'],
        trim: true,
        maxlength:100,
    },
    description:{ type: String, default:'', maxlength:500},
    owner: { type: Schema.Types.ObjectId,ref: 'User'},
    members:[{ type: Schema.Types.ObjectId, ref: 'User'}],
    columns: [columnSchema],

    //Random 8-char code for invite links
    inviteCode: {
        type: String,
        uniqure: true,
        default: () => Math.random().toString(36).substring(2, 10).toUpperCase(),

    },

    
},{timestamps: true})


export const Board = mongoose.model<IBoards>('Board', boardSchema)