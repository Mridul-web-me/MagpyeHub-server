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
        const ordersCollection = database.collection('orders');

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

        // Post Order api

        app.post('/orders', async (req, res) => {
            const order = req.body;
            order.createdAt = new Date();
            const result = await ordersCollection.insertOne(order)
            res.json(result)
        })



        // GET API
        // GET API
        app.get('/products', async (req, res) => {
            console.log(req.query);
            const category = req.query.category
            const searchText = req.query.search
            if (searchText) {
                cursor = productsCollection.find({ searchText: searchText });

            }

            if (category) {
                cursor = productsCollection.find({ category: category });
            }
            else {
                cursor = productsCollection.find({});
            }
            const page = req.query.page;
            const size = parseInt(req.query.size);
            let products;
            const count = await cursor.count();

            if (page) {
                products = await cursor.skip(page * size).limit(size).toArray();
            }
            else {
                products = await cursor.toArray();
            }

            res.send({
                count,
                products
            });
        })


        app.get('/products/:id', async (req, res) => {
            const id = req.params.id;
            console.log('getting Product');
            const query = { _id: ObjectId(id) };
            const product = await productsCollection.findOne(query);
            res.send(product);
        })
        // app.get('/products?_id', async (req, res) => {
        //     const id = req.params.id;
        //     console.log('getting Product');
        //     const query = { _id: ObjectId(id) };
        //     const product = await productsCollection.find(query);
        //     res.send(product);
        // })




        app.get('/addressBook', async (req, res) => {
            let query = {};
            const email = req.query.email;
            if (email) {
                query = { email: email }
            }
            const cursor = addressCollection.find(query)
            const address = await cursor.toArray();
            res.send(address)
        })


        app.get('/orders', async (req, res) => {
            let query = {};
            const email = req.query.email;
            if (email) {
                query = { email: email }
            }
            const cursor = ordersCollection.find(query)
            const order = await cursor.toArray();
            res.send(order)
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