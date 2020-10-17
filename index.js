//const Mongo = require("./db/mongo");
const express = require("express");
var jwt = require('jsonwebtoken');
const MongoClient = require('mongodb').MongoClient
const app = express();
const cors = require("cors");
let db
const connectionString = 'mongodb+srv://admin:admin@cluster0.x06zv.mongodb.net/upi?retryWrites=true&w=majority';
MongoClient.connect(connectionString, (err, client) => {
    if (err) 
        return console.error(err)
    db = client.db('upi')
    console.log('Connected to Database')

})
app.use(cors());
app.use(express.json()); 

app.listen(5000,()=>{
    console.log("server started on port 5000");
});

app.post("/register",async(req,res) => {
    db.collection('users').findOne({
        "username" : req.body.username
    })
    .then(results => {
        if(results) {
            res.json({"message" : "Account already exists with same user name. Please try login with the password created earlier"})
        } else {
            db.collection('users').insertOne({
                "username" : req.body.username,
                "name" : req.body.name,
                "password" : req.body.password,
                "accountNumber" : Math.floor(10000000 + Math.random() * 90000000)
            }).then(() => {
                res.json({"message" : "Account created successfully."})
            }).catch(error => {
                console.error(error)
                res.json({"message" : "Error creating account. Please try again"})
            })
        }
    })
    .catch(error => console.error(error))
});

app.post("/login",async(req,res) => {
    db.collection('users').findOne({
        "username" : req.body.username, 
        "password" : req.body.password
    })
    .then(results => {
        if(results) {
            const token = jwt.sign({accountNumber: results.accountNumber}, 'supersecret', {"expiresIn" : "2 days"});
            res.json({"token" : token})
        } else {
            res.json({"message" : "Account does not exist, upload csv."})
        }
    })
    .catch(error => console.error(error))
});

app.post("/uploadCsv",async(req,res) => {
    const token = req.headers.token;
    const transactionsData = req.body
    jwt.verify(token, 'supersecret', function(err, decoded){
      if(!err){
        const accountNumber = decoded.accountNumber;
        const transactionsDataWithAccountNumber = transactionsData.map(a=> Object.assign({}, a, {accountNumber}))
        db.collection('transactions').insert(transactionsDataWithAccountNumber)
        res.json(transactionsDataWithAccountNumber)
      } else {
        res.send(err);
      }
    })
});