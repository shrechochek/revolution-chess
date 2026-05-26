export class Board {
    constructor(game = null) {
        this.grid = Array(8).fill(null).map(() => Array(8).fill(null));
        this.game = game; // Ссылка на игру для доступа к истории ходов
        this.setupInitialPosition();
    }
    
    setupInitialPosition() {
        // Очистка доски
        this.grid = Array(8).fill(null).map(() => Array(8).fill(null));
        
        // Черные фигуры
        this.grid[0][0] = { type: 'rook', color: 'black', hasMoved: false };
        this.grid[0][1] = { type: 'knight', color: 'black', hasMoved: false };
        this.grid[0][2] = { type: 'bishop', color: 'black', hasMoved: false };
        this.grid[0][3] = { type: 'queen', color: 'black', hasMoved: false };
        this.grid[0][4] = { type: 'king', color: 'black', hasMoved: false };
        this.grid[0][5] = { type: 'bishop', color: 'black', hasMoved: false };
        this.grid[0][6] = { type: 'knight', color: 'black', hasMoved: false };
        this.grid[0][7] = { type: 'rook', color: 'black', hasMoved: false };
        
        // Черные пешки
        for (let col = 0; col < 8; col++) {
            this.grid[1][col] = { type: 'pawn', color: 'black', hasMoved: false };
        }
        
        // Белые пешки
        for (let col = 0; col < 8; col++) {
            this.grid[6][col] = { type: 'pawn', color: 'white', hasMoved: false };
        }
        
        // Белые фигуры
        this.grid[7][0] = { type: 'rook', color: 'white', hasMoved: false };
        this.grid[7][1] = { type: 'knight', color: 'white', hasMoved: false };
        this.grid[7][2] = { type: 'bishop', color: 'white', hasMoved: false };
        this.grid[7][3] = { type: 'queen', color: 'white', hasMoved: false };
        this.grid[7][4] = { type: 'king', color: 'white', hasMoved: false };
        this.grid[7][5] = { type: 'bishop', color: 'white', hasMoved: false };
        this.grid[7][6] = { type: 'knight', color: 'white', hasMoved: false };
        this.grid[7][7] = { type: 'rook', color: 'white', hasMoved: false };
    }
    
    getPiece(row, col) {
        if (row < 0 || row >= 8 || col < 0 || col >= 8) return null;
        return this.grid[row][col];
    }
    
    setPiece(row, col, piece) {
        if (row < 0 || row >= 8 || col < 0 || col >= 8) return;
        this.grid[row][col] = piece;
    }
    
    removePiece(row, col) {
        if (row < 0 || row >= 8 || col < 0 || col >= 8) return;
        this.grid[row][col] = null;
    }
    
    movePiece(fromRow, fromCol, toRow, toCol) {
        const piece = this.getPiece(fromRow, fromCol);
        if (!piece) return false;
        
        this.setPiece(toRow, toCol, piece);
        this.removePiece(fromRow, fromCol);
        return true;
    }
    
    isSquareEmpty(row, col) {
        return this.getPiece(row, col) === null;
    }
    
    isSquareOccupiedByColor(row, col, color) {
        const piece = this.getPiece(row, col);
        return piece !== null && piece.color === color;
    }
    
    findKing(color) {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.getPiece(row, col);
                if (piece && piece.type === 'king' && piece.color === color) {
                    return { row, col };
                }
            }
        }
        return null;
    }
    
    clone() {
        const newBoard = new Board(this.game);
        newBoard.grid = this.grid.map(row => 
            row.map(piece => piece ? { ...piece } : null)
        );
        return newBoard;
    }
}
