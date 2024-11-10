const router = require("express").Router();
const seedData = require("../seedData");
const mongoose = require("mongoose");

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = process.env.mongo_url;

//  latest way of connecting mongodb atlas
async function connectToCluster(uri) {
  let mongoClient;

  try {
    mongoClient = new MongoClient(uri);
    console.log("Connecting to MongoDB Atlas cluster...");
    await mongoClient.connect();
    console.log("Successfully connected to MongoDB Atlas!");

    return mongoClient;
  } catch (error) {
    console.error("Connection to MongoDB Atlas failed!", error);
    process.exit();
  }
}

//#region User CRUD

// Get All or By Id(Specific) User Data
router.get("/get-user", async (req, res) => {
  try {
    mongoClient = await connectToCluster(uri);
    const db = mongoClient.db("health-db");
    const collection = db.collection("login-user");

    let result = [];

    if (
      req.body._id === undefined ||
      req.body._id === "" ||
      req.body._id === null
    ) {
      result = await collection.find({}).toArray();
    } else {
      console.log(req.body._id);
      result = await collection
        .find({
          _id: new ObjectId(req.body._id),
        })
        .toArray();
    }
    res.status(200).send({ result: result, count: result.length });
  } catch (error) {
    res.status(500).send(error);
  } finally {
    await mongoClient.close();
  }
});

// Add and Update User Data
router.post("/add-user", async (req, res) => {
  try {
    // console.log(req.body);
    mongoClient = await connectToCluster(uri);
    const db = mongoClient.db("health-db");
    const collection = db.collection("login-user");

    // console.log(req.body._id);

    const filter = { _id: new ObjectId(req.body._id) }; // Condition to find the document

    const data = {
      $set: {
        Username: req.body.Username,
        Password: req.body.Password,
        Email: req.body.Email,
        Login_Token: req.body.Login_Token,
        Login_Status: req.body.Login_Status,
        Status_Enum: req.body.Status_Enum ?? 0,
        Lock_Id: req.body._id === undefined ? 1 : req.body.Lock_Id + 1,
        Last_Modify_Date: Date.now(),
      },
    };
    const result = await collection.updateOne(filter, data, { upsert: true });

    res.status(200).send({ result: result });
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  } finally {
    // Ensures that the client will close when you finish/error
    await mongoClient.close();
  }
});

// Delete User Data
router.post("/delete-user", async (req, res) => {
  debugger;
  try {
    mongoClient = await connectToCluster(uri);
    const db = mongoClient.db("health-db");
    const collection = db.collection("login-user");

    const filter = { _id: new ObjectId(req.body._id) };
    // console.log(filter);

    const result = await collection.deleteOne(filter);
    // console.log(result);

    result.deletedCount === 1
      ? res.status(200).send({
          data: result,
          success: true,
          message: "User Updated Successfully",
        })
      : res.status(200).send({
          data: result,
          success: false,
          message: "User Not Deleted Server issue",
        });
  } catch (error) {
    res.status(500).send(error);
  } finally {
    // Ensures that the client will close when you finish/error
    await mongoClient.close();
  }
});

//#endregion

//#region Module Export
// If dont write below line will get this error
//    TypeError: Router.use() requires a middleware function but got a Object
module.exports = router;
//#endregion
