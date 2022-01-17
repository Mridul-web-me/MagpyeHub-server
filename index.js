const express = require('express')
const { MongoClient } = require('mongodb');


const app = express()
const cors = require('cors');
require('dotenv').config()
const port = process.env.PORT || 5000;

//MiddleWere
app.use(cors())
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.x1ahb.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


async function run() {
    try {
        await client.connect();
        const database = client.db('MagpyeHub');
        const productsCollection = database.collection('products');

        //POST API
        app.post('/products', async (req, res) => {
            const product = req.body;
            console.log('Hit The Post API', product);

            const result = await productsCollection.insertOne(product);
            console.log(result);
            res.json(result)
        })

    }
    finally {
        // await client.close();
    }
}
run().catch(console.dir)

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`listening at ${port} `)
})