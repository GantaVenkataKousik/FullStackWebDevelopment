//express package
const express = require("express");
const cors = require("cors");
const colors = require("colors");
const path = require('path');
const ejs = require('ejs');
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
app.use(express.urlencoded({extended: true}));

app.use(express.static(path.join(__dirname,"/public")));


app.post("/holiday",async(req,res) => {
    try{
        const {country,year,month,day} = req.body;
        const countryParam = country === "India" ? "IN" : country;
        const apikey = "fbea48850b7447c8b3ac4ecfe4fbf252";
        console.log(`https://holidays.abstractapi.com/v1/?api_key=${apikey}&country=${countryParam}&year=${year}&month=${month}&day=${day}`)
        const response = await fetch(`https://holidays.abstractapi.com/v1/?api_key=${apikey}&country=${countryParam}&year=${year}&month=${month}&day=${day}`);
        const data = await response.json();
        console.log(data);
        if (data.length == 0){
            res.render("noholiday");
        }
        else{
            
        res.render("holiday",{data});
        }
    }   
    catch(err){
        console.error(err);
        res.status(500).send({ message: "Server error" });
    }
})

app.get("/",(req,res)=>{
    res.render("home");
})

app.listen(9002,() => {
    console.log("BE started at port 9002");
})
