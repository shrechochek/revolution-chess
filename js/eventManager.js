import { BoardRenderer } from './boardRenderer.js';

export class EventManager {
    constructor(game) {
        this.game = game;
        this.eventInterval = 3; // Событие каждые N ходов
        this.events = []; // Массив для будущих событий
        this.activeEvent = null;
        this.activeEvents = []; // Активные события
        this.renderer = null; // Ссылка на рендерер для обновления доски
        
        // РЕЖИМ ОТЛАДКИ: добавьте ID событий, которые НЕ должны происходить
        // Пример: this.debugBlacklist = ['global_warming', 'ice_age'];
        // Для тестирования конкретного события оставьте только его
        this.debugBlacklist = []; // Пустой массив = все события доступны
        
        // Определение событий с их блэклистами
        this.eventDefinitions = [
            {
                id: 'global_warming',
                name: 'Глобальное потепление',
                handler: this.globalWarming.bind(this),
                blacklist: ['ice_age'] // Не может быть одновременно с ледниковым периодом
            },
            {
                id: 'ice_age',
                name: 'Ледниковый период',
                handler: this.iceAge.bind(this),
                blacklist: ['global_warming'] // Не может быть одновременно с глобальным потеплением
            },
            {
                id: 'minefield',
                name: 'Минное поле',
                handler: this.minefield.bind(this),
                blacklist: [] // Может быть с любыми другими событиями
            },
            {
                id: 'airborne',
                name: 'Десант',
                handler: this.airborne.bind(this),
                blacklist: [] // Может быть с любыми другими событиями
            }
        ];
        
        // Логирование доступных событий в консоль
        console.log('🎲 Revolution Chess - Доступные события:');
        this.eventDefinitions.forEach(event => {
            const isBlocked = this.debugBlacklist.includes(event.id);
            console.log(`  ${isBlocked ? '❌' : '✅'} ${event.id} - ${event.name}`);
        });
        if (this.debugBlacklist.length > 0) {
            console.log('⚠️ РЕЖИМ ОТЛАДКИ: Заблокированы события:', this.debugBlacklist);
        }
    }
    
    checkForEvent() {
        // Проверяем, нужно ли запустить событие
        if (this.game.moveNumber % this.eventInterval === 0 && this.game.currentPlayer === 'white') {
            this.triggerRandomEvent();
        }
    }
    
    checkEventRollback(currentMoveNumber) {
        // Проверяем, нужно ли откатить последнее событие
        // Событие срабатывает на ходах 10, 20, 30 и т.д.
        // Если мы откатились до хода, который был до события, удаляем событие
        const lastEventMove = Math.floor(currentMoveNumber / this.eventInterval) * this.eventInterval;
        const nextEventMove = lastEventMove + this.eventInterval;
        
        // Если текущий ход меньше следующего события, откатываем последнее событие
        if (this.activeEvents.length > 0 && currentMoveNumber < nextEventMove) {
            const eventsToKeep = Math.floor(currentMoveNumber / this.eventInterval);
            if (this.activeEvents.length > eventsToKeep) {
                this.activeEvents = this.activeEvents.slice(0, eventsToKeep);
                this.updateModifiersDisplay();
            }
        }
    }
    
    triggerRandomEvent() {
        // Получаем ID активных событий
        const activeEventIds = this.activeEvents.map(e => e.id);
        
        // Фильтруем события, которые могут быть активированы
        const availableEvents = this.eventDefinitions.filter(eventDef => {
            // Проверяем отладочный блэклист
            if (this.debugBlacklist.includes(eventDef.id)) {
                return false;
            }
            
            // Проверяем, не конфликтует ли событие с активными
            return !eventDef.blacklist.some(blacklistedId => activeEventIds.includes(blacklistedId));
        });
        
        if (availableEvents.length === 0) {
            this.showEventNotification('⚠️ Нет доступных событий из-за конфликтов');
            console.log('⚠️ Нет доступных событий. Активные:', activeEventIds, 'Заблокированы:', this.debugBlacklist);
            return;
        }
        
        // Выбираем случайное событие
        const randomEvent = availableEvents[Math.floor(Math.random() * availableEvents.length)];
        console.log('🎲 Активировано событие:', randomEvent.id, '-', randomEvent.name);
        randomEvent.handler();
        BoardRenderer.render();
    }
    
    globalWarming() {
        this.showEventNotification('🌡️ ГЛОБАЛЬНОЕ ПОТЕПЛЕНИЕ! Кони → Верблюды, Слоны → Зебры, Ладьи → Статуи');
        
        // Превращаем фигуры на всей доске
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.game.board.getPiece(row, col);
                if (piece) {
                    if (piece.type === 'knight') {
                        // Конь → Верблюд (ходит 3+1)
                        piece.type = 'camel';
                        piece.originalType = 'knight';
                    } else if (piece.type === 'bishop') {
                        // Слон → Зебра (бесконечный конь)
                        piece.type = 'endless_knight';
                        piece.originalType = 'bishop';
                    } else if (piece.type === 'rook') {
                        // Ладья → Статуя (не может двигаться)
                        piece.type = 'statue_immobile';
                        piece.originalType = 'rook';
                    }
                }
            }
        }
        
        this.activeEvents.push({
            id: 'global_warming',
            name: 'Глобальное потепление',
            icon: 'bad_lands',
            active: true
        });
        
        this.updateModifiersDisplay();
        
        // Обновляем доску сразу после события
        if (this.renderer) {
            this.renderer.render();
        }
    }
    
    iceAge() {
        this.showEventNotification('❄️ ЛЕДНИКОВЫЙ ПЕРИОД! Кони → Буйволы, Ладьи → Статуи (неуязвимые)');
        
        // Превращаем фигуры на всей доске
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.game.board.getPiece(row, col);
                if (piece) {
                    if (piece.type === 'knight') {
                        // Конь → Буйвол (ходит как конь и верблюд)
                        piece.type = 'camel_knight';
                        piece.originalType = 'knight';
                    } else if (piece.type === 'rook') {
                        // Ладья → Статуя (может ходить куда угодно, неуязвима, не может есть)
                        piece.type = 'statue';
                        piece.originalType = 'rook';
                        piece.invulnerable = true;
                    }
                }
            }
        }
        
        this.activeEvents.push({
            id: 'ice_age',
            name: 'Ледниковый период',
            icon: 'ice_lands',
            active: true
        });
        
        this.updateModifiersDisplay();
        
        // Обновляем доску сразу после события
        if (this.renderer) {
            this.renderer.render();
        }
    }
    
    minefield() {
        this.showEventNotification('💣 МИННОЕ ПОЛЕ! Случайные клетки заминированы!');
        
        // Размещаем 8-12 мин на случайных пустых клетках
        const mineCount = Math.floor(Math.random() * 5) + 8; // 8-12 мин
        const emptySquares = [];
        
        // Находим все пустые клетки
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.game.board.getPiece(row, col);
                if (!piece) {
                    emptySquares.push({ row, col });
                }
            }
        }
        
        // Перемешиваем и выбираем случайные клетки для мин
        for (let i = 0; i < Math.min(mineCount, emptySquares.length); i++) {
            const randomIndex = Math.floor(Math.random() * emptySquares.length);
            const square = emptySquares.splice(randomIndex, 1)[0];
            this.game.mines.push(square);
        }
        
        this.activeEvents.push({
            id: 'minefield',
            name: 'Минное поле',
            icon: 'minefield',
            active: true
        });
        
        this.updateModifiersDisplay();
        
        // Обновляем доску сразу после события (хотя мины невидимы)
        if (this.renderer) {
            this.renderer.render();
        }
    }
    
    airborne() {
        this.showEventNotification('🪂 ДЕСАНТ! Пехота высаживается на вражеской территории!');
        
        // Высаживаем 3 белые пешки на черной половине (ряды 0-3)
        this.spawnPawns('white', 1, 3, 3);
        
        // Высаживаем 3 черные пешки на белой половине (ряды 4-7)
        this.spawnPawns('black', 4, 6, 3);
        
        this.activeEvents.push({
            id: 'airborne',
            name: 'Десант',
            icon: 'airborne',
            active: true
        });
        
        this.updateModifiersDisplay();
        
        // Обновляем доску сразу после события
        if (this.renderer) {
            this.renderer.render();
        }
    }
    
    spawnPawns(color, startRow, endRow, count) {
        const emptySquares = [];
        
        // Находим все пустые клетки в указанном диапазоне рядов
        for (let row = startRow; row <= endRow; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.game.board.getPiece(row, col);
                if (!piece) {
                    emptySquares.push({ row, col });
                }
            }
        }
        
        // Перемешиваем и выбираем случайные клетки для пешек
        for (let i = 0; i < Math.min(count, emptySquares.length); i++) {
            const randomIndex = Math.floor(Math.random() * emptySquares.length);
            const square = emptySquares.splice(randomIndex, 1)[0];
            
            // Создаем пешку
            this.game.board.setPiece(square.row, square.col, {
                type: 'pawn',
                color: color,
                hasMoved: true // Пешка уже "сходила", не может прыгнуть на 2 клетки
            });
        }
    }
    
    updateModifiersDisplay() {
        const modifiersList = document.getElementById('modifiers-list');
        
        if (this.activeEvents.length === 0) {
            modifiersList.innerHTML = '<span class="no-modifiers">Нет активных модификаторов</span>';
            return;
        }
        
        modifiersList.innerHTML = '';
        
        this.activeEvents.forEach(event => {
            const modifierItem = document.createElement('div');
            modifierItem.className = 'modifier-item';
            
            const icon = document.createElement('div');
            icon.className = 'modifier-icon';
            icon.style.backgroundImage = `url('images/modificators/${event.icon}.png')`;
            
            const name = document.createElement('div');
            name.className = 'modifier-name';
            name.textContent = event.name;
            
            modifierItem.appendChild(icon);
            modifierItem.appendChild(name);
            modifiersList.appendChild(modifierItem);
        });
    }
    
    showEventNotification(message) {
        const notification = document.getElementById('event-notification');
        notification.textContent = message;
        notification.classList.add('active');
        
        setTimeout(() => {
            notification.classList.remove('active');
        }, 5000);
    }
    
    // Методы для будущих событий
    
    addEvent(event) {
        this.events.push(event);
    }
    
    removeEvent(eventId) {
        this.events = this.events.filter(e => e.id !== eventId);
    }
    
    getActiveEvents() {
        return this.events.filter(e => e.active);
    }
    
    clearAllEvents() {
        this.events = [];
        this.activeEvent = null;
        this.activeEvents = [];
        this.updateModifiersDisplay();
    }
}
