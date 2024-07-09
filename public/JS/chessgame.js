const socket = io();

// Sending the message from frontend to backend through socket
// io.emit("name_variable");

// Receiving the data from backend
// socket.on("variable name", function() {
//   console.log("data received from backend!!");
// });

const chess = new Chess();
const boardElement = document.querySelector(".chessboard");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

const renderBoard = () => {
    const board = chess.board();
    boardElement.innerHTML = "";
    board.forEach((row, rowIndex) => {
        row.forEach((square, squareIndex) => {
            const squareElement = document.createElement("div");
            squareElement.classList.add("square", (rowIndex + squareIndex) % 2 === 0 ? "light" : "dark");
            squareElement.dataset.row = rowIndex;
            squareElement.dataset.col = squareIndex;
            if (square) {
                const pieceElement = document.createElement("div");
                pieceElement.classList.add(
                    "piece",
                    square.color === "w" ? "white" : "black"
                );
                pieceElement.innerText = getPieceUnicode(square);
                pieceElement.draggable = playerRole === square.color;
                pieceElement.addEventListener("dragstart", (e) => {
                    if (pieceElement.draggable) {
                        draggedPiece = pieceElement;
                        sourceSquare = { row: rowIndex, col: squareIndex };
                        e.dataTransfer.setData("text/plain", "");
                    }
                });
                pieceElement.addEventListener("dragend", (e) => {
                    draggedPiece = null;
                    sourceSquare = null;
                });
                squareElement.appendChild(pieceElement);
            }
            squareElement.addEventListener("dragover", (e) => {
                e.preventDefault();
            });
            squareElement.addEventListener("drop", function (e) {
                e.preventDefault();
                if (draggedPiece) {
                    const targetSquare = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col)
                    };
                    handleMove(sourceSquare, targetSquare); // moving from source to target
                }
            });
            boardElement.appendChild(squareElement);
        });
    });
    if (playerRole === 'b') {
        boardElement.classList.add("flipped");
    } else {
        boardElement.classList.remove("flipped");
    }
};

const handleMove = (source, target) => {
    const move = {
        from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
        to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
        promotion:'q'
    };
    
    // Only include promotion if it's a pawn reaching the last rank
    if (chess.get(move.from).type === 'p' && (move.to[1] === '1' || move.to[1] === '8')) {
        move.promotion = 'q'; // Automatically promote to queen for simplicity
    }

    if (chess.move(move)) {
        socket.emit("move", move);
    } else {
        console.log("Invalid move attempted:", move);
    }

    // Load the move back into the chess object to update its state
    chess.undo();
};

const getPieceUnicode = (piece) => {
    const unicodePieces = {
        p: '\u265F', // black pawn
        r: '\u265C', // black rook
        n: '\u265E', // black knight
        b: '\u265D', // black bishop
        q: '\u265B', // black queen
        k: '\u265A', // black king
        P: '\u2659', // white pawn
        R: '\u2656', // white rook
        N: '\u2658', // white knight
        B: '\u2657', // white bishop
        Q: '\u2655', // white queen
        K: '\u2654'  // white king
    };
    return unicodePieces[piece.type] || "";
};

socket.on("playerRole", function (role) {
    playerRole = role;
    renderBoard();
});

socket.on("spectatorRole", function () {
    playerRole = null;
    renderBoard();
});

socket.on("boardState", function (fen) {
    chess.load(fen);
    renderBoard();
});

socket.on("move", function (move) {
    chess.move(move);
    renderBoard();
});

renderBoard();
