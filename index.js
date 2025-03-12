const express = require ('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const jwt = require("jsonwebtoken")
const cookieParser = require('cookie-parser');
const app =express();
const port = process.env.PORT || 5000;


// middlewares
app.use(express.json());
app.use(cors({
  origin:['http://localhost:5173'],
  credentials:true
  

}));
// require('dotenv').config()
app.use(cookieParser())



const uri = `mongodb+srv://${process.env.DB_User}:${process.env.DB_PASS}@cluster0.464po.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
const cookieOption ={
  httpOnly:true,
  secure:false,
  sameSite:true

}
// middlewares--------------------

const verifyToken = (req,res,next)=>{
  const token = req?.cookies?.token;
  if(!token){
  return  res.status(401).send({status:"UnAuthorized Access"})
  }
  jwt.verify(token, process.env.ACCESS_TOKEN,(err,decoded)=>{
    if(err){
      return res.status(401).send({status:"UnAuthorized Access"})
    }
    req.user =decoded
    next()
  })
}

async function run() {
  try {

const userCollection = client.db("travelDB") .collection("userDB");
const dataCollection = client.db("travelDB") .collection("dataDB");
const bookingCollection = client.db("travelDB").collection("bookDB")

// jwt-------------------------------------------------------------

app.post("/jwt",async(req,res)=>{
  const user = req.body;
  const token = jwt.sign(user,process.env.ACCESS_TOKEN,{expiresIn:'1h'})
  res
  .cookie('token',token,cookieOption)
  .send({success:true})
})
app.post('/logout',async(req,res)=>{
  res.clearCookie('token',{...cookieOption,maxAge:0}).send({success:'cookie removed'})
})

//  usermanagement api---------------------------------------------
app.post("/users",async(req,res)=>{
  const users = req.body;
  const result = await userCollection.insertOne(users);
  res.send(result)

})

app.get("/users",async(req,res)=>{

  const cursor = userCollection.find()
  const result= await cursor.toArray()
  res.send(result)
})

app.get("/users/:id",async(req,res)=>{
  const id = req.params.id;
  const query ={_id: new ObjectId(id)}
  const result = await userCollection.findOne(query)
  res.send(result);
})

app.put("/users/:id",async(req,res)=>{
  const id = req.params.id;
  const filter = {_id: new ObjectId(id)};
  const user = req.body
  console.log(user)
  const updateDoc ={
    $set:{
          name: user.name,
          email: user.email
    }
  }
  const options = {upsert:true}
  const result = await userCollection.updateOne(filter,updateDoc,options)
  res.send(result)
})

app.delete("/users/:id",async(req,res)=>{
  const id = req.params.id;
  const qurey = {_id: new ObjectId(id)};
  const result =await userCollection.deleteOne(qurey)
  res.send(result)
})
     



// --------------------------------------------------


// Data API------------------------------------------


app.post("/addData",async(req,res)=>{
  const data = req.body;
  const result = await dataCollection.insertOne(data)
  res.send(result)
})

app.get("/addData",async(req,res)=>{
 
  const cursor = dataCollection.find();
  const result = await cursor.toArray();
  res.send(result) 
})

app.get("/addData/:id",async(req,res)=>{
  const id = req.params.id;
  const qurey = {_id: new ObjectId(id)}
  const result = await dataCollection.findOne(qurey)
  res.send(result)
})

// book api---------------------------------

app.post('/book',async(req,res)=>{
  const bookingData = req.body;
  const result = await bookingCollection.insertOne(bookingData);
  res.send(result)
})

// app.get('/book',async(req,res)=>{
  
//   const cursor=  bookingCollection.find();
//   const result =await cursor.toArray();
//   res.send(result)

// })

app.get('/book',verifyToken,async(req,res)=>{
  // const query = req.query?.email;
  if(req.query?.email !== req.user.email){
    return res.status(403).send({status:"forbidden Access"})
  }
  let query ={};
  if(req.query?.email){
    query = {email: req.query.email}
  }
 console.log(query)
  const result = await bookingCollection.find(query).toArray();
  res.send(result)
})

app.delete('/book/:id',async(req,res)=>{
  const id = req.params.id;
  const query = {_id: new ObjectId(id)};
  const result = await bookingCollection.deleteOne(query);
  res.send(result)
})

app.patch('/book/:id',async(req,res)=>{
  const id =req.params.id;
  const updatedBooking = req.body;
  const filter = {_id: new ObjectId(id)};
  const options ={upsert:true};
  const updateDoc ={
    $set:{
      status: updatedBooking.status
    }
  }
  const result = await bookingCollection.updateOne(filter,updateDoc,options)
  res.send(result)

})
















    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);




app.get('/',(req,res)=>{
    res.send("server is running")
})

app.listen(port,()=>{
    console.log("your server is running on port: ",port)
})