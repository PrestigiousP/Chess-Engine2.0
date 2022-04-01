import { Piece, PieceType, Position, samePosition } from "../../Constants";
import Referee from "../../referee/Referee";

export default class ChessboardHelper {
  castlingReduce(
    pieces: Piece[],
    castling: any,
    tempKingPosX: number,
    tempKingPosY: number,
    grabPosition: Position,
    x: number,
    y: number
  ) {
    pieces.reduce((results, piece) => {
      if (castling.side === "right") {
        if (
          samePosition(piece.position, {
            x: tempKingPosX + 3,
            y: tempKingPosY,
          }) &&
          piece.type === PieceType.ROOK
        ) {
          piece.position.x = 5;
          piece.hasMoved = true;
        }
      } else if (castling.side === "left") {
        if (
          samePosition(piece.position, {
            x: tempKingPosX - 4,
            y: tempKingPosY,
          }) &&
          piece.type === PieceType.ROOK
        ) {
          piece.position.x = 3;
          piece.hasMoved = true;
        }
      }
      if (samePosition(piece.position, grabPosition)) {
        piece.position.x = x;
        piece.position.y = y;
        results.push(piece);
      }
      if (!samePosition(piece.position, { x, y })) {
        if (piece.type === PieceType.PAWN) {
          piece.enPassant = false;
        }
        results.push(piece);
      }

      return results;
    }, [] as Piece[]);
  }
}
