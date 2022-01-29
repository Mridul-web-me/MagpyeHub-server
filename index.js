const express = require('express')
const { MongoClient } = require('mongodb');


const app = express()
const cors = require('cors');
require('dotenv').config()
const ObjectId = require('mongodb').ObjectId;
const fileUpload = require('express-fileupload');

const port = process.env.PORT || 5000;

//MiddleWere
app.use(cors())
app.use(express.json());
app.use(fileUpload());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.x1ahb.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


async function run() {
    try {
        await client.connect();
        const database = client.db('MagpyeHub');
        const productsCollection = database.collection('products');
        const newsLaterCollection = database.collection('newslater');
        const addressCollection = database.collection('addressBook');

        //POST API
        app.post('/products', async (req, res) => {
            // const product = req.body;
            // console.log('Hit The Post API', product);

            // const result = await productsCollection.insertOne(product);
            // console.log(result);
            // res.json(result)
            console.log('body', req.body);
            console.log('files', req.files);
            res.json({ success: true })
        })

        app.post('/newsLater', async (req, res) => {
            const email = req.body;
            console.log('Hit The Post API', email);

            const result = await newsLaterCollection.insertOne(email);
            console.log(result);
            res.json(result)
        })

        app.post('/addressBook', async (req, res) => {
            const address = req.body;
            console.log('Hit The Post API', address);

            const result = await addressCollection.insertOne(address);
            console.log(result);
            res.json(result)
        })



        // GET API
        // GET API
        app.get('/products', async (req, res) => {
            const cursor = productsCollection.find({});
            const products = await cursor.toArray();
            res.send(products);
        })


        app.get('/products/:id', async (req, res) => {
            const id = req.params.id;
            console.log('getting Product');
            const query = { _id: ObjectId(id) };
            const product = await productsCollection.findOne(query);
            res.send(product);
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