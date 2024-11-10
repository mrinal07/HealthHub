// MongoDB Schema for Car


const LoginStatus ={
    Active: 1,
    InActive: 2,
    Locked: 3,
    Deleted: 4
}
//#region User Schema
const userSchema = new mongoose.Schema({
    Username: String,
    Password: String,
    Email: String,
    Login_Token: String,
    Login_Status: Number,
    
    Status_Enum: Boolean,
    Lock_Id: Number,
    Last_Modify_Date: Date,    
});

// {
    //     "Username": "Mrinal",
//     "Password": "1234",
//     "Email": "Mrinal7331@gmail.com",
//     "Login_Token": "NA",
//     "Login_Status": 1,
//     "Status_Enum": 1,
//     "Lock_Id": 1,
//     "Last_Modify_Date": "2024-11-10T05:21:22.233Z",
// }

//#endregion


//#region Documnent Schema
const documentSchema = new mongoose.Schema({
    User_Id: String,
    Document_Name: String,
    Document_Type: String,
    Document_File_Path: String,
    Document_Upload_Date: Date,
    Document_Expire_Date: Date,

    Status_Enum: Boolean,
    Lock_Id: Number,
    Last_Modify_Date: Date,    

    
});
//#endregion
