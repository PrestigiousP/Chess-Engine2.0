import { useRef, useState } from "react";
import "./Chessboard.css";
import Tile from "../Tile/Tile";
import Referee from "../../referee/Referee";
import Engine from "../../Engine/Engine";
import {
  VERTICAL_AXIS,
  HORIZONTAL_AXIS,
  GRID_SIZE,
  Piece,
  PieceType,
  TeamType,
  initialBoardState,
  Position,
  samePosition,
} from "../../Constants";
import React from "react";
import OnDropObservable from "../../Engine/OnDropObservable";
import ChessboardHelper from "./ChessboardHelper";

export default function Chessboard() {
  // When it's true it is white to play
  const [first, setFirst] = useState(0);
  const [engineToPlay, setEngineToPlay] = useState(false);
  const [turn, setTurn] = useState(true);
  const [activePiece, setActivePiece] = useState<HTMLElement | null>(null);
  const [promotionPawn, setPromotionPawn] = useState<Piece>();
  const [grabPosition, setGrabPosition] = useState<Position>({ x: -1, y: -1 });
  const [pieces, setPieces] = useState<Piece[]>(initialBoardState);
  const chessboardRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const referee = new Referee();
  const engine = new Engine(referee);
  const chessboardHelper = new ChessboardHelper();
  const onDropObservable = new OnDropObservable(() => {
    setPieces(engine.play(pieces));
  });

  function grabPiece(e: React.MouseEvent) {
    const element = e.target as HTMLElement;
    const chessboard = chessboardRef.current;
    if (element.classList.contains("chess-piece") && chessboard) {
      const grabX = Math.floor((e.clientX - chessboard.offsetLeft) / GRID_SIZE);
      const grabY = Math.abs(
        Math.ceil((e.clientY - chessboard.offsetTop - 800) / GRID_SIZE)
      );
      setGrabPosition({ x: grabX, y: grabY });

      const x = e.clientX - GRID_SIZE / 2;
      const y = e.clientY - GRID_SIZE / 2;
      element.style.position = "absolute";
      element.style.left = `${x}px`;
      element.style.top = `${y}px`;

      setActivePiece(element);
    }
  }

  function movePiece(e: React.MouseEvent) {
    const chessboard = chessboardRef.current;
    if (activePiece && chessboard) {
      const minX = chessboard.offsetLeft - 25;
      const minY = chessboard.offsetTop - 25;
      const maxX = chessboard.offsetLeft + chessboard.clientWidth - 75;
      const maxY = chessboard.offsetTop + chessboard.clientHeight - 75;
      const x = e.clientX - 50;
      const y = e.clientY - 50;
      activePiece.style.position = "absolute";

      //If x is smaller than minimum amount
      if (x < minX) {
        activePiece.style.left = `${minX}px`;
      }
      //If x is bigger than maximum amount
      else if (x > maxX) {
        activePiece.style.left = `${maxX}px`;
      }
      //If x is in the constraints
      else {
        activePiece.style.left = `${x}px`;
      }

      //If y is smaller than minimum amount
      if (y < minY) {
        activePiece.style.top = `${minY}px`;
      }
      //If y is bigger than maximum amount
      else if (y > maxY) {
        activePiece.style.top = `${maxY}px`;
      }
      //If y is in the constraints
      else {
        activePiece.style.top = `${y}px`;
      }
    }
  }

  function dropPiece(e: React.MouseEvent) {
    let changeTurn = false;
    const chessboard = chessboardRef.current;
    let castling = { legal: false, side: "" };
    let tempKingPosX = -1;
    let tempKingPosY = -1;

    if (activePiece && chessboard) {
      const x = Math.floor((e.clientX - chessboard.offsetLeft) / GRID_SIZE);
      const y = Math.abs(
        Math.ceil((e.clientY - chessboard.offsetTop - 800) / GRID_SIZE)
      );

      const currentPiece = pieces.find((p) =>
        samePosition(p.position, grabPosition)
      );

      // King special rules
      if (currentPiece) {
        if (currentPiece.type === PieceType.KING) {
          tempKingPosX = currentPiece.position.x;
          tempKingPosY = currentPiece.position.y;

          // Check if castling possible
          if (currentPiece.position.y === y) {
            if (!currentPiece.hasMoved) {
              if (currentPiece.position.x === x + 2) {
                if (referee.checkCastling(currentPiece, pieces, 2, turn)) {
                  castling = { legal: true, side: "left" };
                }
              } else if (currentPiece.position.x === x - 2) {
                if (referee.checkCastling(currentPiece, pieces, -2, turn)) {
                  castling = { legal: true, side: "right" };
                }
              }
            }
          }
        }

        const validMove = referee.isValidMove(
          grabPosition,
          { x, y },
          currentPiece.type,
          currentPiece.team,
          pieces,
          turn,
          0
        );
        // console.log('thisiisisis ', validMove)

        if (!validMove) {
          if (currentPiece.type === PieceType.KING) {
            currentPiece.position.x = tempKingPosX;
            currentPiece.position.y = tempKingPosY;
          }
        }

        const isEnPassantMove = referee.isEnPassantMove(
          grabPosition,
          { x, y },
          currentPiece.type,
          currentPiece.team,
          pieces
        );

        const pawnDirection = currentPiece.team === TeamType.OUR ? 1 : -1;

        if (castling.legal) {
          chessboardHelper.castlingReduce(
            pieces,
            castling,
            tempKingPosX,
            tempKingPosY,
            grabPosition,
            x,
            y
          );
        } else if (isEnPassantMove) {

          const updatePieces: Piece[] = [];

          pieces.forEach((piece) => {
            if (samePosition(piece.position, grabPosition)) {
              piece.enPassant = false;
              piece.position.x = x;
              piece.position.y = y;
              updatePieces.push(Object.assign({}, piece));
            } else if (
              !samePosition(piece.position, { x, y: y - pawnDirection })
            ) {
              if (piece.type === PieceType.PAWN) {
                piece.enPassant = false;
              }
              updatePieces.push(Object.assign({}, piece));
            } else {
              let idx = pieces.indexOf(piece);
              if (idx !== -1) {
                pieces.splice(idx, 1);
              }
            }
          })

          setPieces(updatePieces);
          changeTurn = true;
        } else if (validMove) {
          //UPDATES THE PIECE POSITION
          //AND IF A PIECE IS ATTACKED, REMOVES IT

          const updatePieces: Piece[] = [];

          pieces.forEach((piece) => {
            if (samePosition(piece.position, grabPosition)) {
              // console.log('the piece', piece)
              //SPECIAL MOVE
              piece.enPassant =
                Math.abs(grabPosition.y - y) === 2 &&
                piece.type === PieceType.PAWN;

              piece.position.x = x;
              piece.position.y = y;

              if (
                piece.type === PieceType.ROOK ||
                piece.type === PieceType.KING
              ) {
                piece.hasMoved = true;
              }

              let promotionRow = piece.team === TeamType.OUR ? 7 : 0;

              if (y === promotionRow && piece.type === PieceType.PAWN) {
                modalRef.current?.classList.remove("hidden");
                setPromotionPawn(piece);
              }
              updatePieces.push(Object.assign({}, piece));
            } else if (!samePosition(piece.position, { x, y })) {
              if (piece.type === PieceType.PAWN) {
                piece.enPassant = false;
              }
              updatePieces.push(Object.assign({}, piece));
            } else {
              let idx = pieces.indexOf(piece);
              if (idx !== -1) {
                pieces.splice(idx, 1);
              }
            }
          });

          setPieces(updatePieces);
          changeTurn = true;
        } else {
          //RESETS THE PIECE POSITION
          activePiece.style.position = "relative";
          activePiece.style.removeProperty("top");
          activePiece.style.removeProperty("left");
        }
      }
      setActivePiece(null);
    }
    const stateOfGame = referee.isCheckmate(pieces, !turn);
    if (stateOfGame === "true") {
      console.log("checkmate!!!! ");
    } else if (stateOfGame === "stalemate") {
      console.log("stalemate");
    } else if (stateOfGame === "draw") {
      console.log("draw by unsuficient material");
    }
    setTurn(true);
    if (changeTurn) {
      setEngineToPlay(true);
      // engine.play(pieces)
      // setTimeout(() => {engine.play(pieces)}, 100)

      onDropObservable.subscribe(dropPiece);
    }

  }

  function promotePawn(pieceType: PieceType) {
    if (promotionPawn === undefined) {
      return;
    }

    const updatedPieces = pieces.reduce((results, piece) => {
      if (samePosition(piece.position, promotionPawn.position)) {
        piece.type = pieceType;
        const teamType = piece.team === TeamType.OUR ? "w" : "b";
        let image = "";
        switch (pieceType) {
          case PieceType.ROOK: {
            image = "rook";
            break;
          }
          case PieceType.BISHOP: {
            image = "bishop";
            break;
          }
          case PieceType.KNIGHT: {
            image = "knight";
            break;
          }
          case PieceType.QUEEN: {
            image = "queen";
            break;
          }
        }
        piece.image = `assets/images/${image}_${teamType}.png`;
      }
      results.push(piece);
      return results;
    }, [] as Piece[]);

    setPieces(updatedPieces);

    modalRef.current?.classList.add("hidden");
  }

  function promotionTeamType() {
    return promotionPawn?.team === TeamType.OUR ? "w" : "b";
  }

  let board = [];

  for (let j = VERTICAL_AXIS.length - 1; j >= 0; j--) {
    for (let i = 0; i < HORIZONTAL_AXIS.length; i++) {
      const number = j + i + 2;
      const piece = pieces.find((p) =>
        samePosition(p.position, { x: i, y: j })
      );
      let image = piece ? piece.image : undefined;

      board.push(<Tile key={`${j},${i}`} image={image} number={number} />);
    }
  }

  return (
    <>
      <div id="pawn-promotion-modal" className="hidden" ref={modalRef}>
        <div className="modal-body">
          <img
            onClick={() => promotePawn(PieceType.ROOK)}
            src={`/assets/images/rook_${promotionTeamType()}.png`}
          />
          <img
            onClick={() => promotePawn(PieceType.BISHOP)}
            src={`/assets/images/bishop_${promotionTeamType()}.png`}
          />
          <img
            onClick={() => promotePawn(PieceType.KNIGHT)}
            src={`/assets/images/knight_${promotionTeamType()}.png`}
          />
          <img
            onClick={() => promotePawn(PieceType.QUEEN)}
            src={`/assets/images/queen_${promotionTeamType()}.png`}
          />
        </div>
      </div>
      <div
        onMouseMove={(e) => movePiece(e)}
        onMouseDown={(e) => grabPiece(e)}
        onMouseUp={(e) => dropPiece(e)}
        id="chessboard"
        ref={chessboardRef}
      >
        {board}
      </div>
    </>
  );
}
