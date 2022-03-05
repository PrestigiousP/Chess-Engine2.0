import { off } from "process";
import {
  PieceType,
  TeamType,
  Piece,
  Position,
  samePosition,
} from "../Constants";

import { 
  pawnMove, 
  knightMove, 
  bishopMove, 
  rookMove, 
  queenMove, 
  kingMove,
} from "./rules";

export default class Referee {
  state: Piece[] = [];

  isEnPassantMove(
    initialPosition: Position,
    desiredPosition: Position,
    type: PieceType,
    team: TeamType,
    boardState: Piece[]
  ) {
    const pawnDirection = team === TeamType.OUR ? 1 : -1;

    if (type === PieceType.PAWN) {
      if (
        (desiredPosition.x - initialPosition.x === -1 ||
          desiredPosition.x - initialPosition.x === 1) &&
        desiredPosition.y - initialPosition.y === pawnDirection
      ) {
        const piece = boardState.find(
          (p) =>
            p.position.x === desiredPosition.x &&
            p.position.y === desiredPosition.y - pawnDirection &&
            p.enPassant
        );
        if (piece) {
          return true;
        }
      }
    }

    return false;
  }

  //TODO
  //Prevent the king from moving into danger!
  //Add castling!
  //Add check!
  //Add checkmate!
  //Add stalemate!
  isValidMove(initialPosition: Position, desiredPosition: Position, type: PieceType, team: TeamType, boardState: Piece[], turn: boolean, depth: number) {
    let validMove = false;
    let tempBoard: Piece[];
    let kingPrevPos = {
      x: 10,
      y: 10
    };


    if(this.checkTurn(team, turn)){
      return false;
    }

    switch (type) {
      case PieceType.PAWN:
        validMove = pawnMove(initialPosition, desiredPosition, team, boardState);
        break;
      case PieceType.KNIGHT:
        validMove = knightMove(initialPosition, desiredPosition, team, boardState);
        break;
      case PieceType.BISHOP:
        validMove = bishopMove(initialPosition, desiredPosition, team, boardState);
        break;
      case PieceType.ROOK:
        validMove = rookMove(initialPosition, desiredPosition, team, boardState);
        break;
      case PieceType.QUEEN:
        validMove = queenMove(initialPosition, desiredPosition, team, boardState);
        break;
      case PieceType.KING:
        validMove = kingMove(initialPosition, desiredPosition, team, boardState);

        if(depth < 1 && validMove){
          tempBoard = JSON.parse(JSON.stringify(boardState))
          tempBoard.map(piece => {
            if(samePosition(piece.position, initialPosition)){
              piece.position = desiredPosition;
              kingPrevPos.x = piece.position.x
              kingPrevPos.y = piece.position.y
              const king = piece
              if(this.kingMoveToInvalidSquare(team, desiredPosition, tempBoard, turn, depth)){
                console.log('invalid square')
                validMove = false;
                // tempBoard.map(piece => {
                //   if(piece.team === team && piece.type === PieceType.KING)
                //   {
                //     piece.position = kingPrevPos
                //     console.log('board reset ', boardState)
                //   }
                // })
                
                // boardState.map(piece => {
                //   if(piece.team === team && piece.type === PieceType.KING)
                //   {
                //     piece.position = kingPrevPos

                //     console.log('board reset ', boardState)
                //   }
                // })
              }
              // console.log('the king: ', king)
            }
          })
        }
        break;
    }
    return validMove;
  }

  kingMoveToInvalidSquare(team: TeamType, desiredPosition: Position, board: Piece[], turn: boolean, depth: number): boolean {
    let currentTurn = turn;
    currentTurn = !currentTurn;

    for(const piece of board){
      if(piece.team !== team && depth < 1){
        if(this.isValidMove(
          piece.position,
          desiredPosition,
          piece.type,
          piece.team,
          board,
          currentTurn,
          depth+1
          )){
            return true;
          }
      }
    }
    return false;
  }

  checkTurn(team: TeamType, turn: boolean) {
    if(team === TeamType.OUR && turn === false ||
      team === TeamType.OPPONENT && turn === true
      ){
      // If true then it is NOT your turn
      return true;
    }
  }
}