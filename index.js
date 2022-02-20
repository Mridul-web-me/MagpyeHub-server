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
// const stripe = require('stripe')(process.env.STRIPE_SECRET)
// const momo = require("mtn-momo");
// const { useUserProvisioning, useCollections } = require('mtn-momo');
// const subscriptionKey = (process.env.COLLECTIONS_PRIMARY_KEY)


// import axios from "axios";
// import dotenv from "dotenv";
// dotenv.config();


const port = process.env.PORT || 5000;




//FIREBASE ADMIN INITIALIZATION
var serviceAccount = JSON.parse(process.env.SERVICE_FIREBASE_ACCOUNT)
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

//MiddleWere
app.use(cors())
app.use(express.json());
app.use(fileUpload());
app.use((req, res, next) => {
    res.setHeader('Acces-Control-Allow-Origin', '*');
    res.setHeader('Acces-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE');
    res.setHeader('Acces-Contorl-Allow-Methods', 'Content-Type', 'Authorization');
    next();
})


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
    next()
}

async function run() {
    try {
        await client.connect();
        const database = client.db('MagpyeHub');
        const productsCollection = database.collection('products');
        const newsLaterCollection = database.collection('newslater');
        const addressCollection = database.collection('addressBook');
        const ordersCollection = database.collection('orders');
        const usersCollection = database.collection('users');

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
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
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
            res.send({
                count,
                products,

            });
        })

        app.get('/products/search', async (req, res) => {
            const search = req.query.search
            const cursor = productsCollection.find({})
            const result = await cursor.toArray()
            if (search) {
                const searchResult = result.filter(product => product.title.toLowerCase().includes(search.toLowerCase()))
                res.send(searchResult)
            }
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
            const query = { email: email }
            console.log(query);
            const cursor = addressCollection.find(query)
            const address = await cursor.toArray();
            res.json(address)
        })

        app.get('/users', verifyToken, async (req, res) => {
            const users = req.body
            const cursor = usersCollection.find(users)
            const result = await cursor.toArray()
            res.send(result)
        })

        app.put('/users/admin', async (req, res) => {
            const email = req.body;
            console.log('put', email)
            const filter = { email: email };
            console.log(filter)
            const updateDoc = { $set: { role: 'admin' } };
            const result = await usersCollection.updateOne(filter, updateDoc);
            res.json(result);
            // const user = req.body;
            // const filter = { email: user.email };
            // const updateDoc = { $set: { role: 'admin' } };
            // const result = await usersCollection.updateOne(filter, updateDoc);
            // res.json(result);
        })


        app.get('/orders', async (req, res) => {
            const email = req.query.email;
            console.log(email);
            const query = { email: email }
            console.log(query);
            const cursor = ordersCollection.find(query)
            const order = await cursor.toArray();
            res.json(order)
        })


        // Payment
        app.post('/create-payment-intent', async (req, res) => {
            const paymentInfo = req.body;
            const amount = paymentInfo.total * 100;
            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'GBP',
                amount: amount,
                payment_method_types: ['card'],
            });
            res.json({ clientSecret: paymentIntent.client_secret })
        })



        // const { Collections } = momo.create({
        //     callbackHost: process.env.CALLBACK_HOST
        // });

        // const collections = Collections({
        //     userSecret: process.env.COLLECTIONS_USER_SECRET,
        //     userId: process.env.COLLECTIONS_USER_ID,
        //     primaryKey: process.env.COLLECTIONS_PRIMARY_KEY
        // });

        // // Request to pay
        // collections
        //     .requestToPay({
        //         amount: "50",
        //         currency: "EUR",
        //         externalId: "123456",
        //         payer: {
        //             partyIdType: "MSISDN",
        //             partyId: "256774290781"
        //         },
        //         payerMessage: "testing",
        //         payeeNote: "hello"
        //     })
        //     .then(transactionId => {
        //         console.log({ transactionId });

        //         // Get transaction status
        //         return collections.getTransaction(transactionId);
        //     })
        //     .then(transaction => {
        //         console.log({ transaction });

        //         // Get account balance
        //         return collections.getBalance();
        //     })
        //     .then(accountBalance => console.log({ accountBalance }))
        //     .catch(error => {
        //         console.log(error);
        //     });
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


