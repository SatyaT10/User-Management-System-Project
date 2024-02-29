const express = require("express");
const admin_Routes = express();
const session = require("express-session");
const config=require("../config/config");
const admin_Controllers=require('../controllers/admin_Controllers');
admin_Routes.use(session({secret:config.sessionSecret}));

const auth=require("../Middleware/AdminAuth");

admin_Routes.use(express.json());
admin_Routes.use(express.urlencoded({extends:true}));

const multer=require("multer");
const path=require('path');

admin_Routes.use(express.static('public'));

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, "../public/userImage"));
    },
    filename: function (req, file, cb) {
        const name = Date.now() + '-' + file.originalname;
        cb(null, name);
    }
});
const upload = multer({ storage: storage })


admin_Routes.set('view engine', 'ejs');
admin_Routes.set("views","./views/Admin");



admin_Routes.get('/', auth.isLogout, admin_Controllers.loadLogin);

admin_Routes.post('/',admin_Controllers.verifyLogin);

admin_Routes.get('/home',auth.isLogin,admin_Controllers.loadDeashboard);

admin_Routes.get("/logout",auth.isLogin,admin_Controllers.adminLogout);

admin_Routes.get("/forget",auth.isLogout,admin_Controllers.forgetLoad);

admin_Routes.post("/forget",auth.isLogout,admin_Controllers.forgetPasswordVerifyed);

admin_Routes.get("/forget-password",auth.isLogout,admin_Controllers.forgetPasswordLoad);

admin_Routes.post("/forget-password",admin_Controllers.Reset_Passeord);

admin_Routes.get('/dashboard',auth.isLogin,admin_Controllers.adminDashboard);

admin_Routes.get('/new-user',auth.isLogin,admin_Controllers.loadNewUser);

admin_Routes.get('/new-user',auth.isLogin,admin_Controllers.newUserLoad);

admin_Routes.post('/new-user',upload.single('image'),auth.isLogin,admin_Controllers.addUser);

admin_Routes.get('/edit-user',auth.isLogin,admin_Controllers.editUserLoad);

admin_Routes.post('/edit-user',auth.isLogin,admin_Controllers.updateUser);

admin_Routes.get('/delete-user',auth.isLogin,admin_Controllers.deleteUserLoad);

admin_Routes.get('/export-user',auth.isLogin,admin_Controllers.exportUsers);

admin_Routes.get('/export-user-pdf',auth.isLogin,admin_Controllers.exportUsersInPdf);

admin_Routes.get('*',(req,res)=>{

    res.redirect('/admin');
});
module.exports=admin_Routes;