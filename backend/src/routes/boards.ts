import { Router, Response } from "express";
import mongoose from "mongoose";
import { Board } from "../models/Board";
import { authMiddleware,AuthRequest } from "../middleware/auth";

const router = Router()

router.use(authMiddleware)

async function getBoardForUsers(boardId: string, userId: string) {
    return Board.findOne({
        _id: boardId,
        $or: [{ owner: userId }, { members: userId }],

    })
    
}


// ═══════════════════════════════════════════════════════════
//  BOARDS
// ═══════════════════════════════════════════════════════════

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId
    const boards = await Board.find({
      $or: [{ owner: userId }, { members: userId }],
    })
      .populate('owner', 'name email color')
      .populate('members', 'name email color')
      .sort({ updatedAt: -1 })
    res.json({ boards })
  } catch {
    res.status(500).json({ error: 'Failed to fetch boards' })
  }
})

// POST /api/boards — create a new board
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { name, description } = req.body
    if (!name) return res.status(400).json({ error: 'Board name is required' })

    const board = await Board.create({
      name,
      description: description || '',
      owner: req.user!.userId,
      members: [],
      // Seed with default columns
      columns: [
        { title: 'To Do', order: 0, cards: [] },
        { title: 'In Progress', order: 1, cards: [] },
        { title: 'Done', order: 2, cards: [] },
      ],
    })

        await board.populate('owner', 'name email color')
    res.status(201).json({ board })
  } catch {
    res.status(500).json({ error: 'Failed to create board' })
  }
})

// GET /api/boards/:id — get single board with all columns + cards
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const board = await getBoardForUsers(req.params.id, req.user!.userId)
    if (!board) return res.status(404).json({ error: 'Board not found or access denied' })

    await board.populate('owner', 'name email color')
    await board.populate('members', 'name email color')
    res.json({ board })
  } catch {
    res.status(500).json({ error: 'Failed to fetch board' })
  }
})

// PATCH /api/boards/:id — rename board
router.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const board = await getBoardForUsers(req.params.id, req.user!.userId)
    if (!board) return res.status(404).json({ error: 'Board not found' })

    const { name, description } = req.body
    if (name) board.name = name
    if (description !== undefined) board.description = description
    await board.save()

    res.json({ board })
  } catch {
    res.status(500).json({ error: 'Failed to update board' })
  }
})


// DELETE /api/boards/:id — only owner can delete
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const board = await Board.findOne({
      _id: req.params.id,
      owner: req.user!.userId, // only owner
    })
    if (!board) return res.status(404).json({ error: 'Board not found or not owner' })

    await board.deleteOne()
    res.json({ message: 'Board deleted successfully' })
  } catch {
    res.status(500).json({ error: 'Failed to delete board' })
  }
})

// POST /api/boards/:id/join — join board via invite code
router.post('/join/:inviteCode', async (req: AuthRequest, res: Response) => {
  try {
    const board = await Board.findOne({ inviteCode: req.params.inviteCode })
    if (!board) return res.status(404).json({ error: 'Invalid invite code' })

    const userId = new mongoose.Types.ObjectId(req.user!.userId)
    const isOwner = board.owner.equals(userId)
    const isMember = board.members.some((m) => m.equals(userId))

    if (isOwner || isMember) {
      return res.json({ message: 'Already a member', board })
    }

    board.members.push(userId)
    await board.save()
    await board.populate('owner', 'name email color')
    await board.populate('members', 'name email color')

    res.json({ message: 'Joined board successfully', board })
  } catch {
    res.status(500).json({ error: 'Failed to join board' })
  }
})

// ═══════════════════════════════════════════════════════════
//  COLUMNS
// ═══════════════════════════════════════════════════════════

// POST /api/boards/:id/columns — add a column
router.post('/:id/columns', async (req: AuthRequest, res: Response) => {
  try {
    const board = await getBoardForUsers(req.params.id, req.user!.userId)
    if (!board) return res.status(404).json({ error: 'Board not found' })

    const { title } = req.body
    if (!title) return res.status(400).json({ error: 'Column title is required' })

    const order = board.columns.length
    board.columns.push({ _id: new mongoose.Types.ObjectId(), title, order, cards: [] })
    await board.save()

    const newColumn = board.columns[board.columns.length - 1]
    res.status(201).json({ column: newColumn })
  } catch {
    res.status(500).json({ error: 'Failed to add column' })
  }
})

// PATCH /api/boards/:id/columns/:columnId — rename column
router.patch('/:id/columns/:columnId', async (req: AuthRequest, res: Response) => {
  try {
    const board = await getBoardForUsers(req.params.id, req.user!.userId)
    if (!board) return res.status(404).json({ error: 'Board not found' })

   const column = board.columns.find(
  (c) => c._id.toString() === req.params.columnId
)
    if (!column) return res.status(404).json({ error: 'Column not found' })

    const { title } = req.body
    if (title) column.title = title
    await board.save()

    res.json({ column })
  } catch {
    res.status(500).json({ error: 'Failed to update column' })
  }
})

// DELETE /api/boards/:id/columns/:columnId — delete column + all its cards
router.delete('/:id/columns/:columnId', async (req: AuthRequest, res: Response) => {
  try {
    const board = await getBoardForUsers(req.params.id, req.user!.userId)
    if (!board) return res.status(404).json({ error: 'Board not found' })

    const colIndex = board.columns.findIndex(
      (c) => c._id.toString() === req.params.columnId
    )
    if (colIndex === -1) return res.status(404).json({ error: 'Column not found' })

    board.columns.splice(colIndex, 1)
    await board.save()

    res.json({ message: 'Column deleted' })
  } catch {
    res.status(500).json({ error: 'Failed to delete column' })
  }
})

// ═══════════════════════════════════════════════════════════
//  CARDS
// ═══════════════════════════════════════════════════════════

// POST /api/boards/:id/columns/:columnId/cards — add card
router.post('/:id/columns/:columnId/cards', async (req: AuthRequest, res: Response) => {
  try {
    const board = await getBoardForUsers(req.params.id, req.user!.userId)
    if (!board) return res.status(404).json({ error: 'Board not found' })

    const column = board.columns.find(
  (c) => c._id.toString() === req.params.columnId
)
    if (!column) return res.status(404).json({ error: 'Column not found' })

    const { title, description, label, assignee } = req.body
    if (!title) return res.status(400).json({ error: 'Card title is required' })

    const order = column.cards.length
    column.cards.push({
      _id: new mongoose.Types.ObjectId(),
      title,
      description: description || '',
      order,
      label: label || null,
      assignee: assignee || null,
      createdAt: new Date(),
    })

    await board.save()
    const newCard = column.cards[column.cards.length - 1]
    res.status(201).json({ card: newCard })
  } catch {
    res.status(500).json({ error: 'Failed to add card' })
  }
})

// PATCH /api/boards/:id/columns/:columnId/cards/:cardId — edit card
router.patch(
  '/:id/columns/:columnId/cards/:cardId',
  async (req: AuthRequest, res: Response) => {
    try {
      const board = await getBoardForUsers(req.params.id, req.user!.userId)
      if (!board) return res.status(404).json({ error: 'Board not found' })

      const column = board.columns.find(
  (c) => c._id.toString() === req.params.columnId
)
      if (!column) return res.status(404).json({ error: 'Column not found' })

     const card = column.cards.find(
  (c) => c._id.toString() === req.params.cardId
)
      if (!card) return res.status(404).json({ error: 'Card not found' })

      const { title, description, label, assignee } = req.body
      if (title !== undefined) card.title = title
      if (description !== undefined) card.description = description
      if (label !== undefined) card.label = label
      if (assignee !== undefined) card.assignee = assignee

      await board.save()
      res.json({ card })
    } catch {
      res.status(500).json({ error: 'Failed to update card' })
    }
  }
)

// DELETE /api/boards/:id/columns/:columnId/cards/:cardId — delete card
router.delete(
  '/:id/columns/:columnId/cards/:cardId',
  async (req: AuthRequest, res: Response) => {
    try {
      const board = await getBoardForUsers(req.params.id, req.user!.userId)
      if (!board) return res.status(404).json({ error: 'Board not found' })

      const column = board.columns.find(
  (c) => c._id.toString() === req.params.columnId
)
      if (!column) return res.status(404).json({ error: 'Column not found' })

      const cardIndex = column.cards.findIndex(
        (c) => c._id.toString() === req.params.cardId
      )
      if (cardIndex === -1) return res.status(404).json({ error: 'Card not found' })

      column.cards.splice(cardIndex, 1)
      await board.save()

      res.json({ message: 'Card deleted' })
    } catch {
      res.status(500).json({ error: 'Failed to delete card' })
    }
  }
)

// PATCH /api/boards/:id/move-card — move card between columns
router.patch('/:id/move-card', async (req: AuthRequest, res: Response) => {
  try {
    const board = await getBoardForUsers(req.params.id, req.user!.userId)
    if (!board) return res.status(404).json({ error: 'Board not found' })

    const { cardId, fromColumnId, toColumnId, newOrder } = req.body

    const fromColumn = board.columns.find(
  (c) => c._id.toString() === fromColumnId
)

const toColumn = board.columns.find(
  (c) => c._id.toString() === toColumnId
)
    if (!fromColumn || !toColumn) {
      return res.status(404).json({ error: 'Column not found' })
    }

    const cardIndex = fromColumn.cards.findIndex(
      (c) => c._id.toString() === cardId
    )
    if (cardIndex === -1) return res.status(404).json({ error: 'Card not found' })

    // Remove from source column
    const [card] = fromColumn.cards.splice(cardIndex, 1)
    card.order = newOrder

    // Insert into target column at correct position
    toColumn.cards.splice(newOrder, 0, card)

    // Re-order remaining cards
    toColumn.cards.forEach((c, i) => { c.order = i })
    fromColumn.cards.forEach((c, i) => { c.order = i })

    await board.save()
    res.json({ board })
  } catch {
    res.status(500).json({ error: 'Failed to move card' })
  }
})

export default router