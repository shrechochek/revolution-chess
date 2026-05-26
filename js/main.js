import { Game } from './game.js';
import { BoardRenderer } from './boardRenderer.js';
import { EventManager } from './eventManager.js';

class ChessApp {
    constructor() {
        this.game = new Game();
        this.renderer = new BoardRenderer(this.game);
        this.eventManager = new EventManager(this.game);
        
        this.init();
    }
    
    init() {
        this.renderer.render();
        this.setupEventListeners();
        this.updateUI();
        this.eventManager.updateModifiersDisplay(); // Инициализация отображения модификаторов
    }
    
    setupEventListeners() {
        // Клики по доске
        document.getElementById('chess-board').addEventListener('click', (e) => {
            const square = e.target.closest('.square');
            if (square) {
                const row = parseInt(square.dataset.row);
                const col = parseInt(square.dataset.col);
                this.handleSquareClick(row, col);
            }
        });
        
        // Кнопка новой игры
        document.getElementById('new-game-btn').addEventListener('click', () => {
            if (confirm('Начать новую игру?')) {
                this.game.reset();
                this.eventManager.clearAllEvents();
                this.renderer.render();
                this.updateUI();
            }
        });
        
        // Кнопка отмены хода
        document.getElementById('undo-btn').addEventListener('click', () => {
            if (this.game.undoMove()) {
                // Проверяем, нужно ли откатить событие
                this.eventManager.checkEventRollback(this.game.moveNumber);
                this.renderer.render();
                this.updateUI();
            }
        });
    }
    
    handleSquareClick(row, col) {
        const result = this.game.handleSquareClick(row, col);
        
        if (result.promotion) {
            this.showPromotionModal(result.promotion);
        }
        
        // Показываем уведомление о взрыве мины
        if (result.mineExploded) {
            this.showExplosionEffect(row, col);
            const notification = document.getElementById('event-notification');
            notification.textContent = '💥 БУМ! Фигура подорвалась на мине!';
            notification.classList.add('active');
            setTimeout(() => {
                notification.classList.remove('active');
            }, 2000);
        }
        
        this.renderer.render();
        this.updateUI();
        
        // Проверка событий каждые N ходов
        if (result.moveMade) {
            this.eventManager.checkForEvent();
        }
    }
    
    showPromotionModal(promotionData) {
        const modal = document.getElementById('promotion-modal');
        const choices = document.getElementById('promotion-choices');
        choices.innerHTML = '';
        
        const pieces = ['queen', 'rook', 'bishop', 'knight'];
        const color = promotionData.color;
        
        pieces.forEach(piece => {
            const choice = document.createElement('div');
            choice.className = 'promotion-choice';
            choice.style.backgroundImage = `url('images/figures/${color}_${piece}.svg')`;
            choice.addEventListener('click', () => {
                this.game.promotePawn(piece);
                modal.classList.remove('active');
                this.renderer.render();
                this.updateUI();
            });
            choices.appendChild(choice);
        });
        
        modal.classList.add('active');
    }
    
    updateUI() {
        // Обновление индикатора хода
        const turnText = this.game.currentPlayer === 'white' ? 'Ход белых' : 'Ход черных';
        document.getElementById('current-turn').textContent = turnText;
        
        // Обновление номера хода
        document.getElementById('move-number').textContent = this.game.moveNumber;
        
        // Обновление захваченных фигур
        this.updateCapturedPieces();
        
        // Проверка мата/пата
        if (this.game.isCheckmate()) {
            const winner = this.game.currentPlayer === 'white' ? 'Черные' : 'Белые';
            setTimeout(() => alert(`Мат! ${winner} победили!`), 100);
        } else if (this.game.isStalemate()) {
            setTimeout(() => alert('Пат! Ничья!'), 100);
        }
    }
    
    updateCapturedPieces() {
        const whiteContainer = document.getElementById('captured-white');
        const blackContainer = document.getElementById('captured-black');
        
        whiteContainer.innerHTML = '';
        blackContainer.innerHTML = '';
        
        this.game.capturedPieces.white.forEach(piece => {
            const pieceEl = document.createElement('div');
            pieceEl.className = 'captured-piece';
            pieceEl.style.backgroundImage = `url('images/figures/white_${piece}.svg')`;
            whiteContainer.appendChild(pieceEl);
        });
        
        this.game.capturedPieces.black.forEach(piece => {
            const pieceEl = document.createElement('div');
            pieceEl.className = 'captured-piece';
            pieceEl.style.backgroundImage = `url('images/figures/black_${piece}.svg')`;
            blackContainer.appendChild(pieceEl);
        });
    }
    
    showExplosionEffect(row, col) {
        const boardElement = document.getElementById('chess-board');
        const squares = boardElement.querySelectorAll('.square');
        const squareIndex = row * 8 + col;
        const targetSquare = squares[squareIndex];
        
        if (!targetSquare) return;
        
        // Создаем эффект взрыва
        const explosion = document.createElement('div');
        explosion.className = 'explosion-effect';
        explosion.textContent = '💥';
        
        const rect = targetSquare.getBoundingClientRect();
        explosion.style.left = rect.left + rect.width / 2 + 'px';
        explosion.style.top = rect.top + rect.height / 2 + 'px';
        
        document.body.appendChild(explosion);
        
        // Удаляем эффект через 1 секунду
        setTimeout(() => {
            explosion.remove();
        }, 1000);
    }
}

// Запуск приложения
document.addEventListener('DOMContentLoaded', () => {
    new ChessApp();
});
