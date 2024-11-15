const router = require("express").Router();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { createSecretToken } = require("../jwt/SecretToken"); // Importing the Secret Token
const { userVerification } = require("../middlewares/AuthMiddleware"); // Importing the Auth Middleware
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
 
//#region User 

// Get All or By Id(Specific) User Data
router.get("/get-user",userVerification , async (req, res) => {
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

    const filter = { _id: new ObjectId(req.body._id) }; // Condition to find the document

    const data = {
      $set: {
        Username: req.body.Username,
        Password: hashPassword,
        Email: req.body.Email,
        Login_Token: req.body.Login_Token,
        Login_Status: req.body.Login_Status,
        Status_Enum: req.body.Status_Enum ?? 0,
        Lock_Id: req.body._id === undefined ? 1 : req.body.Lock_Id + 1,
        Last_Modify_Date: Date.now(),
      },
    };
    const result = await collection.updateOne(filter, data, {
      upsert: true,
    });

    res.status(200).send({ result: result });
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  } finally {
    // Ensures that the client will close when you finish/error
    await mongoClient.close();
  }
});

// Signup User
router.post("/signup-user", async (req, res) => {
  try {
    // console.log(req.body);
    mongoClient = await connectToCluster(uri);
    const db = mongoClient.db("health-db");
    const collection = db.collection("login-user");

    // Validation for existing user
    email = req.body.Email;
    const existingUser = await collection.findOne({ Email: email });
    if (existingUser) {
      return res.json({ message: "User already exists" });
    }

    const token = createSecretToken(email);

    let hashPassword = "";

    // console.log(token);
    const saltRounds = 12;
    hashPassword = await bcrypt.hash(req.body.Password, saltRounds);
    // console.log("Hashed password:", hashPassword);

    const data = {
      Username: req.body.Username,
      Password: hashPassword,
      Email: req.body.Email,
      Login_Token: token,
      Login_Status: req.body.Login_Status,
      Status_Enum: req.body.Status_Enum ?? 0,
      Lock_Id: 1,
      Last_Modify_Date: Date.now(),
    };
    const result = await collection.insertOne(data);

    res.cookie("token", token, {
      withCredentials: true,
      httpOnly: false,
    });

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

// Login User
router.post("/login-user", async (req, res) => {
  try {
    const password = req.body.Password;
    const username = req.body.Username;
    const email = req.body.Email;

    // Validate the user input
    if (!username || !password) {
      return res.json({ message: "All fields are required" });
    }

    mongoClient = await connectToCluster(uri);
    const db = mongoClient.db("health-db");
    const collection = db.collection("login-user");

    const existingUser = await collection.findOne({ Username: username });

    if (!existingUser) {
      return res.json({
        data: existingUser,
        success: false,
        message: "Incorrect email, please check again",
      });
    } else {
      const storedHashedPassword = existingUser.Password;
      const userInputPassword = password;

      bcrypt.compare(userInputPassword, storedHashedPassword, (err, result) => {
        if (err) {
          // Handle error
          console.error("Error comparing passwords:", err);
          return;
        }
        
        // console.error(existingUser);

        if (result && existingUser.Username === username) {
          // Passwords match, authentication successful
        //   console.error(result);
          const token = createSecretToken(email);
          console.log("Passwords match! User authenticated.");

          res.cookie("token", token, {
            withCredentials: true,
            httpOnly: false,
          });
          res.status(200).send({
            data: result,
            success: true,
            message: "User Authenticated",
          });
        } else {
          // Passwords don't match, authentication failed
          console.log("Passwords do not match! Authentication failed.");
          res.status(200).send({
            data: result,
            success: false,
            message: "User Not Authenticated",
          });
        }
      });
    }

    // console.log(existingUser);
  } catch (error) {
    res.status(500).send(error);
  } finally {
    // await mongoClient.close();
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

//#region Documents CRUD + File Management (CRUD)
// router.post("/upload", upload.single("image"), async (req, res) => {
//     // console.log(baseDir);

//     //   console.log("req.body");
//     try {
//       mongoClient = await connectToCluster(uri);
//       const db = mongoClient.db("health-db");
//       const collection = db.collection("document-user");

//       console.log(req.body);

//       const filter = { _id: new ObjectId(req.body._id) }; // Condition to find the document

//       const data = {
//         $set: {
//           User_Id: req.body.User_Id,
//           Document_Name: req.body.Document_Name,
//           Document_Type: req.body.Document_Type,
//           Document_File_Path: req.body.Document_File_Path,
//           Document_Upload_Date: req.body.Document_Upload_Date,
//           Document_Expire_Date: req.body.Document_Expire_Date,
//           Status_Enum: req.body.Status_Enum ?? 0,
//           Lock_Id: req.body._id === undefined ? 1 : req.body.Lock_Id + 1,
//           Last_Modify_Date: Date.now(),
//         },
//       };

//       if (!req.file) {
//         return res.status(400).send("No file uploaded.");
//       }

//       const result = await collection.updateOne(filter, data, { upsert: true });

//       // res.status(200).send({ result: result });

//       res.status(200).json({
//         message: "File uploaded successfully",
//         file: req.file,
//         result: result
//       });
//     } catch (error) {
//       res.status(500).json({ error: error.message });
//     }
//   });
//#endregion

//#region Module Export
// If dont write below line will get this error
//    TypeError: Router.use() requires a middleware function but got a Object
module.exports = router;
//#endregion
