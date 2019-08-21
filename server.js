const express = require("express");
const mongoclient = require('mongodb').MongoClient;
const bodyParser = require("body-parser");
const PORT = process.env.PORT || 5000;
const app = express();  

ObjectId = require("mongodb").ObjectID;

//mongodb connection and query
//const DB_URL = 'mongodb://localhost:27017/shuffle';
const DB_URL = 'mongodb+srv://bamoah:utopiamaya3@cluster0-xqp9f.mongodb.net/test?retryWrites=true&w=majority';
const DB = 'shuffle';

app.use(express.static('public'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));


app.post('/auth', function(req, res){
    //var data = req.read();
    let email = req.body.email;
    let password = req.body.password;

    //query database
    mongoclient.connect(DB_URL,
        { useNewUrlParser: true },
        function(err, client){
            if(err) console.log("Message 1: "+err);
    
            const db = client.db(DB);
    
            const credentials = { email: email, password: password }
            db.collection("players").find(credentials).toArray(
                function(err, result){
                    if(err) console.log("msg 2: "+err);

                    if(result.length > 0){         
                        //random number between nine million and ten million as token
                        let max = 10000000;
                        let min = 9000000;
                        let token = Math.floor(Math.random() * (max - min)) + min;
                        token = token+""+new Date().getTime()

                        const id = result[0]._id;
                        const query = { _id: new ObjectId( id ) };
                        const tokeninsert = { token: token };
                        const displayedname = result[0].displayedname;

                        if (err) console.log("got 2: ");
                        db.collection("players").updateOne(query, tokeninsert,
                            function(error, response){
                                if (err) console.log("got 2: "+err);

                                res.send({ 'response_msg': 'You are authorized to proceed!', "id": id, "name": displayedname, "token": token });
                            }
                        );
                    }else{
                        res.send({ 'response_msg': 'Try again!' });
                    }
                }
            )
    });    
    
});


//Sign up
app.post('/signup', function(req, res){
    let email = req.body.email;
    let password = req.body.password;

    //random number between nine million and ten million as token
    let max = 10000000;
    let min = 9000000;
    let token = Math.floor(Math.random() * (max - min)) + min;

    let firstname = req.body.firstname;
    let lastname = req.body.lastname;
    let displayedname = req.body.displayedname;
    let dateofbirth = req.body.dateofbirth;
    let gender = req.body.gender;

    //query database
    mongoclient.connect(DB_URL,
        { useNewUrlParser: true },
        function(err, client){
            if(err) throw err;
    
            const db = client.db(DB);
    
            //const signup_time = "ISODate()";
            const player = { 
                email: email,
                password: password, 
                token: token,
                firstname: firstname,
                lastname: lastname,
                displayedname: displayedname,
                dateofbirth: dateofbirth,
                gender: gender,
                credit: [],
                signup_time: new Date().getTime()
            };

            const query_email = { "email": email };
            db.collection("players").find(query_email).toArray(
                function(err, result){
                    if(err) throw err;   
                        if(result.length === 0){
                            db.collection("players").insertOne(player,
                                function(err, result1){
                                    if(err) throw err; 
                                    res.json({ 'response_msg': 'You were just signed up!', "id": player._id, "name": displayedname });
                                }
                            );
                        }else{
                            res.json({ 'response_msg': 'The email is already being used on Cariprop!' });
                        }
                }
            );
            
    });    
         
});


app.post('/playersfrompropping', function(req, res){
    const propping_id = new ObjectId(req.body.propping_id);

    //query database
    mongoclient.connect(DB_URL,
        { useNewUrlParser: true },
        function(err, client){
            if(err) throw err;
    
            const db = client.db(DB);
    

            db.collection("proppings").find({ _id: propping_id }).toArray(
                function(err, result){ 
                    if(err) throw err;
                    res.json({ 'response_msg': 'Here are the players!', "players": result });
                }
            );
        }
    );
});


app.post('/players', function(req, res){
    const propping_id = new ObjectId(req.body.propping_id);

    //query database
    mongoclient.connect(DB_URL,
        { useNewUrlParser: true },
        function(err, client){
            if(err) throw err;
    
            const db = client.db(DB);
    
            db.collection("proppings").find({ _id: propping_id }).toArray(
                function(err, res1){ 
                    if(err) throw err;
                    let player_ids = res1[0].players.map(item => item.id);
                    
                    db.collection("players").find({ _id: {$in: player_ids } }).toArray(
                        function(err, result){ 
                            if(err) throw err;
                                res.json({ 'response_msg': 'Here are the players!', "players": result });
                        }
                    );
                }
            );
        }
    );
});


app.post('/addplayer', function(req, res){
    const id = req.body.id;
    const name = req.body.name;

    //query database
    mongoclient.connect(DB_URL,
        { useNewUrlParser: true },
        function(err, client){
            if(err) throw err;
    
            const db = client.db(DB);
    
            const new_player = {
                id: new ObjectId( id ),
                name: name,
                status: "active",
                time: new Date().getTime()
            }
            
            const new_prop = {
                //add propping
                type: "",
                status: "active",
                players: [ new_player ],
                numberofplayers: 1,
                messages: [],
                time: new Date().getTime()
            }

            //const user_id = new ObjectId( id );
            //db.collection("proppings").findOneAndUpdate({ $and: [ { numberofplayers: { $lt: 10 } }, {players: { $not: { $elemMatch: { id: user_id } } } } ] }, { $push: { players: new_player }, $inc: { numberofplayers: 1 } },
        
            const user_id = new ObjectId( id );
            db.collection("proppings").findOneAndUpdate({ $and: [ { status: "active" }, { numberofplayers: { $lt: 10 } },  {players: { $not: { $elemMatch: { id: user_id } } } } ] }, { $push: { players: new_player }, $inc: { numberofplayers: 1 } },
                function(err, res1){ 
                    if(res1.value === null){
                        db.collection("proppings").insertOne( new_prop,
                            function(err, result1){
                            if(err) throw err; 
                            res.json({ 'response_msg': 'Player Added', "propping_id": new_prop._id });
                        })
                    }else{
                        res.json({ 'response_msg': 'Player Added', "propping_id": res1.value._id });
                    }
                }
            );    
        });
});


app.post('/message', function(req, res){
    const id = req.body.id;
    const name = req.body.name;
    const message = req.body.message;
    const propping_id = req.body.propping_id;
    
    //query database
    mongoclient.connect(DB_URL,
        { useNewUrlParser: true },
        function(err, client){
            if(err) throw err;
    
            const db = client.db(DB);
    
            const messageobj = { id: id, name: name, message: message };
            
            db.collection("proppings").findOneAndUpdate( { _id: new ObjectId( propping_id ) } , { $push: { messages: messageobj } },
                function(err, result){
                    if(err) throw err; 
                    res.json({ 'response_msg': "Message was successfully inserted!", "messages": result.value.messages });
                }
            );
    });          
});


app.post('/fetchmessages', function(req, res){
    const propping_id = req.body.propping_id;
    
    //query database
    mongoclient.connect(DB_URL,
        { useNewUrlParser: true },
        function(err, client){
            if(err) throw err;
    
            const db = client.db(DB);
    
            db.collection("proppings").find( { _id: new ObjectId( propping_id ) }).toArray(
                function(err, result){
                    if(err) throw err; 
                    if(result[0].messages.length > 0){
                        let reversed_results = result[0].messages.reverse().map(item => item);
                        res.json({ 'response_msg': "Here are the messages!", "messages": reversed_results });
                    }else{
                        res.json({ 'response_msg': "Here are the messages!", "messages": [{message: "still waiting..."}] });
                    }
                }
            );
            
    });    
         
});



app.post('/leftconversation', function(req, res){
    const id = req.body.id;
    const propping_id = req.body.propping_id;

    //query database
    mongoclient.connect(DB_URL,
        { useNewUrlParser: true },
        function(err, client){
            if(err) throw err;
    
            const db = client.db(DB);
    

            const user_id = new ObjectId( id );
            db.collection("proppings").findOneAndUpdate({ $and: [ { _id: new ObjectId( propping_id ) }, { "players.id": user_id } ] }, { "players.$.status": "left conversation" },
                function(err, res1){ 
                    if(res1.value === null){
                        db.collection("proppings").findOneAndUpdate( { $and: [ { _id: new ObjectId( propping_id ) }, { players: { $not: { $elemMatch: { "players.$.status": "active" } } } } ] }, { status: "inactive" },
                            function(err, result1){
                            if(err) throw err; 
                            res.json({ 'response_msg': 'Left conversation!' });
                        })
                    }else{
                        res.json({ 'response_msg': 'Left conversation!' });
                    }
                }
            );    
        });
});


//END OPERATIONS

app.use("/", express.static('public'));

app.get('*', function(req, res) {
    res.sendFile(path.join(__dirname + '/public/index.html'));
});

app.listen(PORT, () => console.log("You are connected at port "+PORT));
