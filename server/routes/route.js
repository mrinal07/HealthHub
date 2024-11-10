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

//#region Documents CRUD

// Get All or By Id(Specific) Document Data
router.get("/get-document", async (req, res) => {
  try {
    mongoClient = await connectToCluster(uri);
    const db = mongoClient.db("health-db");
    const collection = db.collection("document-user");

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

// Add and Update Document Data
router.post("/add-document", async (req, res) => {
  try {
    // console.log(req.body);
    mongoClient = await connectToCluster(uri);
    const db = mongoClient.db("health-db");
    const collection = db.collection("document-user");

    // console.log(req.body._id);

    const filter = { _id: new ObjectId(req.body._id) }; // Condition to find the document

    const data = {
      $set: {
        User_Id: req.body.User_Id,
        Document_Name: req.body.Document_Name,
        Document_Type: req.body.Document_Type,
        Document_File_Path: req.body.Document_File_Path,
        Document_Upload_Date: req.body.Document_Upload_Date,
        Document_Expire_Date: req.body.Document_Expire_Date,
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

// Delete Document Data
router.post("/delete-document", async (req, res) => {
  debugger;
  try {
    mongoClient = await connectToCluster(uri);
    const db = mongoClient.db("health-db");
    const collection = db.collection("document-user");

    const filter = { _id: new ObjectId(req.body._id) };
    // console.log(filter);

    const result = await collection.deleteOne(filter);
    // console.log(result);

    result.deletedCount === 1
      ? res.status(200).send({
          data: result,
          success: true,
          message: "Document Deleted Successfully",
        })
      : res.status(200).send({
          data: result,
          success: false,
          message: "Document Not Deleted Server issue",
        });
  } catch (error) {
    res.status(500).send(error);
  } finally {
    // Ensures that the client will close when you finish/error
    await mongoClient.close();
  }
});

//#endregion

//#region File Management (CRUD)

const multer = require("multer");
const path = require("path");
const fs = require("fs");

let baseDir = path.join(__dirname, "../resources/");

if (!fs.existsSync(baseDir)) {
  fs.mkdirSync(baseDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, baseDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${file.originalname}`);
  },
});

const upload = multer({ storage });

//#region Add Document to file path

// upload.single("image") this name must be same as the name of the input field in the form

router.post("/upload", upload.single("image"), (req, res) => {
  // console.log(baseDir);

  //   console.log("req.body");
  try {
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }

    res.status(200).json({
      message: "File uploaded successfully",
      file: req.file,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
//#endregion

//#region Get Document from file path
// Endpoint to get the PDF file
router.get("/download/:filename", (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(baseDir, filename);
  console.log(filePath);

  // Check if the file exists
  if (fs.existsSync(filePath)) {
    res.download(filePath, filename, (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
      }
    });
  } else {
    res.status(404).json({ error: "File not found" });
  }
});
//#endregion

//#endregion

//#region Module Export
// If dont write below line will get this error
//    TypeError: Router.use() requires a middleware function but got a Object
module.exports = router;
//#endregion
