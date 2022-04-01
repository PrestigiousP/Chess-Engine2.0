import {
  Piece,
  PieceType,
  TeamType,
  Position,
  samePosition,
} from "../Constants";

export default class Move {
  _piece: Piece;
  _desiredPosition: Position;

  constructor(piece: Piece, desiredPosition: Position) {
    this._piece = piece;
    this._desiredPosition = desiredPosition;
  }

  get desiredPosition(): Position {
    return this.desiredPosition;
  }

  get piece(): Piece {
    return this._piece;
  }
}
