// const mongoose = require("mongoose");
const User = require("../models/userModel");
const bcrypt = require('bcrypt');
const randomString = require('randomstring');
const config = require('../config/config');
const nodemailer = require('nodemailer');
const excelJS = require('exceljs');

// html to pdf generate 

const ejs = require('ejs');
const pdf = require('html-pdf');
const fs = require('fs');
const path = require('path');



// for send mail

const addUserMail = async (name, email, password, user_id) => {
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
            subject: 'Admin add you, please verifye your mail',
            html: '<p>Hii' + name + ', please click here to <a href="http://127.0.0.1:3000/verify?id=' + user_id + '">Verify </a>your mail.</p><br><br><b> Email :- </b> ' + email + '<br> <b>Password:-</b>' + password + ''
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


const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;
    } catch (error) {
        console.log(error.message);
    }
}


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
            html: '<p>Hii' + name + ', please click here to <a href="http://127.0.0.1:3000/admin/forget-password?token=' + token + '">Reset </a> your password.</p>'
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


const loadLogin = async (req, res) => {
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
        const userData = await User.findOne({ email: email });
        // console.log("user data is",userData);
        if (userData) {
            // console.log(await bcrypt(userData.password));
            const passwordMatch = await bcrypt.compare(password, userData.password);
            // console.log(passwordMatch);
            if (passwordMatch) {
                if (userData.is_admin === 0) {
                    res.render('login', { message: 'Email and password incorrect' });
                } else {
                    req.session.user_id = userData._id;
                    res.redirect('/admin/home');
                }
            } else {
                res.render('login', { message: 'Email and password incorrect' });
            }
        } else {
            res.render('login', { message: 'Email and password incorrect' });
        }
    } catch (error) {
        console.log(error.message);
    }
}

const loadDeashboard = async (req, res) => {
    try {
        const userData = await User.findById({ _id: req.session.user_id });
        res.render('home', { admin: userData })
    } catch (error) {
        console.log(error.message);
    }
}

const adminLogout = async (req, res) => {
    try {
        req.session.destroy();
        res.redirect('/admin');

    } catch (error) {
        console.log(error.message);
    }
}

const forgetLoad = async (req, res) => {
    try {
        res.render('forgetPassword');
    } catch (error) {
        console.log(error.message);
    }
}

const forgetPasswordVerifyed = async (req, res) => {
    try {
        const adminEmail = req.body.email;
        // console.log(admin_User);
        const userData = await User.findOne({ email: adminEmail });
        if (userData) {
            if (userData.is_admin === 0) {
                res.render('forgetPassword', { message: 'Please Enter a valid email' });
            } else {
                const newRandomString = randomString.generate();
                await User.updateOne(
                    {
                        email: adminEmail
                    }
                    ,
                    {
                        $set:
                        {
                            token: newRandomString
                        }
                    }
                );
                await sendResetPasswordMail(userData.name, userData.email, userData.token);
                res.render('forgetPassword', { message: 'Please check your mail to reset your Password.' });
            }
        } else {
            res.render('forgetPassword', { message: 'Please Enter a valid email' });
        }

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
        } else {
            res.render('404', { message: 'Invalid Link' });

        }
    } catch (error) {
        console.log(error.message);
    }
}

const Reset_Passeord = async (req, res) => {
    try {
        const password = req.body.password;
        const user_id = req.body.user_id;
        const spassword = await securePassword(password);
        await User.findByIdAndUpdate(
            {
                _id: user_id
            }
            ,
            {
                $set:
                {
                    password: spassword, token: ''
                }
            }
        );
        res.redirect('/admin');
    } catch (error) {
        console.log(error.message);
    }
}

const adminDashboard = async (req, res) => {
    try {
        const userData = await User.find({ is_admin: 0 });
        res.render('dashboard', { users: userData });
    } catch (error) {
        console.log(error.message);
    }
}

//Add New Users
const loadNewUser = async (req, res) => {
    try {
        res.render('new-user');
    } catch (error) {
        console.log(error.message);
    }
}

const newUserLoad = async (req, res) => {
    try {
        res.render('new-user');

    } catch (error) {
        console.log(error.message);
    }
}

const addUser = async (req, res) => {
    try {
        const name = req.body.name;
        const email = req.body.email;
        const mobile = req.body.mno;
        const image = req.file.filename;
        const password = randomString.generate(8);
        const spassword = await securePassword(password);
        const user = new User({
            name: name,
            email: email,
            mobile: mobile,
            image: image,
            password: spassword,
            is_admin: 0
        });

        const userData = await user.save();
        if (userData) {
            await addUserMail(userData.name, userData.email, userData.password, userData._id);
            res.redirect('/admin/dashboard');
        } else {
            res.render('new-user', { message: 'something wrong' })
        }
    } catch (error) {
        console.log(error.message);
    }
}

//Edit User Profile

const editUserLoad = async (req, res) => {
    try {
        const id = req.query.id;
        const userData = await User.findById({ _id: id });
        if (userData) {

            res.render('edit-user', { user: userData });

        } else {
            res.redirect('/admin/dashboard');
        }
    } catch (error) {
        console.log(error.message);
    }
}

const updateUser = async (req, res) => {
    try {
        await User.findByIdAndUpdate(
            {
                _id: req.body.id
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
                    is_varified: req.body.verify
                }
            }
        );
        res.redirect('/admin/dashboard');
    } catch (error) {
        console.log(error.message);
    }
}
//Delete User 
const deleteUserLoad = async (req, res) => {
    try {
        const id = req.query.id;
        await User.deleteOne({ _id: id });
        res.redirect('/admin/dashboard');
    } catch (error) {
        console.log(error.message);
    }
}

//Download Users Data

const exportUsers = async (req, res) => {
    try {
        const workbook = new excelJS.Workbook();
        const worksheet = workbook.addWorksheet("My Users");
        worksheet.columns = [
            { header: "S_no", key: "s_no" },
            { header: "Name", key: "name" },
            { header: "Email Id", key: "email" },
            { header: "Mobile", key: "mobile" },
            { header: "Image", key: "image" },
            { header: "Admin", key: "is_admin" },
            { header: "Varified", key: "is_varified" },
        ];
        let counter = 1;
        const userData = await User.find({ is_admin: 0 });
        userData.forEach((user) => {
            user.s_no = counter;
            worksheet.addRow(user);
            counter++;

        });
        worksheet.getRow(1).eachCell((cell) => {
            cell.font = { bold: true };
        });

        res.setHeader(
            "content-type",
            "application/vnd.openxmlformates-officedocument.spreadsheatml.sheet"
        )

        res.setHeader("content-Disposition", `attachment;filename=users.xlsx`);

        return workbook.xlsx.write(res).then(() => {
            res.status(200);
        })

    } catch (error) {
        console.log(error.message);
    }
}
//export user data into pdf

const exportUsersInPdf = async (req, res) => {
    try {
        const users = await User.find({ is_admin: 0 });
        const data = {
            users: users,

        }
        const filePathName = path.resolve(__dirname, '../views/admin/htmltopdf.ejs')
        const htmlString = fs.readFileSync(filePathName).toString();
        let option = {
            format: 'letter',

        }
        const ejsData = ejs.render(htmlString, data);
        pdf.create(ejsData, option).toFile('users.pdf', (err, response) => {
            if (err) console.log(err);
            const filePath = path.resolve(__dirname, '../users.pdf');

            fs.readFile(filePath, (err, file) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send('you Could not Abale to Download this file');
                }
                res.setHeader('Content-type', 'application/pdf');
                res.setHeader('Content-Disposition', 'attachment;filename="users.pdf');
                res.send(file);
            });
        });
    } catch (error) {
        console.log(error.message);
    }
}

module.exports = {
    loadLogin,
    verifyLogin,
    loadDeashboard,
    adminLogout,
    forgetLoad,
    forgetPasswordVerifyed,
    forgetPasswordLoad,
    Reset_Passeord,
    adminDashboard,
    loadNewUser,
    newUserLoad,
    addUser,
    editUserLoad,
    updateUser,
    deleteUserLoad,
    exportUsers,
    exportUsersInPdf
};