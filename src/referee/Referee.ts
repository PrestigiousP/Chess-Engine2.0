import { off } from "process";
import {
  PieceType,
  TeamType,
  Piece,
  Position,
  samePosition,
  Move,
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
  //Add check!
  //Add checkmate!
  //Add stalemate!
  isValidMove(
    initialPosition: Position,
    desiredPosition: Position,
    type: PieceType,
    team: TeamType,
    boardState: Piece[],
    turn: boolean,
    depth: number
  ) {
    let validMove = false;
    let tempBoard: Piece[];
    let kingPrevPos = {
      x: 10,
      y: 10,
    };

    if (this.checkTurn(team, turn)) {
      // console.log("checkturn");
      return false;
    }

    switch (type) {
      case PieceType.PAWN:
        validMove = pawnMove(
          initialPosition,
          desiredPosition,
          team,
          boardState
        );
        break;
      case PieceType.KNIGHT:
        validMove = knightMove(
          initialPosition,
          desiredPosition,
          team,
          boardState
        );
        break;
      case PieceType.BISHOP:
        validMove = bishopMove(
          initialPosition,
          desiredPosition,
          team,
          boardState
        );
        break;
      case PieceType.ROOK:
        validMove = rookMove(
          initialPosition,
          desiredPosition,
          team,
          boardState
        );
        break;
      case PieceType.QUEEN:
        validMove = queenMove(
          initialPosition,
          desiredPosition,
          team,
          boardState
        );
        break;
      case PieceType.KING:
        validMove = kingMove(
          initialPosition,
          desiredPosition,
          team,
          boardState
        );

        if (depth < 1 && validMove) {
          tempBoard = JSON.parse(JSON.stringify(boardState));
          tempBoard.map((piece) => {
            if (samePosition(piece.position, initialPosition)) {
              piece.position = desiredPosition;
              kingPrevPos.x = piece.position.x;
              kingPrevPos.y = piece.position.y;
              if (
                this.kingMoveToInvalidSquare(
                  team,
                  desiredPosition,
                  tempBoard,
                  turn,
                  depth
                )
              ) {
                validMove = false;
              }
            }
          });
        }
        break;
    }

    if (validMove && depth < 1) {
      tempBoard = JSON.parse(JSON.stringify(boardState));
      tempBoard.map((piece) => {
        if (samePosition(piece.position, initialPosition)) {
          piece.position = desiredPosition;
          tempBoard = this.removeCapturedPiece(piece, tempBoard);
          if (this.isInCheck(tempBoard, turn)) {
            validMove = false;
          }
        }
      });
    }
    return validMove;
  }

  removeCapturedPiece(piece: Piece, pieces: Piece[]) {
    let p = null;
    for (const piec of pieces) {
      if (
        samePosition(piec.position, piece.position) &&
        piece.team !== piec.team
      ) {
        p = piec;
      }
    }
    if (p !== null) {
      // console.log("captured piece ", p);
      let idx = pieces.indexOf(p);
      if (idx !== -1) {
        pieces.splice(idx, 1);
      }
    }
    return pieces;
  }

  isInCheck(pieces: Piece[], turn: boolean) {
    // Find the king
    let king = this.getKing(pieces, turn);
    for (const piece of pieces) {
      // Check if enemy pieces can check the king
      if (piece?.team !== king?.team) {
        if (king !== null) {
          if (
            this.isValidMove(
              piece.position,
              { x: king.position.x, y: king.position.y },
              piece.type,
              piece.team,
              pieces,
              !turn,
              1
            )
          ) {
            return true;
          }
        }
      }
    }
    return false;
  }

  kingMoveToInvalidSquare(
    team: TeamType,
    desiredPosition: Position,
    board: Piece[],
    turn: boolean,
    depth: number
  ): boolean {
    const currentTurn = !turn;

    const king = this.getKing(board, turn);
    let p = null;
    if (king !== null) {
      p = this.removeCapturedPiece(king, board);
    }

    for (const piece of board) {
      if (piece.team !== team && depth < 1) {
        if (
          this.isValidMove(
            piece.position,
            desiredPosition,
            piece.type,
            piece.team,
            board,
            currentTurn,
            depth + 1
          )
        ) {
          return true;
        }
      }
    }
    return false;
  }

  checkCastling(king: Piece, pieces: Piece[], side: number, turn: boolean) {
    const row = king.position.y;
    let rook = null;

    // Castling right
    if (side < 0) {
      for (const piece of pieces) {
        // Check if attacks between rook and king
        if (piece.team !== king.team) {
          for (let i = 0; i < 3; i++) {
            if (
              this.isValidMove(
                piece.position,
                { x: king.position.x + i, y: king.position.y },
                piece.type,
                piece.team,
                pieces,
                !turn,
                1
              )
            ) {
              return false;
            }
          }
        }

        if (piece.type === PieceType.ROOK && piece.team === king.team) {
          if (piece.position.x === 7) {
            rook = piece;
            if (piece.hasMoved) {
              return false;
            }
          }
        }

        // Check if pieces between rook and king
        if (samePosition(piece.position, { x: 5, y: row })) {
          return false;
        } else if (samePosition(piece.position, { x: 6, y: row })) {
          return false;
        }
      }
    }
    // Castling left
    else {
      for (const piece of pieces) {
        if (piece.team !== king.team) {
          for (let i = 0; i < 4; i++) {
            if (
              this.isValidMove(
                piece.position,
                { x: king.position.x - i, y: king.position.y },
                piece.type,
                piece.team,
                pieces,
                !turn,
                1
              )
            ) {
              return false;
            }
          }
        }

        if (piece.type === PieceType.ROOK && piece.team === king.team) {
          if (piece.position.x === 0) {
            rook = piece;
            if (piece.hasMoved) {
              return false;
            }
          }
        }

        if (samePosition(piece.position, { x: 1, y: row })) {
          return false;
        } else if (samePosition(piece.position, { x: 2, y: row })) {
          return false;
        } else if (samePosition(piece.position, { x: 3, y: row })) {
          return false;
        }
      }
    }

    // If rook is not null, it means we found the rook.
    if (rook !== null) {
      return true;
    }
    return false;
  }

  getKing(pieces: Piece[], turn: boolean) {
    for (const piece of pieces) {
      if (piece?.type === PieceType.KING) {
        if (turn) {
          if (piece.team === TeamType.OUR) {
            return piece;
          }
        } else {
          if (piece.team === TeamType.OPPONENT) {
            return piece;
          }
        }
      }
    }
    return null;
  }

  checkTurn(team: TeamType, turn: boolean) {
    if (
      (team === TeamType.OUR && turn === false) ||
      (team === TeamType.OPPONENT && turn === true)
    ) {
      // If true then it is NOT your turn
      return true;
    }
  }

  isCheckmate(pieces: Piece[], turn: boolean) {
    // Potential draw
    if (pieces.length === 2) {
      return "draw";
    } else if (pieces.length < 5) {
      let countWhite = 0;
      let countBlack = 0;
      for (const piece of pieces) {
        if (piece.type !== PieceType.KING) {
          if (
            piece.type !== PieceType.PAWN &&
            piece.type !== PieceType.QUEEN &&
            piece.type !== PieceType.ROOK
          ) {
            if (piece.team === TeamType.OUR) {
              countWhite++;
            } else {
              countBlack++;
            }
          }
        }
      }
      if (countWhite < 2) {
        return "draw";
      } else if (countBlack < 2) {
        return "draw";
      }
    }

    for (const piece of pieces) {
      // white's turn
      if (turn && piece.team === TeamType.OUR) {
        for (let i = 0; i < 8; i++) {
          for (let j = 0; j < 8; j++) {
            if (
              this.isValidMove(
                piece.position,
                { x: i, y: j },
                piece.type,
                piece.team,
                pieces,
                turn,
                0
              )
            ) {
              return "false";
            }
          }
        }
      } else if (!turn && piece.team === TeamType.OPPONENT) {
        for (let i = 0; i < 8; i++) {
          for (let j = 0; j < 8; j++) {
            if (
              this.isValidMove(
                piece.position,
                { x: i, y: j },
                piece.type,
                piece.team,
                pieces,
                turn,
                0
              )
            ) {
              return "false";
            }
          }
        }
      }
    }

    if (this.isInCheck(pieces, turn)) {
      return "true";
    } else {
      return "stalemate";
    }
  }
}
