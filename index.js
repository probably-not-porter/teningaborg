// MACHI KORO
// SERVER

const express = require("express");
const socket = require("socket.io");

// App Setup
const PORT = process.env.PORT || 3002;
const app = express();
const server = app.listen(PORT, function (){
    console.log("---- Machi Koro ----");
    console.log("--> Server Running");
});

// Static Files
app.use(express.static("public"));

// Game Setup
class CardType { // set up all the information for a card
    constructor(name, image, color, type, value, cost, activation, quantity, tip, id){
        this.name = name;
        this.image = image;
        this.color = color;
        this.type = type;
        this.value = value;
        this.cost = cost;
        this.activation = activation;
        this.quantity = quantity;
        this.tip = tip;
        this.id = id;
    }
}

class Player { // create a new player
    constructor(name, id){
        this.name = name;
        this.id = id;
        this.cards = [
            new CardType("Wheat Field", "Wheat_Field.svg", "blue", "wheat", 1, 1, [1], 1,
            "WHEAT FIELD\nActivation: 1\nCost: 1\nGet 1 coin from the bank, on anyone's turn.", 1), 

            new CardType("Bakery", "Bakery.svg", "green", "bread", 1, 1, [2,3], 1,
            "BAKERY\nActivation: 2-3\n Cost: 1\nGet 1 coin from bank, on your turn only", 6)
        ];
        this.coins = 0;
    }
}

class BoardState { // create a new board state
    constructor(name, id){
        this.id = id;
        this.state = 0; // 0 for waiting, 1 for in play
        this.name = name;
        this.feed = [];
        this.market = [
            new CardType("Wheat Field", "Wheat_Field.svg", "blue", "wheat", 1, 1, [1], 6,
            "WHEAT FIELD\nActivation: 1\nCost: 1\nGet 1 coin from the bank, on anyone's turn.", 1), 

            new CardType("Ranch", "Ranch.svg", "blue", "cow", 1, 1, [2], 6,
            "RANCH\nActivation: 2\n Cost: 1\nGet 1 coin from the bank, on anyone's turn.", 2), 

            new CardType("Forest", "Forest.svg", "blue", "gear", 1, 3, [5], 6,
            "FOREST\nActivation: 5\n Cost: 3\nGet 1 coin from the bank, on anyone's turn.", 3), 

            new CardType("Mine", "Mine.svg", "blue", "gear", 5, 6, [9], 6,
            "MINE\nActivation: 9\n Cost: 6\nGet 5 coins from the bank, on anyone’s turn.", 4), 

            new CardType("Apple Orchard", "Apple_Orchard.svg", "blue","wheat", 3, 3, [10], 6,
            "APPLE ORCHARD\nActivation: 10\n Cost: 3\nGet 3 coins from the bank, on anyone’s turn.", 5), 

            new CardType("Bakery", "Bakery.svg", "green", "bread", 1, 1, [2,3], 6,
            "BAKERY\nActivation: 2-3\n Cost: 1\nGet 1 coin from bank, on your turn only", 6), 

            new CardType("Convenience Store", "Convenience_Store.svg", "green", "bread", 3, 2, [4], 6,
            "CONVENIENCE STORE\nActivation: 4\n Cost: 2\nGet 3 coins from the bank, on your turn only.", 7), 

            new CardType("Cheese Factory", "Cheese_Factory.svg", "green", "factory", null, 5, [7], 6,
            "CHEESE FACTORY\nActivation: 7\n Cost: 5\nGet 3 coins from the bank for every [Cow] establishment you own, on your turn only.", 8), 

            new CardType("Furniture Factory", "Furniture_Factory.svg", "green", "factory", null, 3, [8], 6,
            "FURNITURE FACTORY\nActivation: 8\n Cost: 3\nGet 3 coins from the bank for every [Gear] establishment you own, on your turn only.", 9), 

            new CardType("Fruit and Vegetable Market", "Fruit_and_Vegetable_Market.svg", "green", "fruit", null, 2, [11,12], 6,
            "FRUIT AND VEGETABLE MARKET\nActivation: 11-12\n Cost: 2\nGet 2 coins from the bank for every [Wheat] establishment you own, on your turn only.", 10), 

            new CardType("Cafe", "Cafe.svg", "red", "cup", 2, 2, [3], 6,
            "CAFE\nActivation: 3\n Cost: 2\nGet 1 coin from the player who rolled the dice.", 11), 

            new CardType("Family Restaurant", "Family_Restaurant.svg", "red", "cup", 2, 3, [9,10], 6,
            "FAMILY RESTAURANT\nActivation: 9-10\n Cost: 3\nGet 2 coins from the player who rolled the dice.", 12), 

            new CardType("Stadium", "Stadium.svg", "purple", "tower", 2, 7, [6], 4,
            "STADIUM\nActivation: 6\n Cost: 6\nGet 2 coins from all players, on your turn only.", 13), 

            new CardType("TV Station", "TV_Station.svg", "purple", "tower", null, 7, [6], 4,
            "TV STATION\nActivation: 6\n Cost: 7\nTake 5 coins from any one player, on your turn only.", 14), 

            new CardType("Business Center", "Business_Center.svg", "purple", "tower", null, 8, [6], 4,
            "BUSINESS CENTER\nActivation: 6\n Cost: 8\nTrade one non-[tower] establishment with another player, on your turn only", 15), 

            new CardType("Train Station", "Train_Station.svg", "gold", "tower", null, 4, [], null,
            "TRAIN STATION\nCost: 4\nYou may roll 1 or 2 dice.", 16), 

            new CardType("Shopping Mall", "Shopping_Mall.svg", "gold", "tower", null, 10, [], null,
            "SHOPPING MALL\nCost: 10\nEach of your [cup] and [bread] establishments earn +1 coin.", 17), 

            new CardType("Amusement Park", "Amusement_Park.svg", "gold", "tower", null, 16, [], null,
            "AMUSEMENT PARK\nCost: 16\nIf you roll doubles, take another turn after this one.", 18), 
            
            new CardType("Radio Tower", "Radio_Tower.svg", "gold", "tower", null, 22, [], null,
            "RADIO TOWER\nCost: 22\nOnce every turn, you can choose to re-roll your dice.", 19)
        ];
        this.players = [];
        this.turn = 0;
        this.timer = 300;
    }
}
var _game_list = [
    
];

// Socket Setup
const io = socket(server);

io.on("connection", function (socket) {
    console.log("--> Made socket connection");

    socket.on("join_game", function(data) {
        console.log("--> Player '" + data[2] + "' has joined game " + data[0]);
        let game = null;
        socket.join(data[0])
        let self_player = new Player(data[2], data[1]);
        for (x in _game_list){
            if (_game_list[x].id == data[0]){
                game = _game_list[x]
            }
        }
        if (game != null){
            if (game.players.length < 4){
                game.players.push(self_player);
            }else{
                console.log("GAME FULL!");
            }
            io.emit("receive_gamelist", _game_list);
        }else{
            console.log("GAME DOESNT EXIST!");
        }
    });
    socket.on("leave_game", function(data) {
        console.log("--> Leaving game");
        socket.leave(data[0])
        for (x in _game_list){
            if (_game_list[x].id == data[0]){
                if (_game_list[x].players.length == 1){
                    _game_list.splice(x, 1);
                    io.emit("receive_gamelist", _game_list);
                }else{
                    for (y in _game_list[x].players){
                        if (_game_list[x].players[y].id == data[1]){
                            _game_list[x].players.splice(y, 1);
                            io.emit("receive_gamelist", _game_list);
                        }
                    }
                }
            }
        }
        
    });
    socket.on("reset", function() {
        _game_list = [];
    });
    socket.on("start_game", function(id) {
        console.log("--> Starting game " + id);
        for (x in _game_list){
            if (_game_list[x].id == id){
                _game_list[x].state = 1;
            }
        }
        io.emit("receive_gamelist", _game_list);
        let game = null;
        for (x in _game_list){
            if (_game_list[x].id == id){
                game = _game_list[x]
            }
        }
        io.to(id).emit("update_boardstate", game); // send boardstate to client
    });

    socket.on("create_game", function(data) {
        console.log("--> Player '" + data[3] + "' has created game " + data[1]);
        socket.join(data[1])
        let new_game = new BoardState(data[0], data[1]);
        let self_player = new Player(data[3], data[2]);
        new_game.players.push(self_player);
        _game_list.push(new_game);
        io.emit("receive_gamelist", _game_list);
    });
    socket.on("request_gamelist", function() {
        io.emit("receive_gamelist", _game_list);
    });
    socket.on("change_boardstate", function(state) {
        console.log("--> Change to boardstate");
        let game = null;
        for (x in _game_list){
            if (_game_list[x].id == state.id){
                _game_list[x] = state;
                game = _game_list[x];
            }
        }
        io.to(state.id).emit("update_boardstate", game);
    });

    socket.on("request_boardstate", function(id) { // client is requesting boardstate
        console.log("--> request boardstate")
        let game = null;
        for (x in _game_list){
            if (_game_list[x].id == id){
                game = _game_list[x]
            }
        }
        io.to(id).emit("update_boardstate", game); // send boardstate to client
    });
});
