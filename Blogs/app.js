var bp = require('body-parser')
var mongoose = require('mongoose')
var express = require('express')
var app = express()

mongoose.connect("mongodb://localhost/cartoons_db",{useNewUrlParser:true,useUnifiedTopology: true})
app.use(bp.urlencoded({extended:true}))
app.set("view engine","ejs")

var cartoonSchema = new mongoose.Schema({
    name: String,
    title: String,
    image: String,
    desc: String, // description
    postedOn: {type: Date, default: Date.now()}
})

var Cartoons = mongoose.model("Cartoons",cartoonSchema)

app.get("/",(req,res) => {
    res.redirect('/cartoon');
})

app.get("/cartoon", (req,res) => {
    Cartoons.find({}, (err, cartoons)=> {
        if(err)
            res.redirect("new")
        
        else   
            res.render("cartoon",{cartun: cartoons});
    })
})

app.post("/cartoon", (req,res)=> {
    var name = req.body.name, 
    title = req.body.title,
    image = req.body.image,
    desc = req.body.desc,
    postedOn = req.body.postedOn

    var cart = new Cartoons({
        name: name,
        title: title,
        image: image,
        desc: desc,
        postedOn: postedOn
    })

    cart.save();

    res.redirect("/cartoon")
})

app.get("/cartoon/new", (req,res)=> {
    res.render("new");
})

app.listen(80,"127.0.0.1",(req,res)=> {
    console.log("THE SERVER IS RUNNING!!")
});