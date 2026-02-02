const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

app.use(express.static(path.join(__dirname, 'public')));

const uri = "mongodb+srv://nurkhassenov15_db_user:En17UpERyTNKIlQ5@finalsql.yg7xesj.mongodb.net/";
const client = new MongoClient(uri);
let db;

async function connectDB() {
    try {
        await client.connect();
        db = client.db('LibraryDB');
        console.log("Connected to MongoDB Atlas");
        

        await db.collection('books').createIndex({ title: "text", description: "text" });
    } catch (e) { console.error("Connection Error:", e); }
}
connectDB();

const checkAuth = (req, res, next) => {
    const token = req.headers['authorization'];
    if (token === 'my-secret-admin-key') {
        next();
    } else {
        res.status(401).send({ error: "Unauthorized: Admin access required" });
    }
};

app.post('/api/books', async (req, res) => {
    const newBook = { ...req.body, views: 0, reviews: [], createdAt: new Date() };
    const result = await db.collection('books').insertOne(newBook);
    res.status(201).send(result);
});

app.get('/api/books', async (req, res) => {
    const books = await db.collection('books').find().toArray();
    res.send(books);
});

app.get('/api/stats/genres', async (req, res) => {
    const stats = await db.collection('books').aggregate([
        { $match: { views: { $gte: 0 } } },
        { $group: { _id: "$genre", count: { $sum: 1 }, avgViews: { $avg: "$views" } } },
        { $sort: { count: -1 } }
    ]).toArray();
    res.send(stats);
});

app.put('/api/books/:id', async (req, res) => {
    const result = await db.collection('books').updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: req.body }
    );
    res.send(result);
});

app.patch('/api/books/:id/view', async (req, res) => {
    await db.collection('books').updateOne(
        { _id: new ObjectId(req.params.id) },
        { $inc: { views: 1 } }
    );
    res.sendStatus(204);
});

app.post('/api/books/:id/reviews', async (req, res) => {
    const result = await db.collection('books').updateOne(
        { _id: new ObjectId(req.params.id) },
        { $push: { reviews: { ...req.body, date: new Date() } } }
    );
    res.send(result);
});

app.patch('/api/books/:id/reviews/remove', async (req, res) => {
    const result = await db.collection('books').updateOne(
        { _id: new ObjectId(req.params.id) },
        { $pull: { reviews: { user: req.body.user } } }
    );
    res.send(result);
});


app.delete('/api/books/:id', checkAuth, async (req, res) => {
    const result = await db.collection('books').deleteOne({ _id: new ObjectId(req.params.id) });
    res.send(result);
});

app.get('/api/users/:id/loans', async (req, res) => {
    const loans = await db.collection('loans').find({ userId: req.params.id }).toArray();
    res.send(loans);
});


app.get('/:any*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});