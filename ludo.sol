// SPDX-License-Identifier: MIT

pragma solidity >=0.8.18;

contract LudoGame {
    
    uint256 private nonce = 0;
    uint8 public constant BOARD_SIZE = 52;
    uint8 public constant PLAYERS = 4;
    
    struct Player {
        uint8[4] pieces; 
        bool[4] inHome; 
    }
    
    Player[PLAYERS] public players;
    uint8 public currentPlayer;
    
    event DiceRolled(uint8 player, uint8 roll);
    event PieceMoved(uint8 player, uint8 pieceIndex, uint8 newPosition);
    event PlayerWon(uint8 player);
    
    constructor() {
        currentPlayer = 0;
        for (uint8 i = 0; i < PLAYERS; i++) {
            for (uint8 j = 0; j < 4; j++) {
                players[i].pieces[j] = 0;
                players[i].inHome[j] = false;
            }
        }
    }
    
    function rollDice() public returns (uint8) {
        require(msg.sender == tx.origin, "Only EOA can call this function");
        
        uint8 roll = uint8((uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, nonce))) % 6) + 1);
        nonce++;
        
        emit DiceRolled(currentPlayer, roll);
        return roll;
    }
    
    function movePiece(uint8 pieceIndex) public {
        require(pieceIndex < 4, "Invalid piece index");
        require(!players[currentPlayer].inHome[pieceIndex], "Piece already in home");
        
        uint8 roll = rollDice();
        uint8 newPosition = (players[currentPlayer].pieces[pieceIndex] + roll) % BOARD_SIZE;
        
        players[currentPlayer].pieces[pieceIndex] = newPosition;
        emit PieceMoved(currentPlayer, pieceIndex, newPosition);
        
        if (newPosition == BOARD_SIZE - 1) {
            players[currentPlayer].inHome[pieceIndex] = true;
            checkWinCondition();
        }
        
        currentPlayer = (currentPlayer + 1) % PLAYERS;
    }
    
    function checkWinCondition() private {
        bool allInHome = true;
        for (uint8 i = 0; i < 4; i++) {
            if (!players[currentPlayer].inHome[i]) {
                allInHome = false;
                break;
            }
        }
        
        if (allInHome) {
            emit PlayerWon(currentPlayer);
        }
    }
    
}