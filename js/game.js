import { Board } from './board.js';
import { MoveValidator } from './moveValidator.js';

export class Game {
    constructor() {
        this.board = new Board(this); // Передаем ссылку на игру
        this.moveValidator = new MoveValidator(this.board);
        this.currentPlayer = 'white';
        this.selectedSquare = null;
        this.validMoves = [];
        this.moveHistory = [];
        this.moveNumber = 1;
        this.capturedPieces = { white: [], black: [] };
        this.lastMove = null;
        this.promotionPending = null;
        this.boardStateSnapshot = null; // Для отката событий
        this.mines = []; // Массив с координатами мин
    }
    
    reset() {
        this.board.setupInitialPosition();
        this.currentPlayer = 'white';
        this.selectedSquare = null;
        this.validMoves = [];
        this.moveHistory = [];
        this.moveNumber = 1;
        this.capturedPieces = { white: [], black: [] };
        this.lastMove = null;
        this.promotionPending = null;
        this.boardStateSnapshot = null;
        this.mines = [];
    }
    
    handleSquareClick(row, col) {
        const result = { moveMade: false, promotion: null };
        
        // Если ожидается превращение пешки, игнорируем клики
        if (this.promotionPending) {
            return result;
        }
        
        const piece = this.board.getPiece(row, col);
        
        // Если выбрана фигура текущего игрока
        if (piece && piece.color === this.currentPlayer) {
            this.selectSquare(row, col);
        }
        // Если выбран валидный ход
        else if (this.selectedSquare && this.isValidMove(row, col)) {
            // Сохраняем состояние доски перед ходом для возможного отката событий
            this.saveBoardStateBeforeMove();
            
            const moveResult = this.makeMove(this.selectedSquare.row, this.selectedSquare.col, row, col);
            result.moveMade = true;
            result.mineExploded = moveResult.mineExploded;
            
            if (moveResult.promotion) {
                result.promotion = moveResult.promotion;
            }
        }
        // Сброс выбора
        else {
            this.selectedSquare = null;
            this.validMoves = [];
        }
        
        return result;
    }
    
    saveBoardStateBeforeMove() {
        // Сохраняем полное состояние всех фигур на доске
        this.boardStateSnapshot = [];
        for (let row = 0; row < 8; row++) {
            this.boardStateSnapshot[row] = [];
            for (let col = 0; col < 8; col++) {
                const piece = this.board.getPiece(row, col);
                if (piece) {
                    // Глубокое копирование фигуры со всеми свойствами
                    this.boardStateSnapshot[row][col] = {
                        type: piece.type,
                        color: piece.color,
                        hasMoved: piece.hasMoved,
                        originalType: piece.originalType,
                        invulnerable: piece.invulnerable
                    };
                } else {
                    this.boardStateSnapshot[row][col] = null;
                }
            }
        }
    }
    
    selectSquare(row, col) {
        this.selectedSquare = { row, col };
        this.validMoves = this.moveValidator.getValidMoves(row, col, this.currentPlayer);
    }
    
    isValidMove(row, col) {
        return this.validMoves.some(move => move.row === row && move.col === col);
    }
    
    makeMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.board.getPiece(fromRow, fromCol);
        const capturedPiece = this.board.getPiece(toRow, toCol);
        const result = { promotion: null };
        
        // Проверка: нельзя захватить неуязвимую фигуру
        if (capturedPiece && capturedPiece.invulnerable) {
            return result; // Отменяем ход
        }
        
        // Сохранение хода в историю
        const move = {
            from: { row: fromRow, col: fromCol },
            to: { row: toRow, col: toCol },
            piece: piece,
            captured: capturedPiece,
            castling: null,
            enPassant: null,
            promotion: null,
            boardStateBeforeMove: null, // Для отката событий
            mineExploded: false
        };
        
        // Обработка взятия на проходе
        if (piece.type === 'pawn' && Math.abs(fromCol - toCol) === 1 && !capturedPiece) {
            const enPassantRow = piece.color === 'white' ? toRow + 1 : toRow - 1;
            const enPassantPawn = this.board.getPiece(enPassantRow, toCol);
            if (enPassantPawn && enPassantPawn.type === 'pawn') {
                move.enPassant = { row: enPassantRow, col: toCol, piece: enPassantPawn };
                this.board.removePiece(enPassantRow, toCol);
                this.capturedPieces[enPassantPawn.color].push(enPassantPawn.type);
            }
        }
        
        // Обработка рокировки
        if (piece.type === 'king' && Math.abs(fromCol - toCol) === 2) {
            const rookCol = toCol > fromCol ? 7 : 0;
            const newRookCol = toCol > fromCol ? toCol - 1 : toCol + 1;
            const rook = this.board.getPiece(fromRow, rookCol);
            
            this.board.movePiece(fromRow, rookCol, fromRow, newRookCol);
            rook.hasMoved = true;
            
            move.castling = {
                rookFrom: { row: fromRow, col: rookCol },
                rookTo: { row: fromRow, col: newRookCol }
            };
        }
        
        // Захват фигуры
        if (capturedPiece) {
            this.capturedPieces[capturedPiece.color].push(capturedPiece.type);
        }
        
        // Перемещение фигуры
        this.board.movePiece(fromRow, fromCol, toRow, toCol);
        piece.hasMoved = true;
        
        // Проверка на мину
        const mineIndex = this.mines.findIndex(mine => mine.row === toRow && mine.col === toCol);
        if (mineIndex !== -1) {
            // Фигура наступила на мину - взрыв!
            this.board.removePiece(toRow, toCol);
            this.capturedPieces[piece.color].push(piece.type);
            this.mines.splice(mineIndex, 1); // Удаляем мину
            move.mineExploded = true;
            result.mineExploded = true;
        }
        
        // Обработка превращения пешки (только если не взорвалась)
        if (!move.mineExploded && piece.type === 'pawn' && (toRow === 0 || toRow === 7)) {
            this.promotionPending = { row: toRow, col: toCol, color: piece.color };
            move.promotion = { row: toRow, col: toCol, color: piece.color };
            result.promotion = move.promotion;
        }
        
        this.moveHistory.push(move);
        this.lastMove = { from: { row: fromRow, col: fromCol }, to: { row: toRow, col: toCol } };
        
        // Сохраняем снимок состояния доски в ход
        if (this.boardStateSnapshot) {
            move.boardStateBeforeMove = this.boardStateSnapshot;
            this.boardStateSnapshot = null;
        }
        
        // Смена игрока только если нет ожидающего превращения
        if (!this.promotionPending) {
            this.switchPlayer();
        }
        
        this.selectedSquare = null;
        this.validMoves = [];
        
        return result;
    }
    
    promotePawn(pieceType) {
        if (!this.promotionPending) return;
        
        const { row, col, color } = this.promotionPending;
        this.board.setPiece(row, col, { type: pieceType, color: color, hasMoved: true });
        
        // Обновление истории ходов
        const lastMove = this.moveHistory[this.moveHistory.length - 1];
        if (lastMove) {
            lastMove.promotedTo = pieceType;
        }
        
        this.promotionPending = null;
        this.switchPlayer();
    }
    
    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
        if (this.currentPlayer === 'white') {
            this.moveNumber++;
        }
    }
    
    undoMove() {
        if (this.moveHistory.length === 0) return false;
        if (this.promotionPending) return false;
        
        const move = this.moveHistory.pop();
        
        // Если есть сохраненное состояние доски, восстанавливаем его (откат событий)
        if (move.boardStateBeforeMove) {
            for (let row = 0; row < 8; row++) {
                for (let col = 0; col < 8; col++) {
                    const savedPiece = move.boardStateBeforeMove[row][col];
                    if (savedPiece) {
                        this.board.setPiece(row, col, {
                            type: savedPiece.type,
                            color: savedPiece.color,
                            hasMoved: savedPiece.hasMoved,
                            originalType: savedPiece.originalType,
                            invulnerable: savedPiece.invulnerable
                        });
                    } else {
                        this.board.removePiece(row, col);
                    }
                }
            }
            
            // Восстановление мины, если она была взорвана
            if (move.mineExploded) {
                this.mines.push({ row: move.to.row, col: move.to.col });
                // Восстанавливаем взорванную фигуру из захваченных
                const capturedArray = this.capturedPieces[move.piece.color];
                const index = capturedArray.lastIndexOf(move.piece.type);
                if (index > -1) {
                    capturedArray.splice(index, 1);
                }
            }
        } else {
            // Стандартная логика отката без событий
            // Восстановление фигуры
            this.board.movePiece(move.to.row, move.to.col, move.from.row, move.from.col);
            const piece = this.board.getPiece(move.from.row, move.from.col);
            
            // Восстановление статуса hasMoved
            if (this.moveHistory.filter(m => 
                m.from.row === move.from.row && m.from.col === move.from.col
            ).length === 0) {
                piece.hasMoved = false;
            }
            
            // Восстановление превращения
            if (move.promotedTo) {
                piece.type = 'pawn';
            }
            
            // Восстановление захваченной фигуры
            if (move.captured) {
                this.board.setPiece(move.to.row, move.to.col, move.captured);
                const capturedArray = this.capturedPieces[move.captured.color];
                const index = capturedArray.lastIndexOf(move.captured.type);
                if (index > -1) {
                    capturedArray.splice(index, 1);
                }
            }
            
            // Восстановление взятия на проходе
            if (move.enPassant) {
                this.board.setPiece(move.enPassant.row, move.enPassant.col, move.enPassant.piece);
                const capturedArray = this.capturedPieces[move.enPassant.piece.color];
                const index = capturedArray.lastIndexOf('pawn');
                if (index > -1) {
                    capturedArray.splice(index, 1);
                }
            }
            
            // Восстановление рокировки
            if (move.castling) {
                const rook = this.board.getPiece(move.castling.rookTo.row, move.castling.rookTo.col);
                this.board.movePiece(
                    move.castling.rookTo.row, move.castling.rookTo.col,
                    move.castling.rookFrom.row, move.castling.rookFrom.col
                );
                
                if (this.moveHistory.filter(m => 
                    m.from.row === move.castling.rookFrom.row && 
                    m.from.col === move.castling.rookFrom.col
                ).length === 0) {
                    rook.hasMoved = false;
                }
            }
        }
        
        // Восстановление последнего хода
        if (this.moveHistory.length > 0) {
            const prevMove = this.moveHistory[this.moveHistory.length - 1];
            this.lastMove = { from: prevMove.from, to: prevMove.to };
        } else {
            this.lastMove = null;
        }
        
        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
        if (this.currentPlayer === 'black') {
            this.moveNumber--;
        }
        
        return true;
    }
    
    isCheckmate() {
        return this.moveValidator.isCheckmate(this.currentPlayer);
    }
    
    isStalemate() {
        return this.moveValidator.isStalemate(this.currentPlayer);
    }
    
    isInCheck(color) {
        return this.moveValidator.isInCheck(color);
    }
}
