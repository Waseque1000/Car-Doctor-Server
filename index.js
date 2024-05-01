const express = require("express");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

// ! middle ware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.esfshrg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// const uri = "mongodb://localhost:27017";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

//* TODO:  * jot  er jonno function
const verifyJwt = (req, res, next) => {
  console.log("hitting jot ");
  // console.log(req.headers.authorization);
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res
      .status(401)
      .send({ error: true, message: "unauthorization access" });
  }
  const token = authorization.split(" ")[1];
  console.log(token);
  jwt.verify(token, process.env.ACCESS_TOCKEN_SECRET, (error, decoded) => {
    if (error) {
      return res
        .status(403)
        .send({ error: true, message: "unauthorized access" });
    }
    res.decoded = decoded();
    next();
  });
};

//`  TODO:  Mongo db main code
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    // ! code
    const serviceCollection = client.db("carDoctor01").collection("services");

    // booking er new collection
    const bookingCollection = client.db("carDoctor01").collection("bookings");

    // ? jwt
    app.post("/jwt", (req, res) => {
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOCKEN_SECRET, {
        expiresIn: "1h",
      });
      console.log(token);
      res.send({ token }); // ! ai token ta string er mto show kortase tai {} aita use kore object banano hoise
    });

    app.get("/services", async (req, res) => {
      const cursor = serviceCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // ! service er 1 ta  data er jonno

    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await serviceCollection.findOne(query);
      res.send(result);
    });

    // ` booking  get some
    app.get("/bookings", verifyJwt, async (req, res) => {
      // console.log(req.headers);
      // console.log(req.headers.authorization);

      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email };
      }
      const result = await bookingCollection.find(query).toArray();
      res.send(result);
    });

    // ? bookings update
    app.put("/bookings/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedBookings = req.body;
      console.log(updatedBookings);
      const updateDoc = {
        $set: {
          status: updatedBookings.status,
        },
      };
      const result = await bookingCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    //! bookings - add one
    app.post("/bookings", async (req, res) => {
      const booking = req.body;
      const result = await bookingCollection.insertOne(booking);
      res.send(result);
    });

    // ? delete
    app.delete("/bookings/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookingCollection.deleteOne(query);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("server is ok ");
});

app.listen(port, () => {
  console.log("server ok");
});
