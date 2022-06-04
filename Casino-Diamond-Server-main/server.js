var express = require('express');
var app = express();
const axios = require("axios");
require('dotenv').config();
var bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
var cors = require('cors');
const util = require('util');
var server = require('http').createServer(app);
var port = 5000;
var io = require('socket.io')(server);
axios.defaults.headers.common["Authorization"] = process.env.SECRETCODE;

gameSocket = null;
app.use(bodyParser.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

server.listen(port, function () {
	console.log("server is running on " + port);
});



// Implement socket functionality
gameSocket = io.on('connection', function (socket) {
	socket.on('disconnect', () => {
		console.log('user disconnected');
	});

	socket.on('bet info', (req) => {
		var randomArray = [];
		var betResult = [];
		var counts = [];
		var isBetting;
		var amount;
		var userToken;

		console.log(req);	

		try {
			isBetting = req.isBetting;
			betAmount = req.betAmount;
			amount = req.amount - betAmount;		
			userToken = req.token;

			try{
				axios.post(process.env.PLATFORM_SERVER + "api/games/bet", {
					token: req.token,
					amount: req.betAmount
				}); 
			  }catch(err){
				throw new Error("Bet Error")
			  }

			randomArray = CreateRandomArray();
			console.log(randomArray)
			counts = count_duplicate(randomArray);
			var amountCross = getScore(counts);
			var earnAmount = betAmount * amountCross;
			amount += earnAmount;
			console.log(amountCross, earnAmount, amount);

			try{
				axios.post(process.env.PLATFORM_SERVER + "api/games/winlose", {
				  token: userToken,
				  amount: earnAmount,
				  winState: true
				});
			  }catch(err){
				throw new Error("Can't find server")
			  }

			betResult = {"amountCross":amountCross, "earnAmount":earnAmount, "amount":amount, "randomArray":randomArray};
			socket.emit("game result", betResult)
		} catch (err) {
			socket.emit("error", {message: err.message})
		}
	}); 

	console.log('socket connected: ' + socket.id);
	socket.emit('connected', {});
});

function CreateRandomArray() {
	var randomArray = [];
	for (var i = 0; i < 5; i++) {
		var randomNum = getRandomInt(7);
		randomArray.push(randomNum);
	}
	return randomArray;
}

function getRandomInt(max) {
	return Math.floor(Math.random() * max);
}

function count_duplicate(randomArray) {
	var counts = [];
	randomArray.forEach((i) => { counts[i] = (counts[i] || 0) + 1 });
	counts = counts.filter((c) => { if (c) return c });
	counts = counts.sort();
	return counts;
}

const getScore = (counts) => {
	for (var score of scores) {
		if (arrayEquals(counts, score.counts)) {
			return score.rate;
		}
	}
	return 0;
}

function arrayEquals(a, b) {
	return Array.isArray(a) &&
		Array.isArray(b) &&
		a.length === b.length &&
		a.every((val, index) => val === b[index]);
}

// score
var scores = [
	{
		counts: [1, 1, 1, 1, 1],
		rate: 0
	},
	{
		counts: [1, 1, 1, 2],
		rate: 0.1
	},
	{
		counts: [1, 2, 2],
		rate: 2
	},
	{
		counts: [1, 1, 3],
		rate: 3
	},
	{
		counts: [2, 3],
		rate: 4
	},
	{
		counts: [1, 4],
		rate: 5
	},
	{
		counts: [5],
		rate: 50
	},
]