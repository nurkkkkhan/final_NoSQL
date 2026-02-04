require('dotenv').config(); // Requirement: Env configuration [cite: 77]
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const app = express();


app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(express.static('public')); 


const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: { title: 'Library NoSQL API', version: '1.0.0' },
    },
    apis: ['./server.js'], 
};
const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));


const client = new MongoClient(process.env.MONGO_URI);
let db;

async function connectDB() {
    try {
        await client.connect();
        db = client.db(process.env.DB_NAME);
        console.log("Connected to MongoDB Atlas");
        await db.collection('books').createIndex({ genre: 1, views: -1 });
    } catch (e) { console.error("Connection Error:", e); }
}
connectDB();

const isAdmin = (req, res, next) => {
    if (req.headers['x-api-key'] === 'admin-secret-token') return next();
    res.status(403).json({ error: "Unauthorized" });
};

app.post('/api/books', async (req, res) => {
    const result = await db.collection('books').insertOne({ ...req.body, views: 0, reviews: [] });
    res.status(201).json(result);
});

app.get('/api/books', async (req, res) => {
    const books = await db.collection('books').find().toArray();
    res.json(books);
});

app.put('/api/books/:id', async (req, res) => {
    const result = await db.collection('books').updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: req.body }
    );
    res.json(result);
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
    res.json(result);
});


app.patch('/api/books/:id/reviews/remove', async (req, res) => {
    const result = await db.collection('books').updateOne(
        { _id: new ObjectId(req.params.id) },
        { $pull: { reviews: { user: req.body.user } } }
    );
    res.json(result);
});

app.delete('/api/books/:id', isAdmin, async (req, res) => {
    const result = await db.collection('books').deleteOne({ _id: new ObjectId(req.params.id) });
    res.json(result);
});

app.get('/api/stats/genres', async (req, res) => {
    const stats = await db.collection('books').aggregate([
        { $group: { _id: "$genre", count: { $sum: 1 }, avgViews: { $avg: "$views" } } },
        { $sort: { count: -1 } }
    ]).toArray();
    res.json(stats);
});

app.get('/api/users/:id/loans', async (req, res) => {
    const loans = await db.collection('loans').find({ userId: req.params.id }).toArray();
    res.json(loans);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server: http://localhost:${PORT}`);
    console.log(`Docs: http://localhost:${PORT}/api-docs`);
});