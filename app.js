let express = require("express");
let bodyParser = require("body-parser");
let mongoose = require("mongoose");
let nodemon = require("nodemon");
let http = require("http");
let app = express();
let dotenv = require("dotenv").config();
app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended:true}));

// const port = 80;

mongoose.connect("mongodb://localhost:27017/bbsdb",{useNewUrlParser: true,useUnifiedTopology:true});

let customerSchema = new mongoose.Schema({
    name: String,
    email: String,
    currentBalance: Number
});

let transferSchema = new mongoose.Schema({
    transferredby: String,
    transferredto: String,
    amount: Number
});

let Customers = mongoose.model("Customers",customerSchema);
let Transfers = mongoose.model("Transfers",transferSchema);


app.get("/",async(req,res)=> {
    res.render("home");
});

app.get("/viewall",async(req,res)=> {
    try {
        let record = await Customers.find({});
        
    }
    catch (err) {
        console.error(error);
        process.exit(1);
    }
    res.render("viewall",{customers:record});
});

app.get("/viewall/:customerid",async(req,res)=> {
    try {
        let cid = req.params.customerid;

    let record = await Customers.findOne({_id:cid});
    let allcustomers = await Customers.find({});

    res.render("customerpage",{record:record,customers:allcustomers});
    }
    catch (err) {
        console.error(error);
        process.exit(1);
    }
});

app.get("/viewall/:customerid/transferto",async(req,res)=> {
    
    try {
        let cid = req.params.customerid;
    let record = await Customers.findOne({_id:cid});
    let customers = await Customers.find({});

    res.render("transfertocustomers",{record:record,customers:customers});
    }
    catch (err) {
        console.error(error);
        process.exit(1);
    }
});
let s = 0;
app.get("/viewall/:customerid/transferto/:transfercid",async(req,res)=> {
    
    try {
        let cid = req.params.customerid;
    let transfercid = req.params.transfercid;
    let record = await Customers.findOne({_id:cid});
    let transfercust = await Customers.findOne({_id:transfercid});
    let customers = await Customers.find({});

    res.render("transferpage",{transfercust:transfercust,record:record,customers:customers,s:s});
    }
    catch (err) {
        console.error(error);
        process.exit(1);
    }
    
});



app.post("/viewall/:customerid/transferto/:transfercid",async(req,res)=> {
    try {
        let amount = req.body.amount;
    let transfercid = req.params.transfercid;
    let cid = req.params.customerid;

    let transfertocust = await Customers.findOne({_id:transfercid});
    let customer = await Customers.findOne({_id:cid});

    if(amount > customer.currentBalance)
    {
        let url = "/viewall/" + cid + "/transferto/" + transfercid; 
    
        console.log("Insufficient balance for money transfer!!");
        s=1;
        res.redirect(url);
    }
    else
    {
        let transfernetamount = parseInt(transfertocust.currentBalance) + parseInt(amount);
        
        transfertocust.updateOne({$set : {currentBalance: transfernetamount}},(err,record)=> {
            if(err)
                console.log(err);
            else
                console.log("Updated!!");
        });

        let customchange = parseInt(customer.currentBalance) - parseInt(amount);
        console.log(typeof transfertocust.currentBalance, typeof customchange, amount);
        customer.updateOne({$set : {currentBalance: customchange}},(err,record)=> {
            if(err)
                console.log(err);
            else
                console.log("Updated this also!!");
        });

        let transferrecords = {
            transferredby: customer.name,
            transferredto: transfertocust.name,
            amount: parseInt(amount)
        };

        Transfers.insertMany(transferrecords,(err,record)=> {
            if(err)
                console.log(err);
            else
                console.log("Record stored!!");
        });
        console.log(Transfers);

        s=0;
        res.redirect("/successfultransaction");
    }
    }
    catch(error) {
        console.error(error);
        process.exit(1);
    }
});

app.get("/transfers",async(req,res)=> {
    try {
        let transfers = await Transfers.find({});
        res.render("transferrecords",{transfers:transfers});
    }
    catch(error) {
        console.error(error);
        process.exit(1);
    }
});

app.get("/successfultransaction",(req,res)=> {
    res.render("success");
});

app.listen(process.env.PORT || 80,process.env.IP, ()=> {
        console.log("The server is listening!!");
    });