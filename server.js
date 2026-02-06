require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const app = express();

app.use(express.json());
app.use(express.static('public')); 

mongoose.connect(process.env.MONGO_URI);

// SCHEMA: Includes Description, Embedded Tags, and References
const BookSchema = new mongoose.Schema({
    title: { type: String, required: true },
    author: String,
    description: String, 
    status: { type: String, default: 'Available' },
    tags: [String], 
    exchangeCount: { type: Number, default: 0 },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

// Optimization: Compound Index for search performance (Requirement: 6pts)
BookSchema.index({ title: 1, author: 1 });
const Book = mongoose.model('Book', BookSchema);

// --- 8 REST API ENDPOINTS ---

// 1. CREATE
app.post('/api/books', async (req, res) => res.status(201).json(await Book.create(req.body)));

// 2. READ ALL
app.get('/api/books', async (req, res) => res.json(await Book.find()));

// 3. READ ONE
app.get('/api/books/:id', async (req, res) => res.json(await Book.findById(req.params.id)));

// 4. UPDATE (PUT)
app.put('/api/books/:id', async (req, res) => res.json(await Book.findByIdAndUpdate(req.params.id, req.body, {new:true})));

// 5. DELETE
app.delete('/api/books/:id', async (req, res) => {
    await Book.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
});

// 6. ADVANCED UPDATE ($inc and $set)
app.patch('/api/books/:id/exchange', async (req, res) => {
    res.json(await Book.findByIdAndUpdate(req.params.id, 
        { $inc: { exchangeCount: 1 }, $set: { status: 'Exchanged' } }, { new: true }));
});

// 7. ADVANCED ARRAY UPDATE ($addToSet)
app.patch('/api/books/:id/tags', async (req, res) => {
    res.json(await Book.findByIdAndUpdate(req.params.id, { $addToSet: { tags: req.body.tag } }, { new: true }));
});

// 8. MULTI-STAGE AGGREGATION
app.get('/api/stats', async (req, res) => {
    res.json(await Book.aggregate([
        { $match: { exchangeCount: { $gte: 0 } } },
        { $group: { _id: "$status", total: { $sum: 1 }, avgExchanges: { $avg: "$exchangeCount" } } },
        { $sort: { total: -1 } }
    ]));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Library Server running on port ${PORT}`));