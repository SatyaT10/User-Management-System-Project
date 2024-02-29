const mongoose = require("mongoose");
const cors = require('cors');
mongoose.connect("mongodb://127.0.0.1:27017/User_Managment_System");

const express = require("express");
const app = express();
app.use(cors());
// for user
const userRoute = require('./routes/userRoute');
app.use('/', userRoute);

// for Admin

const adminRoute = require('./routes/adminRoutes');
app.use('/admin', adminRoute);


app.listen(3000, () => {
    console.log("Server connected Secussesfully...");
});