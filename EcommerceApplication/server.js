//express package
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
const colors = require("colors");
const path = require('path');
const ejs = require('ejs');
const { log } = require("console");

const crypto = require('crypto');
const all_products = require('./all_products');

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
app.use(express.urlencoded({extended: true}));

app.use(express.static(path.join(__dirname,"/public")));


const uri = "mongodb+srv://vk:Bhavani1201@cluster0.kslyn8z.mongodb.net/";

const connectDB = async() => {
    try{
        const conn = await mongoose.connect(uri);
        console.log(`Connected to MongoDB Successfully ${conn.connection.host} `.bgGreen.white);
    }
    catch(err){
        console.log(`Error connecting to MongoDB`.bgWhite.re);
    }
}
connectDB();


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

var userid = "";
var role = 0;
app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try{
        const user = await users.findOne({ email: email });
        if (user) {
            if (user.validPassword(password)) {
                userid = user._id;
                role = user.role;
                if (role === 1) {
                    res.redirect('/admin/dashboard');
                } else {
                    res.render('loading.ejs', { user });
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
    const { email, name, password,confirmPassword} = req.body;
   
    try {
        const existingusers = await users.findOne({ email: email });
        if (existingusers) {
            
            res.status(500).send({ message: "Email already registered!Try to register with an another email"});
        } else {
            try {
                if(password === confirmPassword) {
                    const newusers = new users({
                        name,
                        email,
                        role: 0,
                    });
                    newusers.password=password
                    newusers.setPassword(password); 
                    await newusers.save();
                    res.redirect("/login");
                }
               else{
                res.status(300).send({ message: "Password and conform password has to be the same" });
               }
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



// Define a schema for your data
const productSchema = new mongoose.Schema({
    userid:String,
    username:String,
    name: String,
    price: Number,
    imgUrl: String,
    quantity:Number,
    status:{
        type:String,
        default : "InCart"
    },
    date:String
  });

  const allproductSchema = new mongoose.Schema({
    name: String,
    price: Number,
    info:String,
    imgUrl: String,
    category: String
  });

  // Create a Mongoose model based on the schema
  const product = mongoose.model('product', productSchema);
  const allproducts = mongoose.model('allproducts', allproductSchema);
  


  app.get("/ecommerce", async (req, res) => {
    try {
        const userid = req.query.userid;
        const products = await allproducts.find({});
        const user = await users.findOne({ _id: userid });
        
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

  

app.get("/add-to-cart",async (req, res)=>{
    
    const id = req.query.id;
    const userid = req.query.userid;
    const name = req.query.productName;
    const price = parseFloat(req.query.productCost);
    const imgUrl = req.query.imgUrl;
    const date = new Date();
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const seconds = date.getSeconds().toString().padStart(2, '0')
    const meridiem = hours >= 12 ? 'PM' : 'AM'

    const formattedDateTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds} ${meridiem}`

    try{          
        const p = await product.find({userid: userid,name:name})
        
        const user = await users.findOne({_id: userid});
        if(p.length > 0) {

        }
        else{
            
            const newProduct = new product({
                userid,
                username:user.name,
                name,
                price,
                imgUrl,
                date: formattedDateTime
            });
            await newProduct.save();
            
        }
        
        res.redirect(`/ecommerce?userid=${userid}`);
        
    }
    catch(err){
        console.error(err);
        res.status(500).send({ message: "Server error" });
    }
})



app.get("/cart", async (req, res)=>{
    try{
        const userid = req.query.userid;
        const products = await product.find({ userid : userid,status:"InCart"});
        res.render("cart", { products,userid});
    }
    catch(err){
        console.error(err);
        res.status(500).send({ message: "Server error" });
    }
});


app.get('/search', async (req, res) => {
    const name = req.query.productName; // Get the search query from the request query parameters
  
    try {
      // Use a regular expression to find products with names matching the query
      const products = await allproducts.find({ name: name});
      const user = await users.find({_id:userid});
      res.render("ecommerce", 
              { products,
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
      const products = await allproducts.find({ name: name});
      const user = await users.find({_id:userid});
      res.render("ecommerce", 
              { products,
                username: user[0].name
              });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
});
 

app.get("/admin/addnewproduct",async (req, res)=>{
    // are query parameters, not route parameters.
    try{          
        res.render('addnewproduct');
    }
    catch(err){
        console.error(err);
        res.status(500).send({ message: "Server error" });
    }
})

app.post("/admin/addproduct",async (req, res)=>{
    // are query parameters, not route parameters.
    try{          
        const { name,imgUrl,price,quantity } = req.body;
        const newProduct  = new allproducts({
            name,
            imgUrl,price,quantity
        })
        await newProduct.save();
        res.render('addnewproduct');
    }
    catch(err){
        console.error(err);
        res.status(500).send({ message: "Server error" });
    }
})


app.get("/admin/dashboard", async (req, res)=>{
    try{
        const ordered = await product.find({status:"Ordered"});
        const InCart = await product.find({status:"InCart"});
        const customers = await users.find({});
        
        ordered.sort(((a,b) => b.date-a.date));


        const products = await wishlist.find({});
        console.log(products);
        const userCountMap = new Map();
    
        products.forEach((product) => {
          const userId = product.userid; 
          if (!userCountMap.has(product.name)) {
            userCountMap.set(product.name, new Set());
            userCountMap.get(product.name).add(product);
          }
          else{
            userCountMap.get(product.name).add(product);
          }
        });
        // Convert the map into an array of objects
        const productLikes = Array.from(userCountMap, ([productName, product]) => ({
            productName,
          likes: product.size,
          product
        }));
        // Sort products by the number of likes in decreasing order
        productLikes.sort((a, b) => b.likes - a.likes);
        console.log(productLikes);

        res.render("admin", 
                {
                    ordered,InCart,customers,productLikes
                });
    }
    catch(err){
        console.error(err);
        res.status(500).send({ message: "Server error" });
    }
});

app.get("/admin/customers", async (req, res)=>{
    try{
        const u = await users.find({});
        res.render("customers", {u});
    }
    catch(err){
        console.error(err);
        res.status(500).send({ message: "Server error" });
    }
});

app.get("/admin/delete", async (req, res)=>{
    try{
        const products =await allproducts.find({})
        res.render("delete", {products});
    }
    catch(err){
        console.error(err);
        res.status(500).send({ message: "Server error" });
    }
});
app.get("/admin/deleteproduct", async (req, res)=>{
    try{
        const id = req.query.id;
        console.log(id);
        await allproducts.deleteOne({_id:id});
        res.redirect("/admin/delete");
    }
    catch(err){
        console.error(err);
        res.status(500).send({ message: "Server error" });
    }
});

app.get("/admin/total-orders", async (req, res)=>{
    try{
        const u = await users.find({});
        console.log(u)
        const userorders = [];
        await Promise.all(u.map(async (user) => {
            const ordered = await product.find({ userid: user._id, status: "Ordered" });
            const inCart = await product.find({ userid: user._id, status: "InCart" });
            console.log(ordered)
            console.log(inCart)
            userorders.push({
              user: user,
              orderedlen: Number(ordered.length),
              incartlen: Number(inCart.length),
              totallen: Number(ordered.length) + Number(inCart.length)
            });
          }));
        console.log(userorders);
        res.render("totalorders", {userorders});
    }
    catch(err){
        console.error(err);
        res.status(500).send({ message: "Server error" });
    }
})

app.get("/admin/orders", async (req, res)=>{
    try{
        const u = await users.find({});
        const userorders = [];
        await Promise.all(u.map(async (user) => {
            const ordered = await product.find({ userid: user._id, status: "Ordered" });
        
            userorders.push({
              user: user,
              products:ordered
            });
          }));
        console.log(userorders);
        res.render("orders", {userorders});
    }
    catch(err){
        console.error(err);
        res.status(500).send({ message: "Server error" });
    }
})

app.get("/admin/products", async (req, res)=>{
    try{
        const products = await allproducts.find({});
        
        res.render("products", {products});
    }
    catch(err){
        console.error(err);
        res.status(500).send({ message: "Server error" });
    }
});


app.get("/admin/favourites", async (req, res)=>{
    try{
        const allUsers = await users.find({});

        const usersWithLikes = [];

        for (const user of allUsers) {
        const likedProducts = await wishlist.find({ userid:user._id });

        usersWithLikes.push({
            user: user,
            likedProducts: likedProducts
        });
       
        
        }
    res.render("favourites",{usersWithLikes});
    }
    catch(err){
        console.error(err);
        res.status(500).send({ message: "Server error" });
    }
});

app.get("/admin/remove", async (req, res)=>{
    try{
        const id = req.query.id;
        await allproducts.deleteOne({ _id:id});
        res.redirect("/admin");
    }
    catch(err){
        console.error(err);
        res.status(500).send({ message: "Server error" });
        res.redirect("/admin");
    }
})




app.get("/admin/update", async(req, res) => {
    try {
        const {
            id,
            name,
            price,
            imgUrl
          } = req.query;

        const product = {
            id,
            name,
            price, imgUrl
        }
        
        res.render("update",{product})
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
})



app.post("/admin/updateproduct", async(req, res) => {
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
            { $set: {      name: name,
                price: price,
                imgUrl: imgUrl,
                quantity: quantity} } 
          );
        res.redirect("/admin/products");
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
})


all_products.forEach(async (productData) => {
  // Check if a product with the same name already exists in the database
  const existingProduct = await allproducts.findOne({ name: productData.name });

  if (!existingProduct) {
    const newProduct = new allproducts({
        name: productData.productName,
        info: productData.info,
        imgUrl: productData.imgURL,
        price: productData.price,
        category: productData.category
    });
    try {
      await newProduct.save();
    } catch (err) {
      console.error(err);
    }
}
})

app.get("/removeall", async (req, res)=>{
    try{
        const userid  = req.query.userid;
        await product.deleteMany({userid:userid,status:"InCart"});
        res.redirect("/cart");
    }
    catch(err){
        console.error(err);
        res.status(500).send({ message: "Server error" });
 
    }
});


app.get("/remove-from-cart", async (req, res)=>{
    try{
        const id = req.query.id;
        const userid = req.query.userid;
        await product.deleteOne({ _id:id});
        res.redirect(`/cart?userid=${userid}`);
    }
    catch(err){
        console.error(err);
        res.status(500).send({ message: "Server error" });
    }
});



app.get("/user/dashboard", async (req, res)=>{
    try{
            const userid = req.query.userid;
            const user = await users.findOne({ _id:userid }); 

            const ordered = await product.find({userid:userid,status:"Ordered"});
            res.render('userdashboard', {user,ordered});       
    }
    catch(err){
        console.log(err);
    }
});

app.get("/user/orders", async (req, res)=>{
    try{
            const userid = req.query.userid;
            const user = await users.findOne({ _id:userid }); 
   
            const products = await product.find({userid:userid,status:"Ordered"});
            res.render('userorders', {user,products});       
    }
    catch(err){
        console.log(err);
    }
});



app.get("/address", async (req, res)=>{
    try{
        res.render('address'); 
    }   
    catch(err){
        console.log(err);
    }
});

app.get("/updatepricecount", async (req,res)=>{
    const id=  req.query.id;
    const count = parseInt(req.query.count);
    const price = parseFloat(req.query.price);
    try{
        console.log("I am cart route");
        
        await product.updateOne({_id:id},{$set: {
            quantity : count,
            price : price
          },})
        res.redirect('/cart')
    }   
    catch(err){
        console.log(err);
    }
});

  // Create a Mongoose model based on the schema
const wishlist =  mongoose.model('wishlist', productSchema);

app.get("/addtowishlist", async(req, res) => {
     
    const id = req.query.id;
    const userid = req.query.userid;
    const name = req.query.productName;
    const price = parseFloat(req.query.productCost);
    const imgUrl = req.query.imgUrl;
    const date = new Date();
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0') // Month is zero-based
    const day = date.getDate().toString().padStart(2, '0')
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const seconds = date.getSeconds().toString().padStart(2, '0')
    const meridiem = hours >= 12 ? 'PM' : 'AM'

    const formattedDateTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds} ${meridiem}`


    try{          
        
        const p = await wishlist.find({userid: userid,name:name})
        const user = await users.findOne({_id: userid});
        if(p.length > 0) {
        }
        else{
            
            const quantity = req.query.quantity;
            const newProduct = new wishlist({
                userid,
                username:user.name,
                name,
                price,
                imgUrl,
                date: formattedDateTime
            });
            await newProduct.save();
            
        }
        res.redirect(`/ecommerce?userid=${userid}`);
    }
    catch(err){
        console.error(err);
        res.status(500).send({ message: "Server error" });
    }
})

app.get("/removefromwishlist", async (req, res)=>{
    try{
        const id = req.query.id;
        const userid = req.query.userid;
        await wishlist.deleteOne({ userid:userid,_id:id});
        res.redirect(`/wishlist?userid=${userid}`);
    }
    catch(err){
        console.error(err);
        res.status(500).send({ message: "Server error" });
        res.redirect("/cart");
    }
});



app.get("/displayproduct", async (req, res) => {
    try {
        const userid = req.query.userid;
        const productid = req.query.productid;
        const product = await allproducts.findOne({
            _id: productid
        })
        const user = await users.findOne({ _id: userid });
        console.log(product)
        res.render("displayproduct", { product,  user });
    }
    catch (err) {
        console.error(err); // Log the error for debugging
        res.status(500).send({ message: "Server error" });
    }
})
app.get("/wishlist", async(req,res)=>{
    try{
        const userid = req.query.userid;
        const products = await wishlist.find({userid:userid});
        console.log(userid);
        console.log(products);
        res.render('wishlist', {products,userid:userid});
    }
    catch(err){
        console.log(err);
    }
});

app.get("/location",(req,res)=>{
    res.render("location")
})


app.get("/checkout",async(req,res)=>{
    try{
        const id = req.query.id;
        //update all the products in the db which are with the status incart 
        await product.updateMany(
            { userid: id},
            { $set: { status: "Ordered" } })
        res.redirect('/thankyou');
    }
    catch(err){
        res.status(500).send({ message: "Server error" });
    }
})
app.get("/", async (req, res)=>{
    res.redirect("/login");
})
app.get("/thankyou", async (req, res)=>{
    try{
        res.render('thankyou');
    } 
    catch(err){
        console.log(err);
    } 
    console.log("BE started at port 9002");
})
app.listen(9002,() => {
    console.log("BE started at port 9002");
})
