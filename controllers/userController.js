const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const nodemailer = require("nodemailer");
const rendomstring = require("randomstring");

const config = require("../config/config");


const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;
    } catch (error) {
        console.log(error.message);
    }
}

// for send mail

const sendVerifyMail = async (name, email, user_id) => {
    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: config.emailUser,
                pass: config.emailPassword
            }


        });
        const mailOptions = {
            from: config.emailUser,
            to: email,
            subject: 'for Verification mail',
            html: '<p>Hii' + name + ', please click here to <a href="http://127.0.0.1:3000/verify?id=' + user_id + '">Verify </a>your mail.</p>'
        }
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);

            }
            else {
                console.log("Email has been sent:-", info.response);
            }
        })

    } catch (error) {
        console.log(error.message);
    }
}

// for Reset password send mail

const sendResetPasswordMail = async (name, email, token) => {
    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: config.emailUser,
                pass: config.emailPassword
            }
        });
        const mailOptions = {
            from: config.emailUser,
            to: email,
            subject: 'for Reset Password  mail',
            html: '<p>Hii' + name + ', please click here to <a href="http://127.0.0.1:3000/forget-password?token=' + token + '">Reset </a> your password.</p>'
        }
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);

            }
            else {
                console.log("Email has been sent:-", info.response);
            }
        })


    } catch (error) {
        console.log(error.message);
    }
}

const loadRegister = async (req, res) => {
    try {
        res.render('registrations');
    } catch (error) {
        console.log(error.message);
    }
}

const insertUser = async (req, res) => {

    try {
        const reqBody = req.body;
        const { name, email, mno, password } = reqBody
        console.log("reqbody value", reqBody)

        if (!name || !email || !mno || !password)
            return send.status(400).json({ success: false, message: "All fileds are required" });

        const spassword = await securePassword(password);
        const user = new User({
            name: name,
            email: email,
            mobile: mno,
            image: req.file.filename,
            password: spassword,
            is_admin: 0,

        });
        // console.log(user.image);
        const userData = await user.save();
        console.log("userdata", userData.image);
        if (userData) {
            sendVerifyMail(req.body.name, req.body.email, userData._id);
            res.render('registrations', { message: "Your registration has been successfully submited. Please verify your Email" });
        }
        else {
            res.render('registrations', { message: "Your registration has been fillded." });
        }

    } catch (error) {
        console.log(error.message);
    }
}

const verifyMail = async (req, res) => {
    try {
        const updateInfo = await User.findOneAndUpdate(
            {
                _id: req.query.id
            },
            {
                $set:
                {
                    is_varified: 1
                }
            });

        console.log(updateInfo);
        res.render("email-verified");


    } catch (error) {
        console.log(error.message);
    }
}

// login user method

const loginLoad = async (req, res) => {
    try {
        res.render('login');
    } catch (error) {
        console.log(error.message);
    }
}

const verifyLogin = async (req, res) => {
    try {

        const email = req.body.email;
        const password = req.body.password;
        const userDate = await User.findOne({ $and: [{ email: email }, {}] });//is_varified: is_varified === 0, message: "Please verify your mail first."
        if (userDate) {
            const passwordMatch = await bcrypt.compare(password, userDate.password);
            if (passwordMatch) {
                if (userDate.is_varified === 0) {
                    res.render('login', { message: "Please verify your mail." });
                } else {
                    req.session.user_id = userDate._id;
                    res.redirect('/home');
                }
            } else {
                res.render('login', { message: "Email and Password is incorrect" });
            }
        } else {
            res.render('login', { message: "Email and Password is incorrect" });
        }

    } catch (error) {
        console.log(error.message);
    }
}

const loadHome = async (req, res) => {
    try {
        const userData = await User.findById({ _id: req.session.user_id });
        console.log("userdata", userData);
        res.render('home', { user: userData });
    } catch (error) {
        console.log(error.message);
    }
}

const user_logout = async (req, res) => {
    try {
        req.session.destroy();
        res.redirect('/');

    } catch (error) {
        console.log(error.message);
    }

}

// Forget Password

const forgetPassword = async (req, res) => {
    try {
        const email = req.body.email;
        const userEmail = await User.findOne({ email: email });
        if (userEmail) {
            if (userEmail.is_varified === 0) {
                res.render('forget', { message: "Please verify your mail" });
            } else {
                const randomstring = rendomstring.generate();
                const updatedData = await User.updateOne(
                    {
                        email: email
                    },
                    {
                        $set:
                        {
                            token: randomstring
                        }
                    }
                );
                console.log("updatedata", updatedData);
                sendResetPasswordMail(updatedData, randomstring);//userData.name,userData.email
            } res.render('forget', { message: "Please check your mail to reset your password" });
        } else {
            res.render('forget', { message: "User email is incorrect" });
        }
    } catch (error) {
        console.log(error.message);
    }
}

const forgetLoad = async (req, res) => {
    try {
        res.render('forget')
    } catch (error) {
        console.log(error.message);
    }
}

const forgetPasswordLoad = async (req, res) => {
    try {
        const token = req.query.token;
        const tokenData = await User.findOne({ token: token });
        if (tokenData) {
            res.render('forget-password', { user_id: tokenData._id });
        }
        else {
            res.render('404', { message: 'page not fond' });
        }

    } catch (error) {
        console.log(error.message);
    }
}

const resetPassword = async (req, res) => {
    try {
        const password = req.body.password;
        const user_id = req.body.user_id;

        const secure_password = await securePassword(password);

        await User.findByIdAndUpdate(
            {
                _id: user_id
            },
            {
                $set:
                {
                    password: secure_password
                    ,
                    token: ''
                }
            }
        );
        console.log('')
        res.redirect('/');

    } catch (error) {
        console.log(error.message);
    }
}

const reVerificationLoad = async (req, res) => {
    try {
        res.render('reverification')
    } catch (error) {
        console.log(error.message);
    }
}

const sendVerifititionLink = async (req, res) => {
    try {
        const email = req.body.email;
        console.log("email----", email);
        const validData = await User.findOne({ enail: email });
        console.log('email', validData);

        if (validData) {
            sendVerifyMail(validData.name, validData.email, validData._id);
            res.render('reverification', { message: "Please resend your mail verification link" });
        } else {
            res.render('reverification', { message: "Email is not Valid Please check your mail again" });
        }

        res.render('registrations');
    } catch (error) {
        console.log(error.message);
    }
}

// User Profile Edit And update 
const editLoad = async (req, res) => {
    try {
        const id = req.query.id;
        const userData = await User.findById({ _id: id });
        console.log(userData);
        if (userData) {
            res.render('edit', { user: userData });
        } else {
            res.redirect('/home');
        }

    } catch (error) {
        console.log(error.message);
    }
}

const updateProfile = async (req, res) => {

    try {
        if (req.file) {
            await User.findByIdAndUpdate(
                {
                    _id: req.body.user_id
                }
                ,
                {
                    $set:
                    {
                        name: req.body.name
                        ,
                        email: req.body.email
                        ,
                        mobile: req.body.mno
                        ,
                        image: req.file.filename
                    }
                }
            );
        } else {
            await User.findByIdAndUpdate(
                {
                    _id: req.body.user_id
                }
                ,
                {
                    $set:
                    {
                        name: req.body.name
                        ,
                        email: req.body.email
                        ,
                        mobile: req.body.mno
                    }
                }
            );
        }
        res.redirect('/home')

    } catch (error) {
        console.log(error.message);
    }

}

module.exports = {
    loadRegister,
    insertUser,
    verifyMail,
    loginLoad,
    verifyLogin,
    loadHome,
    user_logout,
    forgetLoad,
    forgetPassword,
    forgetPasswordLoad,
    resetPassword,
    reVerificationLoad,
    sendVerifititionLink,
    editLoad,
    updateProfile
}