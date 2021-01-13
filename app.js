if(process.env.NODE_ENV != "production") {
    require("dotenv").config();
}

let express = require("express");
let bodyParser = require("body-parser");
let mongoose = require("mongoose");
let nodemon = require("nodemon");
let ejs = require("ejs");
let cache = require('memory-cache');
let favicon = require("serve-favicon");
let app = express();
let session = require("express-session");
let MongoStore = require("connect-mongo")(session);
app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended:true})); 
app.use(favicon('./public/images/favicon.ico'));

const dbUrl = process.env.DB_URL || "mongodb://localhost:27017/bbsdb";
const secret = process.env.SECRET || "keepthisasasecret";

const store = new MongoStore({
    url: dbUrl,
    secret,
    touchAfter: 24 * 3600 // in seconds
});

store.on("error",(e)=> {
    console.log("Session Store error: ",e);
});

const sessionConfig = {
    store,
    name: 'session',
    secret,
    resave: false,
    saveUninitialized: true
};

app.use(session(sessionConfig));


const port = process.env.PORT || 8080;
app.set("port",port);

mongoose.connect(dbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology:true,
    useCreateIndex: true,
    useFindAndModify: false
});

let memCache = new cache.Cache();
let cacheMiddleware = (duration) => {
    return (req, res, next) => {
        let key =  '__express__' + req.originalUrl || req.url
        let cacheContent = memCache.get(key);
        if(cacheContent){
            res.send( cacheContent );
            return
        }else{
            res.sendResponse = res.send
            res.send = (body) => {
                memCache.put(key,body,duration*1000);
                res.sendResponse(body)
            }
            next()
        }
    }
}

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


app.get("/",cacheMiddleware(30),async(req,res)=> {
    // try {
        res.render("home");
    // }

    // catch(error) {
    //     console.log(error);
    //     process.exit(1);
    // }
});

app.get("/viewall",cacheMiddleware(30),async(req,res)=> {
   // try {
        let record = await Customers.find({});
        res.render("viewall",{customers:record});
   // }
   // catch (err) {
    //     console.error(error);
    //     process.exit(1);
    // }
});

app.get("/viewall/:customerid",cacheMiddleware(30),async(req,res)=> {
    // try {
        let cid = req.params.customerid;

        let record = await Customers.findOne({_id:cid});
        let allcustomers = await Customers.find({});
        res.render("customerpage",{record:record,customers:allcustomers});
    // }
    // catch (err) {
    //     console.error(error);
    //     process.exit(1);
    // }
});

app.get("/viewall/:customerid/transferto",cacheMiddleware(30),async(req,res)=> {
    
    // try {
        let cid = req.params.customerid;
    let record = await Customers.findOne({_id:cid});
    let customers = await Customers.find({});

    res.render("transfertocustomers",{record:record,customers:customers});
    // }
    // catch (err) {
    //     console.error(error);
    //     process.exit(1);
    // }
});
let s = 0;
app.get("/viewall/:customerid/transferto/:transfercid",cacheMiddleware(30),async(req,res)=> {
    
    // try {
        let cid = req.params.customerid;
        let transfercid = req.params.transfercid;
        let record = await Customers.findOne({_id:cid});
        let transfercust = await Customers.findOne({_id:transfercid});
        let customers = await Customers.find({});

        res.render("transferpage",{transfercust:transfercust,record:record,customers:customers,s:s});
    // }
    // catch (err) {
    //     console.error(error);
    //     process.exit(1);
    // }
    
});



app.post("/viewall/:customerid/transferto/:transfercid",async(req,res)=> {
    // try {
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
    // }
    // catch(error) {
    //     console.error(error);
    //     process.exit(1);
    // }
});

app.get("/transfers",cacheMiddleware(30),async(req,res)=> {
    // try {
        let transfers = await Transfers.find({});
        res.render("transferrecords",{transfers:transfers});
    // }
    // catch(error) {
    //     console.error(error);
    //     process.exit(1);
    // }
});

app.get("/successfultransaction",cacheMiddleware(30),(req,res)=> {
    res.render("success");
});

app.listen(port, ()=> {
        console.log("The server is listening!!");
    });