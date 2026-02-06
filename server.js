require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const app = express();

app.use(express.json());
app.use(express.static('public')); 

mongoose.connect(process.env.MONGO_URI);

const Book = mongoose.model('Book', {
    title: String,
    author: String,
    status: { type: String, default: 'Available' },
    tags: [String],
    exchangeCount: { type: Number, default: 0 }
});

app.post('/api/books', async (req, res) => res.send(await Book.create(req.body)));
app.get('/api/books', async (req, res) => res.send(await Book.find()));
app.put('/api/books/:id', async (req, res) => res.send(await Book.findByIdAndUpdate(req.params.id, req.body)));
app.delete('/api/books/:id', async (req, res) => res.send(await Book.findByIdAndDelete(req.params.id)));


app.patch('/api/books/:id/exchange', async (req, res) => {
    res.send(await Book.findByIdAndUpdate(req.params.id, 
        { $inc: { exchangeCount: 1 }, $set: { status: 'Exchanged' } }, { new: true }));
});

app.patch('/api/books/:id/tags', async (req, res) => {
    res.send(await Book.findByIdAndUpdate(req.params.id, { $addToSet: { tags: req.body.tag } }, { new: true }));
});

app.get('/api/stats', async (req, res) => {
    res.send(await Book.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 }, avgExchanges: { $avg: "$exchangeCount" } } }
    ]));
});

app.listen(3000, () => console.log('Server live at http://localhost:3000'));