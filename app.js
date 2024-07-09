const express = require("express");
const socket = require("socket.io");
const http = require("http");
const { Chess } = require("chess.js");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();
let player = {};
let currentPlayer = "w";

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.render("index", { "title": "Welcome to Chess Game" });
});

io.on("connection", function (uniqusocket) {
    console.log("connected!!");

    if (!player.white) {
        player.white = uniqusocket.id;
        uniqusocket.emit("playerRole", "w");
    } else if (!player.black) {
        player.black = uniqusocket.id;
        uniqusocket.emit("playerRole", "b");
    } else {
        uniqusocket.emit("spectatorRole");
    }

    uniqusocket.on("disconnect", function (e) {
        if (uniqusocket.id === player.white) {
            console.log("user disconnected!!",`${e}`);
            delete player.white;
        } else if (uniqusocket.id === player.black) {
            console.log("user disconnected!!");
            delete player.black;
        }
    });

    uniqusocket.on("move", function (move) {
        try {
            // Validate move
            if (chess.turn() === "w" && uniqusocket.id !== player.white) {
                return;
            }
            if (chess.turn() === "b" && uniqusocket.id !== player.black) {
                return;
            }

            const result = chess.move(move);
            if (result) {
                currentPlayer = chess.turn();
                io.emit("move", move);
                io.emit("boardState", chess.fen());
            } else {
                console.log("Invalid move! :", move);
                uniqusocket.emit("invalidMove", move);
            }
        } catch (error) {
            console.log(error);
            uniqusocket.emit("invalidMove", move);
        }
    });
});

server.listen(3000, function () {
    console.log("Server is running!!");
});
