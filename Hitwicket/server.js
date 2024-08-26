const http = require("http");
const express = require("express");
const app = express();

app.get("/", (req, res) => res.sendFile(__dirname + "/index.html"));
app.listen(9091, () => console.log("Listening on http port 9091"));

const websocketServer = require("websocket").server;
const httpServer = http.createServer();
httpServer.listen(9090, () => console.log("Listening on WebSocket port 9090"));

const clients = {};
const games = {};

const wsServer = new websocketServer({
    "httpServer": httpServer
});

wsServer.on("request", request => {
    const connection = request.accept(null, request.origin);

    connection.on("open", () => console.log("opened!"));
    connection.on("close", () => console.log("closed!"));
    connection.on("message", message => {
        const result = JSON.parse(message.utf8Data);

        if (result.method === "create") {
            const clientId = result.clientId;
            const gameId = guid();
            const state = initializeBoard();
            games[gameId] = {
                "id": gameId,
                "clients": [],
                "state": state,
                "currentPlayer": "A"
            };

            const payLoad = {
                "method": "create",
                "game": games[gameId]
            };

            const con = clients[clientId].connection;
            con.send(JSON.stringify(payLoad));
        }

        if (result.method === "join") {
            const clientId = result.clientId;
            const gameId = result.gameId;
            const game = games[gameId];
            game.clients.push(clientId);

            const payLoad = {
                "method": "join",
                "game": game
            };

            game.clients.forEach(cId => {
                clients[cId].connection.send(JSON.stringify(payLoad));
            });

            if (game.clients.length === 2) {
                notifyTurn(gameId);
                updateGameState(gameId);
            }
        }

        if (result.method === "play") {
            const gameId = result.gameId;
            const game = games[gameId];
            const move = result.move;

            if (validateMove(move, game)) {
                applyMove(move, game);
                if (checkWinCondition(game)) {
                    const payLoad = {
                        "method": "win",
                        "winner": game.currentPlayer
                    };

                    game.clients.forEach(cId => {
                        clients[cId].connection.send(JSON.stringify(payLoad));
                    });
                } else {
                    game.currentPlayer = game.currentPlayer === "A" ? "B" : "A";
                    notifyTurn(gameId);
                    updateGameState(gameId);
                }
            } else {
                const payLoad = {
                    "method": "invalidMove"
                };

                const con = clients[game.clients[0]].connection;
                con.send(JSON.stringify(payLoad));
            }
        }
    });

    const clientId = guid();
    clients[clientId] = {
        "connection": connection
    };

    const payLoad = {
        "method": "connect",
        "clientId": clientId
    };
    connection.send(JSON.stringify(payLoad));
});

function initializeBoard() {
    return [
        ["A-P1", "A-H1", "A-H2", "A-P2", "A-P3"],
        [null, null, null, null, null],
        [null, null, null, null, null],
        [null, null, null, null, null],
        ["B-P1", "B-H1", "B-H2", "B-P2", "B-P3"]
    ];
}

function updateGameState(gameId) {
    const game = games[gameId];
    const payLoad = {
        "method": "update",
        "game": game
    };

    game.clients.forEach(cId => {
        clients[cId].connection.send(JSON.stringify(payLoad));
    });
}

function notifyTurn(gameId) {
    const game = games[gameId];
    const payLoad = {
        "method": "turn",
        "currentPlayer": game.currentPlayer
    };

    game.clients.forEach(cId => {
        clients[cId].connection.send(JSON.stringify(payLoad));
    });
}

function validateMove(move, game) {
    const [piece, direction] = move.split(":");
    const state = game.state;

    // Find the position of the piece on the board
    let pieceRow = -1;
    let pieceCol = -1;
    for (let row = 0; row < state.length; row++) {
        for (let col = 0; col < state[row].length; col++) {
            if (state[row][col] === `${game.currentPlayer}-${piece}`) {
                pieceRow = row;
                pieceCol = col;
                break;
            }
        }
        if (pieceRow !== -1) break; // Exit if the piece is found
    }

    if (pieceRow === -1 || pieceCol === -1) {
        console.log("Piece not found on the board.");
        return false; // Piece not found
    }

    // Determine the target position based on the direction
    let targetRow = pieceRow;
    let targetCol = pieceCol;

    // Pawns can only move one step in any direction
    const moveDistance = (piece.startsWith("P")) ? 1 : 2;

    switch (direction) {
        case "L":
            targetCol = pieceCol - moveDistance;
            break;
        case "R":
            targetCol = pieceCol + moveDistance;
            break;
        case "F":
            targetRow = pieceRow - moveDistance;
            break;
        case "B":
            targetRow = pieceRow + moveDistance;
            break;
        case "FL":
            targetRow = pieceRow - moveDistance;
            targetCol = pieceCol - moveDistance;
            break;
        case "FR":
            targetRow = pieceRow - moveDistance;
            targetCol = pieceCol + moveDistance;
            break;
        case "BL":
            targetRow = pieceRow + moveDistance;
            targetCol = pieceCol - moveDistance;
            break;
        case "BR":
            targetRow = pieceRow + moveDistance;
            targetCol = pieceCol + moveDistance;
            break;
        default:
            console.log("Invalid direction.");
            return false; // Invalid direction
    }

    // Check if the target position is within the bounds of the board
    if (targetRow < 0 || targetRow >= state.length || targetCol < 0 || targetCol >= state[0].length) {
        console.log("Move out of bounds.");
        return false; // Move is out of bounds
    }

    // Check if the target position is occupied by the current player's piece
    if (state[targetRow][targetCol] && state[targetRow][targetCol].startsWith(game.currentPlayer)) {
        console.log("Move blocked by own piece.");
        return false; // Target position is occupied by the current player's own piece
    }

    // Specific piece movement rules
    switch (piece) {
        case "P1":
        case "P2":
        case "P3":
            if (Math.abs(targetRow - pieceRow) > 1 || Math.abs(targetCol - pieceCol) > 1) {
                console.log("Invalid move for Pawn.");
                return false;
            }
            break;
        case "H1":
            if ((direction === "L" || direction === "R") && Math.abs(targetCol - pieceCol) !== 2) {
                console.log("Invalid move for Hero1.");
                return false;
            }
            if ((direction === "F" || direction === "B") && Math.abs(targetRow - pieceRow) !== 2) {
                console.log("Invalid move for Hero1.");
                return false;
            }
            break;
        case "H2":
            if (Math.abs(targetRow - pieceRow) !== 2 || Math.abs(targetCol - pieceCol) !== 2) {
                console.log("Invalid move for Hero2.");
                return false;
            }
            break;
        default:
            console.log("Invalid piece.");
            return false; // Invalid piece
    }

    return true;
}

function applyMove(move, game) {
    const [piece, direction] = move.split(":");
    const state = game.state;

    let found = false;
    for (let row = 0; row < state.length; row++) {
        for (let col = 0; col < state[row].length; col++) {
            if (state[row][col] === `${game.currentPlayer}-${piece}`) {
                found = true;
                state[row][col] = null;

                // Update position based on direction
                const moveDistance = piece.startsWith("P") ? 1 : 2;
                switch (direction) {
                    case "L": col = Math.max(col - moveDistance, 0); break;
                    case "R": col = Math.min(col + moveDistance, state[row].length - 1); break;
                    case "F": row = Math.max(row - moveDistance, 0); break;
                    case "B": row = Math.min(row + moveDistance, state.length - 1); break;
                    case "FL": row = Math.max(row - moveDistance, 0); col = Math.max(col - moveDistance, 0); break;
                    case "FR": row = Math.max(row - moveDistance, 0); col = Math.min(col + moveDistance, state[row].length - 1); break;
                    case "BL": row = Math.min(row + moveDistance, state.length - 1); col = Math.max(col - moveDistance, 0); break;
                    case "BR": row = Math.min(row + moveDistance, state.length - 1); col = Math.min(col + moveDistance, state[row].length - 1); break;
                }

                state[row][col] = `${game.currentPlayer}-${piece}`;
                break;
            }
        }
        if (found) break;
    }
}


function checkWinCondition(game) {
    const state = game.state;
    let playerAWon = true;
    let playerBWon = true;

    for (let row = 0; row < state.length; row++) {
        for (let col = 0; col < state[row].length; col++) {
            if (state[row][col] && state[row][col].startsWith("B")) {
                playerAWon = false;
            }
            if (state[row][col] && state[row][col].startsWith("A")) {
                playerBWon = false;
            }
        }
    }

    return playerAWon || playerBWon;
}

function guid() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c === "x" ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
