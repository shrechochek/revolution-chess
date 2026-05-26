export class BoardRenderer {
    constructor(game) {
        this.game = game;
        this.boardElement = document.getElementById('chess-board');
    }
    
    render() {
        this.boardElement.innerHTML = '';
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = this.createSquare(row, col);
                this.boardElement.appendChild(square);
            }
        }
    }
    
    createSquare(row, col) {
        const square = document.createElement('div');
        square.className = 'square';
        square.dataset.row = row;
        square.dataset.col = col;
        
        // Цвет клетки
        const isLight = (row + col) % 2 === 0;
        square.classList.add(isLight ? 'light' : 'dark');
        
        // Подсветка выбранной клетки
        if (this.game.selectedSquare && 
            this.game.selectedSquare.row === row && 
            this.game.selectedSquare.col === col) {
            square.classList.add('selected');
        }
        
        // Подсветка валидных ходов
        if (this.game.validMoves.some(move => move.row === row && move.col === col)) {
            const piece = this.game.board.getPiece(row, col);
            if (piece && !piece.invulnerable) {
                // Подсвечиваем клетку красным для возможного взятия
                square.classList.add('valid-capture');
            } else if (!piece) {
                // Обычная подсветка для пустых клеток
                square.classList.add('valid-move');
            }
            // Неуязвимые фигуры не подсвечиваются
        }
        
        // Подсветка последнего хода
        if (this.game.lastMove) {
            if ((this.game.lastMove.from.row === row && this.game.lastMove.from.col === col) ||
                (this.game.lastMove.to.row === row && this.game.lastMove.to.col === col)) {
                square.classList.add('last-move');
            }
        }
        
        // Подсветка шаха
        const piece = this.game.board.getPiece(row, col);
        if (piece && piece.type === 'king' && this.game.isInCheck(piece.color)) {
            square.classList.add('in-check');
        }
        
        // Мины НЕ отображаются (скрыты от игроков)
        
        // Добавление фигуры
        if (piece) {
            const pieceElement = this.createPiece(piece);
            square.appendChild(pieceElement);
        }
        
        // Добавление координат
        if (col === 0) {
            const rankLabel = document.createElement('span');
            rankLabel.className = 'square-label rank';
            rankLabel.textContent = 8 - row;
            square.appendChild(rankLabel);
        }
        
        if (row === 7) {
            const fileLabel = document.createElement('span');
            fileLabel.className = 'square-label file';
            fileLabel.textContent = String.fromCharCode(97 + col);
            square.appendChild(fileLabel);
        }
        
        return square;
    }
    
    createPiece(piece) {
        const pieceElement = document.createElement('div');
        pieceElement.className = 'piece';
        
        // Специальная обработка для новых типов фигур
        let imageName = piece.type;
        if (piece.type === 'endless_knight') {
            imageName = 'endless_knight';
        } else if (piece.type === 'camel_knight') {
            imageName = 'camel_knight';
        } else if (piece.type === 'statue' || piece.type === 'statue_immobile') {
            imageName = 'statue';
        }
        
        pieceElement.style.backgroundImage = `url('images/figures/${piece.color}_${imageName}.svg')`;
        
        return pieceElement;
    }
}
