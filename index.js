const express = require('express')
const { MongoClient } = require('mongodb');

const multer = require('multer')
const upload = multer({ dest: 'products/' })
const app = express()
const cors = require('cors');
var admin = require("firebase-admin");
require('dotenv').config()
const ObjectId = require('mongodb').ObjectId;
const fileUpload = require('express-fileupload');


const port = process.env.PORT || 5000;

//FIREBASE ADMIN INITIALIZATION
var serviceAccount = require('./magpayhub-5fe9a-firebase-adminsdk-2wbpu-bd423174ef.json')

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

//MiddleWere

app.use(cors())
app.use(express.json());
app.use(fileUpload());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.x1ahb.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


async function verifyToken(req, res, next) {
    if (req.headers?.authorization?.startsWith('Bearer ')) {
        const idToken = req.headers.authorization.split('Bearer ')[1];
        try {
            const decodedUser = await admin.auth().verifyIdToken(idToken);
            req.decodedUserEmail = decodedUser.email;
        }
        catch { }
    }
    next();
}


async function run() {
    try {
        await client.connect();
        const database = client.db('MagpyeHub');
        const productsCollection = database.collection('products');
        const newsLaterCollection = database.collection('newslater');
        const addressCollection = database.collection('addressBook');
        const ordersCollection = database.collection('orders');

        //POST API
        // app.post('/products', async (req, res) => {
        //     const title = req.body.title;
        //     const price = req.body.price;
        //     const productCode = req.body.productCode;
        //     const category = req.body.category;
        //     const img = req.files.image;
        //     const imageData = img.data;
        //     const encodedImage = imageData.toString('base64');
        //     const imageBuffer = Buffer.from(encodedImage, 'base64');
        //     const products = {
        //         title,
        //         price,
        //         productCode,
        //         category,
        //         img: imageBuffer
        //     }
        //     const result = await productsCollection.insertOne(products)

        //     res.json(result)
        // })

        app.post('/newsLater', async (req, res) => {
            const email = req.body;
            const result = await newsLaterCollection.insertOne(email);
            console.log(result);
            res.json(result)
        })

        app.post('/addressBook', async (req, res) => {
            const address = req.body;
            const result = await addressCollection.insertOne(address);
            console.log(result);
            res.json(result)
        })
        app.post('/products', async (req, res) => {
            const products = req.body;
            const result = await productsCollection.insertOne(products);
            console.log(result);
            res.json(result)
        })

        // UPDATE API
        app.put('/addressBook/:id', async (req, res) => {
            const id = req.params.id;
            const updatedAddressBook = req.body;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    name: updatedAddressBook.name,
                    email: updatedAddressBook.email
                },
            };
            const result = await addressCollection.updateOne(filter, updateDoc, options)
            res.json(result);
        })

        // Post Order api

        app.post('/orders', async (req, res) => {
            const order = req.body;
            order.createdAt = new Date();
            const result = await ordersCollection.insertOne(order)
            res.json(result)
        })

        // GET API
        app.get('/products', async (req, res) => {
            const category = req.query.category
            const search = req.query.search;
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
            if (search) {
                const searchResult = products.filter(product => product.title.toLowerCase().includes(search))
                res.send(searchResult)
            }

            res.send({
                count,
                products
            });
        })


        app.get('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const product = await productsCollection.findOne(query);
            res.send(product);
        })


        // DELETE API
        app.delete('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await productsCollection.deleteOne(query);
            res.send(result);
        })


        app.get('/addressBook', verifyToken, async (req, res) => {
            const email = req.query.email;
            console.log(email);
            if (req.decodedUserEmail === email) {
                const query = { email: email }
                console.log(query);
                const cursor = addressCollection.find(query)
                const address = await cursor.toArray();
                res.json(address)
            }
            else {
                res.status(401).json({ message: 'User Not Authorized' })
            }
        })



        app.get('/orders', verifyToken, async (req, res) => {
            const email = req.query.email;
            console.log(email);
            if (req.decodedUserEmail === email) {
                const query = { email: email }
                console.log(query);
                const cursor = ordersCollection.find(query)
                const order = await cursor.toArray();
                res.json(order)
            }
            else {
                res.status(401).json({ message: 'User Not Authorized' })
            }
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


