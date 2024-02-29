const express = require("express");
const user_route = express();
const session = require("express-session");
const config = require("../config/config");
user_route.use(session({ secret: config.sessionSecret }));
const auth = require("../Middleware/auth");
const multer = require("multer");
const path = require("path");

user_route.set('view engine', 'ejs');
user_route.set('views', './views/users');

user_route.use(express.json());
user_route.use(express.urlencoded({ extended: true }));

user_route.use(express.static('public'));

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

const userController = require("../controllers/userController");

user_route.get("/register", auth.islogout, userController.loadRegister);

user_route.post('/register', upload.single('image'), userController.insertUser);

user_route.get('/verify', userController.verifyMail);

user_route.get('/', auth.islogout, userController.loginLoad);

user_route.get('/login', auth.islogout, userController.loginLoad);

user_route.get('/logout', auth.islogin, userController.user_logout);

user_route.post('/login', userController.verifyLogin);

user_route.get('/home', auth.islogin, userController.loadHome);

user_route.get('/forget', auth.islogout, userController.forgetLoad);

user_route.post('/forget', userController.forgetPassword);

user_route.post('/forget-password', userController.forgetPasswordLoad);

user_route.post('/forget-password', userController.resetPassword);

user_route.get('/reverification',userController.reVerificationLoad);

user_route.post('/reverification',userController.sendVerifititionLink);

user_route.get('/edit',auth.islogin,userController.editLoad);

user_route.post('/edit',auth.islogin,upload.single('image'),userController.updateProfile);

module.exports = user_route;