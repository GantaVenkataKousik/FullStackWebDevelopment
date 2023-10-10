//express package
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
const colors = require("colors");
const path = require('path');
const ejs = require('ejs');
const { log } = require("console");
const all_products = require('./all_products');
const { text } = require("body-parser");
const crypto = require('crypto');
const cron = require('node-cron');

//rest object
//create an instance of an Express application using Node.js
const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files from the "public" directory
//including your CSS files.
// app.use(express.static(path.join(__dirname, 'pubilc')));

//middlewares
// Enables Cross-Origin Resource Sharing for your server.
app.use(cors());
// Parses JSON data in incoming requests.
app.use(express.json());
// Logs HTTP requests in a developer-friendly format.
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "/public")));


const uri = "mongodb+srv://vk:Bhavani1201@cluster0.kslyn8z.mongodb.net/";

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(uri);
        console.log(`Connected to MongoDB Successfully ${conn.connection.host} `.bgGreen.white);
    }
    catch (err) {
        console.log(`Error connecting to MongoDB`.bgWhite.re);
    }
}
connectDB();

//
// SCHEMAS
//
const usersSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    hash: String,
    salt: String
    , role: {
        type: Number,
        default: 0
    },
    contact: {
        type: String,
        unique: true
    },
    address: {
        type: String
    },
    pin: {
        type: String,
    },
    Itemproduced: {
        type: Number,
        default: 0
    }
}, { timeStamps: true });

usersSchema.methods.setPassword = function (password) {


    this.salt = crypto.randomBytes(16).toString('hex');

    this.hash = crypto.pbkdf2Sync(password, this.salt,
        1000, 64, `sha512`).toString(`hex`);
};


usersSchema.methods.validPassword = function (password) {
    var hash = crypto.pbkdf2Sync(password,
        this.salt, 1000, 64, `sha512`).toString(`hex`);
    return this.hash === hash;
};


const users = new mongoose.model("users", usersSchema);

// Define a schema for your data
const productSchema = new mongoose.Schema({
    userid: String,
    username: String,
    producerid: String,
    producername: String,
    name: String,
    price: Number,
    imgUrl: String,
    quantity: Number,
    status: {
        type: String,
        default: "InCart"
    },
    date: String
});

const allproductSchema = new mongoose.Schema({
    name: String,
    producerid: String,
    producername: String,
    imgUrl: String,
    info: String,
    price: Number,
    category: String
});

const producerSchema = new mongoose.Schema({
    userid: String,
    assignedid: {
        type: String,
        unique: true
    },
    aadharno: String,
    panno: String,
    documentid: String,
    taxid: String

})
const producernotificationSchema = new mongoose.Schema({
    adminid: {
        type: String,
        default: "65126c15d82d69b8a5ce16a9"
    },
    achieved: String,
    count: String,
    date: String,
    producerid: String,
    producerName: String,
    productname: String,
    productImg: String,
    productprice: Number
})
// Define the Appointment schema
const appointmentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model (adjust based on your user model name)
        required: true
    },
    producerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model (adjust based on your user model name)
        required: true
    },
    appointmentDate: {
        type: Date,
        required: true
    },
    appointmentTime: {
        type: String,
        required: true
    },
    appointmentText: {
        type: String
    },
    appointmentName: {
        type: String
    },
    appointmentConsumer: {
        type: String
    },
    completed: {
        type: String,
        default: 0
    }
});

// Create the Appointment model
const Appointment = mongoose.model('appointment', appointmentSchema);

cron.schedule('53 11 * * *', async () => {
    try {
        const currentTime = new Date();


        const completedAppointments = await Appointment.updateMany(
            {
                completed: 0,
                appointmentDate: { $lt: currentTime },
            },
            { $set: { completed: 1 } }
        );

        console.log(`Marked ${completedAppointments.nModified} appointments as completed.`);
    } catch (error) {
        console.error('Error marking appointments as completed:', error);
    }
});

const producers = new mongoose.model("producers", producerSchema);
const producerNotifications = new mongoose.model("producerNotifications", producernotificationSchema);

var userid = "";
var role = 0;
app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await users.findOne({ email: email });
        if (user) {
            if (user.validPassword(password)) {
                userid = user._id;
                role = user.role;
                if (role === 1) {
                    res.redirect('/admin/dashboard');
                } else {
                    console.log(user);
                    res.render('img.ejs', { user });
                }
            } else {
                res.send({ message: "Password didn't match" });
            }
        } else {
            res.redirect("/register");
        }
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Server error" });
    }
});
app.post("/register", async (req, res) => {
    const { email, name, password, address, contact, pin } = req.body;
    console.log(address);
    console.log(contact);
    try {
        const existingusers = await users.findOne({ email: email });
        if (existingusers) {
            console.log("Email already registered");
            res.redirect('/login');
        } else {
            try {
                const newusers = new users({
                    name,
                    email,
                    contact,
                    address,
                    pin,
                    role: 0,
                });
                newusers.password=password

                newusers.setPassword(password); 
                console.log("New users")
                await newusers.save();
                res.redirect("/login");
            }
            catch (err) {
                console.log(err);
                res.status(500).send({ message: "Server error" });
            }

        }
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Server error" });
    }
});

app.get('/register', async (req, res) => {
    res.render("register");

});
app.get('/login', async (req, res) => {
    res.render("login");
});
app.post('/schedule-appointment', async (req, res) => {
    try {
        const { userId, producerId, productId, appointmentDate, appointmentTime, appointmentText } = req.body;

        const user = await users.findOne({ _id: producerId });
        const consumer = await users.findOne({ _id: userId });
        const appointmentName = user.name;
        const appointmentConsumer = consumer.name;
        // Insert the appointment into the database
        const appointment = new Appointment({
            userId,
            producerId,
            appointmentDate,
            appointmentTime,
            appointmentText,
            appointmentName,
            appointmentConsumer
        });

        await appointment.save();

        // Redirect back to the producer page after scheduling
        res.redirect(`/producer?productid=${encodeURIComponent(productId)}&producerid=${encodeURIComponent(producerId)}&userid=${encodeURIComponent(userId)}`);
    } catch (err) {
        console.log(err);
        res.status(500).send({ message: "Server error" });
    }
});

app.get("/user/appointments", async (req, res) => {
    try {
        const userid = req.query.userid;
        const user = await users.findOne({ _id: userid });
        const appointments = await Appointment.find({ userId: userid });
        const formattedAppointments = appointments.map(appointment => ({
            ...appointment.toObject(), // Convert to plain JavaScript object
            appointmentDate: appointment.appointmentDate.toISOString().split('T')[0]
        }));
        const appointments2 = await Appointment.find({ producerId: userid });
        const formattedAppointments2 = appointments2.map(appointment => ({
            ...appointment.toObject(), // Convert to plain JavaScript object
            appointmentDate: appointment.appointmentDate.toISOString().split('T')[0]
        }));

        res.render('userappointments', { user, formattedAppointments2, formattedAppointments });
    }
    catch (err) {
        console.log(err);
    }
});



// Create a Mongoose model based on the schema
const product = mongoose.model('product', productSchema);
const allproducts = mongoose.model('allproducts', allproductSchema);



app.get("/ecommerce", async (req, res) => {
    try {
        const userid = req.query.userid;
        const products = await allproducts.find({});
        const user = await users.findOne({ _id: userid });
        console.log(user)
        res.render("ecommerce",
            {
                products,
                userid: user._id,
                username: user.name
            });
    }
    catch (err) {
        console.log(err);
    }

})

app.get("/displayproduct", async (req, res) => {
    try {
        const userid = req.query.userid;
        const producerid = req.query.producerid;
        const productid = req.query.productid;
        const product = await allproducts.findOne({
            _id: productid
        })
        const producer = await users.findOne({ _id: producerid });
        const user = await users.findOne({ _id: userid });
        console.log(product)
        res.render("displayproduct", { product, producer, user });
    }
    catch (err) {
        console.error(err); // Log the error for debugging
        res.status(500).send({ message: "Server error" });
    }
})
app.get("/add-to-cart", async (req, res) => {
    // are query parameters, not route parameters.

    const id = req.query.id;
    const userid = req.query.userid;
    const user = await users.findOne({ _id: userid });

    const name = req.query.productName;
    const producerid = req.query.producerid;
    const producername = req.query.producername;
    const price = parseFloat(req.query.productCost);
    const imgUrl = req.query.imgUrl;


    const date = new Date();

    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDay().toString().padStart(2, '0')
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const seconds = date.getSeconds().toString().padStart(2, '0')
    const meridiem = hours >= 12 ? 'PM' : 'AM'

    const formattedDateTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds} ${meridiem}`

    try {
        // const pro = await product.findOne({userid:userid,name:name});
        // console.log("PRODUCT " +pro);
        const p = await product.find({ userid: userid, name: name })
        if (p.length > 0) {
            await product.updateOne({ _id: p[0]._id }, {
                $inc: { quantity: 1 }
            })

            res.redirect(`/ecommerce?userid=${userid}`);

        }
        else {

            const quantity = req.query.quantity;
            const newProduct = new product({
                userid,
                username: user.name,
                producerid,
                producername,
                name,
                price,
                imgUrl,
                date: formattedDateTime
            });
            await newProduct.save();
            res.redirect(`/ecommerce?userid=${userid}`);

        }

        console.log("Item added successfully");
    }
    catch (err) {
        console.error(err);
        res.status(500).send({ message: "Server error" });
    }
})



app.get("/cart", async (req, res) => {
    try {
        const userid = req.query.userid;
        const products = await product.find({ userid: userid, status: "InCart" });
        res.render("cart", { products, userid });
    }
    catch (err) {
        console.error(err);
        res.status(500).send({ message: "Server error" });
    }
});


app.get('/search', async (req, res) => {
    const name = req.query.productName; // Get the search query from the request query parameters

    try {
        // Use a regular expression to find products with names matching the query
        const products = await allproducts.find({ name: name });
        const user = await users.find({ _id: userid });
        res.render("ecommerce",
            {
                products,
                username: user[0].name
            });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/categories', async (req, res) => {
    const name = req.query.productName; // Get the search query from the request query parameters

    try {
        // Use a regular expression to find products with names matching the query
        const products = await allproducts.find({ name: name });
        const user = await users.find({ _id: userid });
        res.render("ecommerce",
            {
                products,
                username: user[0].name
            });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});


app.get("/admin/addnewproduct", async (req, res) => {
    // are query parameters, not route parameters.
    try {
        res.render('addnewproduct');
    }
    catch (err) {
        console.error(err);
        res.status(500).send({ message: "Server error" });
    }
})

app.post("/admin/addproduct", async (req, res) => {
    // are query parameters, not route parameters.
    try {
        const { name, imgUrl, price, quantity } = req.body;
        const newProduct = new allproducts({
            name,
            imgUrl, price, quantity
        })
        await newProduct.save();
        res.render('addnewproduct');
    }
    catch (err) {
        console.error(err);
        res.status(500).send({ message: "Server error" });
    }
})

app.get("/user/producer", async (req, res) => {
    try {

        const producerid = req.query.userid;
        const user = await users.findOne({ _id: producerid });

        const producerProducts = await product.find({ producerid: producerid, status: "Ordered" });
        const productCountMap = new Map();
        console.log(producerProducts);

        // Iterate through each product

        for (const product of producerProducts) {
            const productId = product.name;
            if (!productCountMap.has(productId)) {
                // If not, initialize it with an empty set of user IDs
                productCountMap.set(productId, {
                    productInfo: product,
                    uniqueUserIds: new Set(),
                });
            }
            productCountMap.get(productId).uniqueUserIds.add(product.userid);
        }
        const resultArray = Array.from(productCountMap.values()).map((entry) => ({
            productInfo: entry.productInfo,
            userCount: entry.uniqueUserIds.size,
        }));

        const likedProducts = await wishlist.find({ producerid: producerid });

        const likedProductCountMap = new Map();
        for (const likedProduct of likedProducts) {
            const productId = likedProduct.name;

            if (!likedProductCountMap.has(productId)) {
                likedProductCountMap.set(productId, {
                    productInfo: likedProduct,
                    uniqueUserIds: new Set(),
                });
            }
            likedProductCountMap.get(productId).uniqueUserIds.add(likedProduct.userid);
        }

        const likedResultArray = Array.from(likedProductCountMap.values()).map((entry) => ({
            productInfo: entry.productInfo,
            userCount: entry.uniqueUserIds.size,
        }));
        console.log(likedResultArray);
        res.render("productstats", { resultArray, likedResultArray, user });

    }
    catch (err) {
        console.error(err);
        res.status(500).send({ message: "Server error" });
    }
});

app.get("/admin/dashboard", async (req, res) => {
    try {
        const ordered = await product.find({ status: "Ordered" });

        const InCart = await product.find({ status: "InCart" });
        const customers = await users.find({});

        ordered.sort(((a, b) => b.date - a.date));

        const date = new Date();

        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0')
        const day = date.getDay().toString().padStart(2, '0')
        const hours = date.getHours().toString().padStart(2, '0')
        const minutes = date.getMinutes().toString().padStart(2, '0')
        const seconds = date.getSeconds().toString().padStart(2, '0')
        const meridiem = hours >= 12 ? 'PM' : 'AM'

        const formattedDateTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds} ${meridiem}`

        const products = await wishlist.find({});
        const userCountMap = new Map();


        products.forEach((product) => {
            const userId = product.userid;
            if (!userCountMap.has(product.name)) {
                userCountMap.set(product.name, new Set());

                userCountMap.get(product.name).add(product);
            }
            else {
                userCountMap.get(product.name).add(product);
            }
        });
        // Convert the map into an array of objects
        const productLikes = Array.from(userCountMap, ([productName, product]) => ({
            productName,
            likes: product.size,
            product
        }));


        productLikes.forEach(async (product) => {
            if (product.likes >= 3) {
                try {
                    const pro = await allproducts.findOne({ name: product.productName });
                    console.log(pro)
                    const isExisted = await producerNotifications.findOne({ name: product.productName });
                    if (!isExisted) {
                        const mostLikedProdcut = new producerNotifications({
                            achieved: "Likes",
                            count: product.likes,
                            date: formattedDateTime,
                            producerid: pro.producerid,
                            producername: pro.producername,
                            productname: pro.name,
                            productImg: pro.imgUrl,
                            productprice: pro.price
                        })
                    }

                }
                catch (err) {
                    console.error(err);

                }

            }
        })
        // Sort products by the number of likes in decreasing order
        productLikes.sort((a, b) => b.likes - a.likes);
        console.log(productLikes);

        res.render("admin",
            {
                ordered, InCart, customers, productLikes
            });
    }
    catch (err) {
        console.error(err);
        res.status(500).send({ message: "Server error" });
    }
});

app.get("/producer/notifications", async (req, res) => {
    try {
        const userid = req.query.userid;
        const user = await users.findOne({ _id: userid });
        console.log(user);
        const notifications = await producerNotifications.find({ producerid: userid });
        res.render("producerNotifications", { notifications, user });
    }
    catch (err) {
        console.error(err);
        res.status(500).send({ message: "Server error" });
    }
});


app.get("/admin/customers", async (req, res) => {
    try {
        const u = await users.find({});
        res.render("customers", { u });
    }
    catch (err) {
        console.error(err);
        res.status(500).send({ message: "Server error" });
    }
});

app.get("/admin/delete", async (req, res) => {
    try {
        const products = await allproducts.find({})
        res.render("delete", { products });
    }
    catch (err) {
        console.error(err);
        res.status(500).send({ message: "Server error" });
    }
});
app.get("/admin/deleteproduct", async (req, res) => {
    try {
        const id = req.query.id;
        console.log(id);
        await allproducts.deleteOne({ _id: id });
        res.redirect("/admin/delete");
    }
    catch (err) {
        console.error(err);
        res.status(500).send({ message: "Server error" });
    }
});

app.get("/admin/total-orders", async (req, res) => {
    try {
        const u = await users.find({});
        const userorders = [];
        await Promise.all(u.map(async (user) => {
            const ordered = await product.find({ userid: user._id, status: "Ordered" });
            const inCart = await product.find({ userid: user._id, status: "InCart" });

            userorders.push({
                user: user,
                orderedlen: Number(ordered.length),
                incartlen: Number(inCart.length),
                totallen: Number(ordered.length) + Number(inCart.length)
            });
        }));
        console.log(userorders);
        res.render("totalorders", { userorders });
    }
    catch (err) {
        console.error(err);
        res.status(500).send({ message: "Server error" });
    }
})

app.get("/admin/orders", async (req, res) => {
    try {
        const u = await users.find({});
        const userorders = [];
        await Promise.all(u.map(async (user) => {
            const ordered = await product.find({ userid: user._id, status: "Ordered" });

            userorders.push({
                user: user,
                products: ordered
            });
        }));
        console.log(userorders);
        res.render("orders", { userorders });
    }
    catch (err) {
        console.error(err);
        res.status(500).send({ message: "Server error" });
    }
})

app.get("/admin/products", async (req, res) => {
    try {
        const products = await allproducts.find({});

        res.render("products", { products });
    }
    catch (err) {
        console.error(err);
        res.status(500).send({ message: "Server error" });
    }
});


app.get("/admin/favourites", async (req, res) => {
    try {
        const allUsers = await users.find({});

        const usersWithLikes = [];

        for (const user of allUsers) {
            const likedProducts = await wishlist.find({ userid: user._id });

            usersWithLikes.push({
                user: user,
                likedProducts: likedProducts
            });


        }
        res.render("favourites", { usersWithLikes });
    }
    catch (err) {
        console.error(err);
        res.status(500).send({ message: "Server error" });
    }
});

app.get("/admin/remove", async (req, res) => {
    try {
        const id = req.query.id;
        await allproducts.deleteOne({ _id: id });
        res.redirect("/admin");
    }
    catch (err) {
        console.error(err);
        res.status(500).send({ message: "Server error" });
        res.redirect("/admin");
    }
})




app.get("/admin/update", async (req, res) => {
    try {
        const {
            id,
            name,
            price,
            imgUrl,
            quantity
        } = req.query;

        const product = {
            id,
            name,
            price, imgUrl, quantity
        }

        res.render("update", { product })
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
})



app.post("/admin/updateproduct", async (req, res) => {
    try {
        const {
            id,
            name,
            price,
            imgUrl,
            quantity
        } = req.body;
        console.log(id)
        console.log(name);

        await allproducts.updateOne(
            { _id: id },
            {
                $set: {
                    name: name,
                    price: price,
                    imgUrl: imgUrl,
                    quantity: quantity
                }
            }
        );
        res.redirect("/admin/products");
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
})


const updatedProducts = all_products.map((product) => ({
    producerid: product.producerID,  // Change producerID to producerid
    imgUrl: product.imgURL,  // Change imgURL to imgUrl
    producername: product.name, // Change name to producername
    name: product.productName,  // Change productName to name
    info: product.info,
    price: product.price,
    category: product.category,
}));


updatedProducts.forEach(async (updatedProduct) => {
    try {
        const existingProduct = await allproducts.findOne({ name: updatedProduct.name });
        if (existingProduct) {

        }
        else {

            const newProduct = new allproducts(updatedProduct);
            await newProduct.save();
        }
    }
    catch (err) {
        console.error(err);
    }
})






app.get("/removeall", async (req, res) => {
    try {
        const userid = req.query.userid;
        await product.deleteMany({ userid: userid, status: "InCart" });
        res.redirect("/cart");
    }
    catch (err) {
        console.error(err);
        res.status(500).send({ message: "Server error" });

    }
});


app.get("/remove-from-cart", async (req, res) => {
    try {
        const id = req.query.id;
        await product.deleteOne({ _id: id });
        res.redirect("/cart");
    }
    catch (err) {
        console.error(err);
        res.status(500).send({ message: "Server error" });
    }
});



app.get("/user/dashboard", async (req, res) => {
    try {
        const userid = req.query.userid;
        const user = await users.findOne({ _id: userid });

        const ordered = await product.find({ userid: userid, status: "Ordered" });
        res.render('userdashboard', { user, ordered });
    }
    catch (err) {
        console.log(err);
    }
});

app.get("/user/addproduct", async (req, res) => {
    try {
        const userid = req.query.userid;
        const user = await users.findOne({ _id: userid });
        console.log(user);
        const itemProduced = user.Itemproduced;
        console.log(itemProduced);
        if (itemProduced == 0) {
            res.render('registerlink', { user });
        }
        else {
            res.render('addnewproductuser', { user });
        }
    }
    catch (err) {
        console.log(err);
    }
});



app.get("/user/orders", async (req, res) => {
    try {
        const userid = req.query.userid;
        const user = await users.findOne({ _id: userid });

        const products = await product.find({ userid: userid, status: "Ordered" });
        res.render('userorders', { user, products });
    }
    catch (err) {
        console.log(err);
    }
});





app.get("/address", async (req, res) => {
    try {
        res.render('address');
    }
    catch (err) {
        console.log(err);
    }
});

app.get("/updatepricecount", async (req, res) => {
    const id = req.query.id;
    const count = parseInt(req.query.count);
    const price = parseFloat(req.query.price);
    try {
        console.log("I am cart route");

        await product.updateOne({ _id: id }, {
            $set: {
                quantity: count,
                price: price
            },
        })
        res.redirect('/cart')
    }
    catch (err) {
        console.log(err);
    }
});
const wishlist = mongoose.model('wishlist', productSchema);

app.get("/addtowishlist", async (req, res) => {

    const id = req.query.id;
    const userid = req.query.userid;
    const user = await users.findOne({ _id: userid });

    const name = req.query.productName;
    const producerid = req.query.producerid;
    const producername = req.query.producername;
    const price = parseFloat(req.query.productCost);
    const imgUrl = req.query.imgUrl;

    const date = new Date();

    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDay().toString().padStart(2, '0')
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const seconds = date.getSeconds().toString().padStart(2, '0')
    const meridiem = hours >= 12 ? 'PM' : 'AM'

    const formattedDateTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds} ${meridiem}`


    try {

        const p = await wishlist.find({ userid: userid, name: name })
        const user = await users.findOne({ _id: userid });
        if (p.length > 0) {
            res.redirect(`/ecommerce?userid=${userid}`);
        }
        else {

            const quantity = req.query.quantity;
            const newProduct = new wishlist({
                userid,
                username: user.name,
                producerid,
                producername,
                name,
                price,
                imgUrl,
                date: formattedDateTime
            });
            await newProduct.save();
            res.redirect(`/ecommerce?userid=${userid}`);
        }

        console.log("Item added successfully");
    }
    catch (err) {
        console.error(err);
        res.status(500).send({ message: "Server error" });
    }
})

app.get("/removefromwishlist", async (req, res) => {
    try {
        const id = req.query.id;
        const userid = req.query.userid;
        await wishlist.deleteOne({ userid: userid, _id: id });
        res.redirect(`/wishlist?userid=${userid}`);
    }
    catch (err) {
        console.error(err);
        res.status(500).send({ message: "Server error" });
        res.redirect("/cart");
    }
});



app.get("/wishlist", async (req, res) => {
    try {
        const userid = req.query.userid;
        const products = await wishlist.find({ userid: userid });
        console.log(userid);
        console.log(products);
        res.render('wishlist', { products, userid: userid });
    }
    catch (err) {
        console.log(err);
    }
});

app.get("/location", (req, res) => {
    res.render("location")
})


app.get("/checkout", async (req, res) => {
    try {
        const id = req.query.id;
        //update all the products in the db which are with the status incart 
        await product.updateMany(
            { userid: id },
            { $set: { status: "Ordered" } })
        res.redirect('/thankyou');
    }
    catch (err) {
        res.status(500).send({ message: "Server error" });
    }
})
app.get("/", async (req, res) => {
    res.redirect("/login");
})
app.get("/thankyou", async (req, res) => {
    try {
        res.render('thankyou');
    }
    catch (err) {
        console.log(err);
    }
    console.log("BE started at port 9002");
})


app.get("/producer", async (req, res) => {
    try {
        const userid = req.query.userid;
        const producerid = req.query.producerid;
        const productid = req.query.productid;
        console.log(producerid, productid, userid);
        const user = await users.findOne({ _id: producerid });
        const product = await allproducts.findOne({ _id: productid });
        const products = await allproducts.find({ producerid: producerid });
        res.render("producer", { user, product, products, userid, producerid });
    }
    catch (err) {

        res.status(500).send({ message: "Server error" });
    }
});



app.get("/checkid", async (req, res) => {
    try {
        
        const userid = req.query.userid;
        const user = await users.findOne({ _id: userid });
        res.render('addnewproductuser',{user});
    }
    catch (err) {

        res.status(500).send({ message: "Server error" });
    }
})

// app.get('/completekyc', async (req, res) => {
//     try {
//         const userid = req.query.userid;
//         const user = await users.findOne({ _id: userid });
//         console.log(user);
//         const isExisted = await producers.findOne({ userid: userid });
//         console.log(isExisted);
//         if (isExisted) {
//             res.render("producerprofile", { user, isExisted });
//         }
//         else {
//             res.render("dgnk.ejs", { user });
//         }

//     }
//     catch (err) {
//         console.log(err);
//         res.status(500).send({ message: "Server error" });
//     }
// })

app.post("/registerproducer", async (req, res) => {
    try {
        const { userid, aadharno, panno, documentid, taxid } = req.body;

        const user = await users.findOne({ _id: userid });
        const secretKey = user._id;
        var generatedId = "";
        const randomString = Math.random().toString(36).substring(2, 18);
        const data = randomString + secretKey;
        const hash = crypto.createHash('sha256').update(data).digest('hex');

        generatedId = hash.substring(0, 16);

        console.log(generatedId);
        const newProducer = new producers({
            userid,
            assignedid: generatedId,
            aadharno,
            panno,
            documentid,
            taxid
        })
        await newProducer.save();
        res.redirect(`/completekyc?userid=${userid}`)
    }
    catch (err) {
        console.log(err);
        res.status(500).send({ message: "Server error" });
    }
})

app.get("/updateitemproduced", async (req, res) => {
    try {
        const producerid = req.query.userid;
        await users.updateOne({ _id: producerid }, { $set: { Itemproduced: 1 } });

        // Fetch the user with the updated data
        const user = await users.findOne({ _id: producerid });

        res.render('addnewproductuser', { user });
    } catch (err) {
        console.error(err); // Log the error for debugging
        res.status(500).send({ message: "Server error" });
    }
});



app.listen(9002, () => {
    console.log("BE started at port 9002");
})
