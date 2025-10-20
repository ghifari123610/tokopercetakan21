const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
const uri = "mongodb+srv://nufailghyp_db_user:percetakan21@cluster0.duuleax.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);

let db;

async function connectToMongo() {
    try {
        await client.connect();
        db = client.db('tokopercetakan21'); // You can name your database here
        console.log('Successfully connected to MongoDB Atlas!');
    } catch (err) {
        console.error('Failed to connect to MongoDB', err);
        process.exit(1);
    }
}

// API Endpoints
app.get('/api/transactions', async (req, res) => {
    try {
        const transactions = await db.collection('transactions').find({}).sort({ Timestamp: -1 }).toArray();
        res.json(transactions);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch transactions', error: err });
    }
});

app.post('/api/transactions', async (req, res) => {
    try {
        const transaction = req.body;
        // Add a server-side timestamp for consistency
        transaction.serverTimestamp = new Date();
        const result = await db.collection('transactions').insertOne(transaction);
        res.status(201).json(result);
    } catch (err) {
        res.status(500).json({ message: 'Failed to save transaction', error: err });
    }
});

app.delete('/api/transactions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.collection('transactions').deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'No transaction found with that ID.' });
        }
        res.status(200).json({ message: 'Transaction deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete transaction', error: err });
    }
});

// Start the server
connectToMongo().then(() => {
    app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
    });
});
