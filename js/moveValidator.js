export class MoveValidator {
    constructor(board) {
        this.board = board;
    }
    
    getValidMoves(row, col, currentPlayer) {
        const piece = this.board.getPiece(row, col);
        if (!piece || piece.color !== currentPlayer) return [];
        
        let moves = [];
        
        switch (piece.type) {
            case 'pawn':
                moves = this.getPawnMoves(row, col, piece.color);
                break;
            case 'rook':
                moves = this.getRookMoves(row, col, piece.color);
                break;
            case 'knight':
                moves = this.getKnightMoves(row, col, piece.color);
                break;
            case 'bishop':
                moves = this.getBishopMoves(row, col, piece.color);
                break;
            case 'queen':
                moves = this.getQueenMoves(row, col, piece.color);
                break;
            case 'king':
                moves = this.getKingMoves(row, col, piece.color);
                break;
            case 'camel':
                moves = this.getCamelMoves(row, col, piece.color);
                break;
            case 'endless_knight':
                moves = this.getEndlessKnightMoves(row, col, piece.color);
                break;
            case 'camel_knight':
                moves = this.getCamelKnightMoves(row, col, piece.color);
                break;
            case 'statue':
                moves = this.getStatueMoves(row, col, piece.color);
                break;
            case 'statue_immobile':
                moves = []; // Неподвижная статуя не может двигаться
                break;
        }
        
        // Фильтрация ходов, которые оставляют короля под шахом
        return moves.filter(move => !this.wouldBeInCheck(row, col, move.row, move.col, piece.color));
    }
    
    getPawnMoves(row, col, color) {
        const moves = [];
        const direction = color === 'white' ? -1 : 1;
        const startRow = color === 'white' ? 6 : 1;
        
        // Движение вперед на одну клетку
        if (this.board.isSquareEmpty(row + direction, col)) {
            moves.push({ row: row + direction, col, isCapture: false });
            
            // Движение вперед на две клетки с начальной позиции
            if (row === startRow && this.board.isSquareEmpty(row + 2 * direction, col)) {
                moves.push({ row: row + 2 * direction, col, isCapture: false });
            }
        }
        
        // Взятие по диагонали
        for (const dcol of [-1, 1]) {
            const newRow = row + direction;
            const newCol = col + dcol;
            const targetPiece = this.board.getPiece(newRow, newCol);
            
            if (targetPiece && targetPiece.color !== color) {
                moves.push({ row: newRow, col: newCol, isCapture: true });
            }
            
            // Взятие на проходе
            if (this.canEnPassant(row, col, newCol, color)) {
                moves.push({ row: newRow, col: newCol, isCapture: true, isEnPassant: true });
            }
        }
        
        return moves;
    }
    
    canEnPassant(row, col, targetCol, color) {
        const enemyColor = color === 'white' ? 'black' : 'white';
        const enemyPawnRow = color === 'white' ? 3 : 4;
        
        if (row !== enemyPawnRow) return false;
        
        const enemyPawn = this.board.getPiece(row, targetCol);
        if (!enemyPawn || enemyPawn.type !== 'pawn' || enemyPawn.color !== enemyColor) {
            return false;
        }
        
        // Проверка, что последний ход был двойным ходом этой пешки
        // Получаем историю ходов из игры
        const game = this.board.game;
        if (!game || !game.moveHistory || game.moveHistory.length === 0) {
            return false;
        }
        
        const lastMove = game.moveHistory[game.moveHistory.length - 1];
        
        // Проверяем, что последний ход был ходом пешки на 2 клетки
        if (lastMove.piece.type !== 'pawn') return false;
        if (lastMove.to.col !== targetCol) return false;
        if (Math.abs(lastMove.from.row - lastMove.to.row) !== 2) return false;
        
        return true;
    }
    
    getRookMoves(row, col, color) {
        return this.getLinearMoves(row, col, color, [
            [-1, 0], [1, 0], [0, -1], [0, 1]
        ]);
    }
    
    getBishopMoves(row, col, color) {
        return this.getLinearMoves(row, col, color, [
            [-1, -1], [-1, 1], [1, -1], [1, 1]
        ]);
    }
    
    getQueenMoves(row, col, color) {
        return this.getLinearMoves(row, col, color, [
            [-1, 0], [1, 0], [0, -1], [0, 1],
            [-1, -1], [-1, 1], [1, -1], [1, 1]
        ]);
    }
    
    getLinearMoves(row, col, color, directions) {
        const moves = [];
        
        for (const [drow, dcol] of directions) {
            let newRow = row + drow;
            let newCol = col + dcol;
            
            while (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                const targetPiece = this.board.getPiece(newRow, newCol);
                
                if (!targetPiece) {
                    moves.push({ row: newRow, col: newCol, isCapture: false });
                } else {
                    if (targetPiece.color !== color) {
                        moves.push({ row: newRow, col: newCol, isCapture: true });
                    }
                    break;
                }
                
                newRow += drow;
                newCol += dcol;
            }
        }
        
        return moves;
    }
    
    getKnightMoves(row, col, color) {
        const moves = [];
        const knightMoves = [
            [-2, -1], [-2, 1], [-1, -2], [-1, 2],
            [1, -2], [1, 2], [2, -1], [2, 1]
        ];
        
        for (const [drow, dcol] of knightMoves) {
            const newRow = row + drow;
            const newCol = col + dcol;
            
            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                const targetPiece = this.board.getPiece(newRow, newCol);
                if (!targetPiece) {
                    moves.push({ row: newRow, col: newCol, isCapture: false });
                } else if (targetPiece.color !== color) {
                    moves.push({ row: newRow, col: newCol, isCapture: true });
                }
            }
        }
        
        return moves;
    }
    
    getKingMoves(row, col, color) {
        const moves = [];
        const kingMoves = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1], [0, 1],
            [1, -1], [1, 0], [1, 1]
        ];
        
        for (const [drow, dcol] of kingMoves) {
            const newRow = row + drow;
            const newCol = col + dcol;
            
            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                const targetPiece = this.board.getPiece(newRow, newCol);
                if (!targetPiece) {
                    moves.push({ row: newRow, col: newCol, isCapture: false });
                } else if (targetPiece.color !== color) {
                    moves.push({ row: newRow, col: newCol, isCapture: true });
                }
            }
        }
        
        // Рокировка
        const castlingMoves = this.getCastlingMoves(row, col, color);
        moves.push(...castlingMoves);
        
        return moves;
    }
    
    getCastlingMoves(row, col, color) {
        const moves = [];
        const king = this.board.getPiece(row, col);
        
        if (king.hasMoved || this.isInCheck(color)) {
            return moves;
        }
        
        // Короткая рокировка
        const kingsideRook = this.board.getPiece(row, 7);
        if (kingsideRook && kingsideRook.type === 'rook' && !kingsideRook.hasMoved) {
            if (this.board.isSquareEmpty(row, 5) && this.board.isSquareEmpty(row, 6)) {
                if (!this.isSquareUnderAttack(row, 5, color) && !this.isSquareUnderAttack(row, 6, color)) {
                    moves.push({ row, col: 6, isCapture: false });
                }
            }
        }
        
        // Длинная рокировка
        const queensideRook = this.board.getPiece(row, 0);
        if (queensideRook && queensideRook.type === 'rook' && !queensideRook.hasMoved) {
            if (this.board.isSquareEmpty(row, 1) && this.board.isSquareEmpty(row, 2) && this.board.isSquareEmpty(row, 3)) {
                if (!this.isSquareUnderAttack(row, 2, color) && !this.isSquareUnderAttack(row, 3, color)) {
                    moves.push({ row, col: 2, isCapture: false });
                }
            }
        }
        
        return moves;
    }
    
    wouldBeInCheck(fromRow, fromCol, toRow, toCol, color) {
        // Создаем копию доски и делаем ход
        const boardCopy = this.board.clone();
        const piece = boardCopy.getPiece(fromRow, fromCol);
        boardCopy.movePiece(fromRow, fromCol, toRow, toCol);
        
        // Проверяем, находится ли король под шахом
        const validator = new MoveValidator(boardCopy);
        return validator.isInCheck(color);
    }
    
    isInCheck(color) {
        const kingPos = this.board.findKing(color);
        if (!kingPos) return false;
        
        return this.isSquareUnderAttack(kingPos.row, kingPos.col, color);
    }
    
    isSquareUnderAttack(row, col, defenderColor) {
        const attackerColor = defenderColor === 'white' ? 'black' : 'white';
        
        // Проверка атак от всех фигур противника
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this.board.getPiece(r, c);
                if (piece && piece.color === attackerColor) {
                    const attacks = this.getPieceAttacks(r, c, piece);
                    if (attacks.some(attack => attack.row === row && attack.col === col)) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }
    
    getPieceAttacks(row, col, piece) {
        // Получаем все клетки, которые атакует фигура (без проверки на шах)
        switch (piece.type) {
            case 'pawn':
                return this.getPawnAttacks(row, col, piece.color);
            case 'knight':
                return this.getKnightMoves(row, col, piece.color);
            case 'bishop':
                return this.getBishopMoves(row, col, piece.color);
            case 'rook':
                return this.getRookMoves(row, col, piece.color);
            case 'queen':
                return this.getQueenMoves(row, col, piece.color);
            case 'king':
                return this.getKingAttacks(row, col, piece.color);
            case 'camel':
                return this.getCamelMoves(row, col, piece.color);
            case 'endless_knight':
                return this.getEndlessKnightMoves(row, col, piece.color);
            case 'camel_knight':
                return this.getCamelKnightMoves(row, col, piece.color);
            case 'statue':
                return []; // Статуя не атакует (неуязвима и не может есть)
            case 'statue_immobile':
                return []; // Неподвижная статуя не атакует
            default:
                return [];
        }
    }
    
    getPawnAttacks(row, col, color) {
        const attacks = [];
        const direction = color === 'white' ? -1 : 1;
        
        for (const dcol of [-1, 1]) {
            const newRow = row + direction;
            const newCol = col + dcol;
            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                attacks.push({ row: newRow, col: newCol });
            }
        }
        
        return attacks;
    }
    
    getKingAttacks(row, col, color) {
        const attacks = [];
        const kingMoves = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1], [0, 1],
            [1, -1], [1, 0], [1, 1]
        ];
        
        for (const [drow, dcol] of kingMoves) {
            const newRow = row + drow;
            const newCol = col + dcol;
            
            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                attacks.push({ row: newRow, col: newCol });
            }
        }
        
        return attacks;
    }
    
    isCheckmate(color) {
        if (!this.isInCheck(color)) return false;
        return this.hasNoLegalMoves(color);
    }
    
    isStalemate(color) {
        if (this.isInCheck(color)) return false;
        return this.hasNoLegalMoves(color);
    }
    
    hasNoLegalMoves(color) {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board.getPiece(row, col);
                if (piece && piece.color === color) {
                    const moves = this.getValidMoves(row, col, color);
                    if (moves.length > 0) {
                        return false;
                    }
                }
            }
        }
        return true;
    }
    
    // Верблюд - ходит на 3 клетки в одном направлении и 1 в перпендикулярном
    getCamelMoves(row, col, color) {
        const moves = [];
        const camelMoves = [
            [-3, -1], [-3, 1], [-1, -3], [-1, 3],
            [1, -3], [1, 3], [3, -1], [3, 1]
        ];
        
        for (const [drow, dcol] of camelMoves) {
            const newRow = row + drow;
            const newCol = col + dcol;
            
            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                const targetPiece = this.board.getPiece(newRow, newCol);
                if (!targetPiece) {
                    moves.push({ row: newRow, col: newCol, isCapture: false });
                } else if (targetPiece.color !== color) {
                    moves.push({ row: newRow, col: newCol, isCapture: true });
                }
            }
        }
        
        return moves;
    }
    
    // Бесконечный конь - ходит как конь, но может повторять ход в том же направлении
    getEndlessKnightMoves(row, col, color) {
        const moves = [];
        const knightMoves = [
            [-2, -1], [-2, 1], [-1, -2], [-1, 2],
            [1, -2], [1, 2], [2, -1], [2, 1]
        ];
        
        for (const [drow, dcol] of knightMoves) {
            let newRow = row + drow;
            let newCol = col + dcol;
            
            // Продолжаем двигаться в том же направлении, пока можем
            while (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                const targetPiece = this.board.getPiece(newRow, newCol);
                
                if (!targetPiece) {
                    moves.push({ row: newRow, col: newCol, isCapture: false });
                } else {
                    if (targetPiece.color !== color) {
                        moves.push({ row: newRow, col: newCol, isCapture: true });
                    }
                    break; // Останавливаемся при встрече с фигурой
                }
                
                newRow += drow;
                newCol += dcol;
            }
        }
        
        return moves;
    }
    
    // Буйвол (Camel Knight) - ходит как конь И как верблюд
    getCamelKnightMoves(row, col, color) {
        const moves = [];
        
        // Ходы коня
        const knightMoves = [
            [-2, -1], [-2, 1], [-1, -2], [-1, 2],
            [1, -2], [1, 2], [2, -1], [2, 1]
        ];
        
        // Ходы верблюда
        const camelMoves = [
            [-3, -1], [-3, 1], [-1, -3], [-1, 3],
            [1, -3], [1, 3], [3, -1], [3, 1]
        ];
        
        // Объединяем все возможные ходы
        const allMoves = [...knightMoves, ...camelMoves];
        
        for (const [drow, dcol] of allMoves) {
            const newRow = row + drow;
            const newCol = col + dcol;
            
            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                const targetPiece = this.board.getPiece(newRow, newCol);
                if (!targetPiece) {
                    moves.push({ row: newRow, col: newCol, isCapture: false });
                } else if (targetPiece.color !== color) {
                    moves.push({ row: newRow, col: newCol, isCapture: true });
                }
            }
        }
        
        return moves;
    }
    
    // Статуя - может ходить на любую клетку, но не может есть
    getStatueMoves(row, col, color) {
        const moves = [];
        
        // Статуя может ходить на любую пустую клетку на доске
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                // Пропускаем текущую позицию
                if (r === row && c === col) continue;
                
                const targetPiece = this.board.getPiece(r, c);
                // Может ходить только на пустые клетки (не может есть)
                if (!targetPiece) {
                    moves.push({ row: r, col: c, isCapture: false });
                }
            }
        }
        
        return moves;
    }
}
