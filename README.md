# 21BAI1759_YARRAGUNTLA-KALYAN-CHAKRAVARTHY

## Epic Chess Battle: Turn by Turn
This is a simple, web-based, turn-based chess game where two players can engage in real-time competition using WebSockets. Players have the option to either create or join a game session, taking turns to make strategic moves on the board in a bid to win the game.

## Setup Instructions

### Server Setup:
1. Install Node.js: This is a JavaScript runtime that allows you to run JavaScript code on your computer.
2. Create a new project: Set up a folder for your game.
3. Add necessary tools: Use npm to install tools for creating a web server and handling real-time communication.
4. Start the game server: Run a JavaScript file to start the server that will control the game.

###  Client Setup:
1. Create a webpage: Make a file called client.html to show the chessboard.
2. Connect to the server: Use JavaScript code to connect the webpage to the game server.

### Playing the Game:

1. Start a new game: One player creates a game and gives the other player a special code.
   ![image](https://github.com/user-attachments/assets/94b63ef2-a1e6-4a72-913e-2b9a8a0ea28c)

2. Join the game: The other player uses the code to join the game.
   ![image](https://github.com/user-attachments/assets/ffc74887-643a-4aea-8f6a-f35aad8ac747)
3. Take turns: Players move their chess pieces by entering a code like "P1:F" (meaning Pawn-1 moves forward).
4. Watch the board: The chessboard will show the new positions of the pieces.
5. Players will input their moves in the prompt on the client page using the format "Piece:Direction" (e.g., 'P1:F' for Pawn-1 to move one step forward, or 'H2:BL' for Hero-2 to move two steps diagonally backward-left) and press "Submit" to execute the move.
6. The board will update in real-time as players make their moves, and the prompt will indicate whose turn it is.
7. Once all of one player’s pieces have been defeated, a message will appear declaring the winner, and the players can choose to start a new game.
8. Win or lose: The game ends when one player captures all of the other player's pieces.
   ![image](https://github.com/user-attachments/assets/f734d026-b67c-4519-ba4d-c69da9f39e05)

