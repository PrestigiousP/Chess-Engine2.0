import Referee from "../referee/Referee";
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
} from "../referee/rules";

interface AlphaBetaMove {
  piece: Piece;
  position: Position;
  value: number;
}

export default class Engine {
  ref: Referee;

  constructor(ref: Referee) {
    this.ref = ref;
  }

  play(pieces: Piece[]): Piece[] {
    const bestMove = this.alphaBeta(
      // bestMove,
      pieces,
      2,
      -Math.pow(10, 1000),
      Math.pow(10, 1000),
      TeamType.OPPONENT
    );
    console.log("the best move is: ", bestMove);
    if (bestMove.value == 0) {
      let moves: any = [];
      let move: any = null;
      let randomPiece: any = null;
      while (moves.length < 1) {
        randomPiece = pieces[Math.floor(Math.random() * pieces.length)];
        // console.log("the random piece move ", randomPiece);
        moves = this.getMoves(randomPiece, pieces, true);
        move = moves[Math.floor(Math.random() * moves.length)];
      }
      if (move != null) {
        console.log("the move choosen ", move);
        for (const piece of pieces) {
          if (piece.position == randomPiece.position) {
            console.log("the piece ", piece);
            console.log("the position ", move);
            piece.position = move;
            this.ref.removeCapturedPiece(piece, pieces);
            return pieces;
          }
        }
      }
      // moves[Math.floor(Math.random() * moves.length)];
    } else {
      if (pieces.length > 0) {
        for (const piece of pieces) {
          console.log(piece.position);
          if (piece.position === bestMove.piece.position) {
            piece.position = bestMove.position;
            this.ref.removeCapturedPiece(piece, pieces);
            return pieces;
          }
        }
      }
    }
    return pieces;
  }

  alphaBeta(
    // bestMove: AlphaBetaMove,
    pieces: Piece[],
    depth: number,
    a: number,
    b: number,
    maximizingPlayer: TeamType
  ): AlphaBetaMove {
    let bestMov = <AlphaBetaMove>(
      (<unknown>{ piece: null, position: null, value: null })
    );
    if (depth === 0) {
      const value = this.evaluation(pieces);
      // if (value === 1) {
      //   // console.log("knight took ? ", pieces[1]);
      // }
      let _eval = <AlphaBetaMove>(
        (<unknown>{ piece: null, position: null, value: value })
      );
      // console.log("the eval is: ", _eval);
      return _eval;
    }
    if (maximizingPlayer === TeamType.OPPONENT) {
      let maxEval = -1 * Math.pow(10, 1000); // -Infinite
      for (const piece of pieces) {
        if (piece.team === TeamType.OPPONENT) {
          const moves = this.getMoves(piece, pieces, true);
          for (const move of moves) {
            let tempPieces = JSON.parse(JSON.stringify(pieces));
            tempPieces.map((p: Piece) => {
              if (samePosition(p.position, piece.position)) {
                p.position = move;
                tempPieces = this.ref.removeCapturedPiece(p, tempPieces);
              }
            });
            const newEval = this.alphaBeta(
              tempPieces,
              depth - 1,
              a,
              b,
              TeamType.OUR
            );
            if (maxEval < newEval.value) {
              // console.log("found a better move ", move);
              // bestMov = newEval;
              bestMov.piece = piece;
              bestMov.position = move;
              bestMov.value = newEval.value;
              maxEval = newEval.value;
            }
            // maxEval = Math.max(maxEval, newEval.value);
            a = Math.max(a, newEval.value);
            if (b <= a) {
              break;
            }
          }
        }
      }
      return bestMov;
    } else {
      let minEval = Math.pow(10, 1000);
      for (const piece of pieces) {
        if (piece.team === TeamType.OUR) {
          const moves = this.getMoves(piece, pieces, false);
          for (const move of moves) {
            let tempPieces = JSON.parse(JSON.stringify(pieces));
            tempPieces.map((p: Piece) => {
              if (samePosition(p.position, piece.position)) {
                p.position = move;
                // console.log("before capture: ", tempPieces.length);
                tempPieces = this.ref.removeCapturedPiece(p, tempPieces);
                // console.log("after capture ", tempPieces.length);
              }
            });
            const newEval = this.alphaBeta(
              tempPieces,
              depth - 1,
              a,
              b,
              TeamType.OPPONENT
            );
            if (minEval > newEval.value) {
              // console.log("found a better move");
              // bestMov = newEval;
              bestMov.piece = piece;
              bestMov.position = move;
              bestMov.value = newEval.value;
              minEval = newEval.value;
            }
            b = Math.min(b, newEval.value);
            if (b <= a) {
              break;
            }
          }
        }
      }
      return bestMov;
    }
  }

  getMoves(piece: Piece, pieces: Piece[], turn: boolean): Position[] {
    let movesList: Position[];
    movesList = [];
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const move = <Position>{ x: i, y: j };
        if (
          this.ref.isValidMove(
            piece.position,
            move,
            piece.type,
            piece.team,
            pieces,
            !turn,
            0
          )
        ) {
          movesList.push({ x: i, y: j });
        }
      }
    }
    return movesList;
  }

  evaluation(pieces: Piece[]): number {
    let counter = 0;
    for (const piece of pieces) {
      if (piece.team === TeamType.OPPONENT) {
        switch (piece.type) {
          case PieceType.BISHOP:
            counter += 3;
            break;
          case PieceType.KNIGHT:
            counter += 3;
            break;
          case PieceType.PAWN:
            counter += 1;
            break;
          case PieceType.QUEEN:
            counter += 9;
            break;
          case PieceType.ROOK:
            counter += 5;
            break;
        }
      } else {
        switch (piece.type) {
          case PieceType.BISHOP:
            counter -= 3;
            break;
          case PieceType.KNIGHT:
            counter -= 3;
            break;
          case PieceType.PAWN:
            counter -= 1;
            break;
          case PieceType.QUEEN:
            counter -= 9;
            break;
          case PieceType.ROOK:
            counter -= 5;
            break;
        }
      }
    }
    // console.log("La différence de pointage: ", counter);
    return counter;
  }
}
