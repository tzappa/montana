const Suits = ['♠', '♥', '♦', '♣'];
const SuitNames = ['spades', 'hearts', 'diamonds', 'clubs'];
const Ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
let imgPath = 'img/'; // base path for card images
let imgExt; // extension for card images and back image
let animationSpeed = 10; // ms for card animation

class Card {
	constructor(suit, rank, faceUp = true) {
		this.suit = suit;
		this.rank = rank;
		this.color = suit === '♠' || suit === '♣' ? 'black' : 'red';
		this.name = SuitNames[Suits.indexOf(suit)];
		this.pile = null;
		this.element = document.createElement('img');
		this.element.classList.add('card');
		faceUp ? this.faceUp() : this.faceDown()
	}

	faceUp() {
		this.isFaceUp = true;
		this.element.src = `${imgPath}${this.rank}${this.name[0]}${imgExt}`;
		this.element.alt = `${this.rank}${this.suit}`;
		this.element.classList.remove('facedown');
		this.element.classList.add(this.name);
	}

	faceDown() {
		this.isFaceUp = false;
		if (imgPath) {
			this.element.src = `${imgPath}back.png`;
			this.element.alt = '';
		} else {
			this.element.innerHTML = this.toString();
		}
		this.element.classList.add('facedown');
		this.element.classList.remove(this.name);
	}

	pos(left, top) {
		this.element.style.left = `${left}px`;
		this.element.style.top = `${top}px`;
	}

	mark(className = 'selected') {
		this.element.classList.add(className);
	}

	unmark(className = 'selected') {
		this.element.classList.remove(className);
	}

	isMarked(className = 'selected') {
		return this.element.classList.contains(className);
	}

	previousCard() {
		if (!this.pile) {
			return null;
		}
		let index = this.pile.cardIndex(this);
		if (index === 0) {
			return null;
		}
		return this.pile.cards[index - 1];
	}

	toString() {
		return this.isFaceUp ? `${this.rank}${this.suit}` : '?';
	}
}

class Stack {
	constructor() {
		this.cards = [];
	}

	addCard(card) {
		this.cards.push(card);
	}

	removeCard(card) {
		let index = this.cardIndex(card);
		if (index === -1) {
			throw new Error('Card not found');
		}
		this.cards.splice(index, 1);
	}

	drawCard() {
		return this.cards.pop();
	}

	isEmpty() {
		return this.cards.length === 0;
	}

	cardsCount() {
		return this.cards.length;
	}

	topCard() {
		return this.cards[this.cardsCount() - 1];
	}

	cardIndex(card) {
		if (card instanceof Card) {
			return this.cards.indexOf(card);
		}
		return this.cards.findIndex(c => c.toString() === card);
	}

	shuffle() {
		for (let i = this.cards.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
		}
	}

	toString() {
		return this.cards.map(card => card.toString()).join(' ');
	}
}

class Deck extends Stack {
	constructor(faceUp = false) {
		super();
		this.deckCards = [];
		for (let suit of Suits) {
			for (let rank of Ranks) {
				let card = new Card(suit, rank, faceUp);
				this.addCard(card);
				this.deckCards.push(card);
			}
		}
	}

	drawCard(pile) {
		let card = super.drawCard();
		pile.addCard(card);
		return card;
	}

	addCard(card) {
		if (card.pile) {
			card.pile.removeCard(card);
		}
		super.addCard(card);
	}

	reset() {
		for (let card of this.deckCards) {
			if (card.pile) {
				card.pile.removeCard(card);
			}
			this.addCard(card);
		}
	}

	findDeckCard(card) {
		return this.deckCards.find(c => c.toString() === card.toString());
	}
}

class Pile extends Stack {
	constructor(parent) {
		super();
		this.element = document.createElement('div');
		this.element.classList.add('pile');
		parent.appendChild(this.element);
	}

	onClick(callback) {
		this.element.addEventListener('click', callback);
	}

	onDblClick(callback) {
		this.element.addEventListener('dblclick', callback);
	}

	addCard(card) {
		if (card.pile) {
			card.pile.removeCard(card);
		}
		super.addCard(card);
		this.element.appendChild(card.element);
		card.pile = this;
	}

	removeCard(card) {
		super.removeCard(card);
		card.pile = null;
		this.element.removeChild(card.element);
	}
}

class Montana {
	constructor(parent) {
		this.shufflesLeft = 3;
		this.dealing = true;
		this.gameEnded = true;
		if (table.offsetWidth < 900) {
			imgPath += 'compact/';
			imgExt = '.png';
		} else {
			imgPath += 'set6/';
			imgExt = '.svg';
		}
		this.piles = [];
		for (let suit of Suits) {
			for (let rank of Ranks) {
				let pile = new Pile(parent);
				pile.onClick(() => this.pileClick(pile));
				this.piles.push(pile);
			}
		}
		const newGameBtns = document.getElementsByClassName('new-game-button');
		for (let newGameBtn of newGameBtns) {
			newGameBtn.addEventListener('click', () => {
				if (this.gameEnded || confirm('Are you sure you want to start a new game?')) {
					this.deck.reset();
					this.startGame();
				}
			});
		}
		document.getElementById('shuffleButton').addEventListener('click', () => this.shuffle());
		document.getElementById('gameOverClose').addEventListener('click', function () {
			document.getElementById('gameOver').style.display = 'none';
		});
		this.deck = new Deck(true);
	}

	startGame() {
		document.getElementById('gameOver').style.display = 'none';
		document.getElementById('shuffleButton').disabled = false;
		this.shufflesLeft = 3;
		document.getElementById('shufflesLeft').textContent = this.shufflesLeft;
		this.dealing = true;
		this.deck.shuffle();
		setTimeout(() => this.dealCard(), animationSpeed);
	}

	shuffle() {
		if (!this.shufflesLeft || this.dealing || this.gameEnded) {
			return;
		}
		this.shufflesLeft--;
		if (this.shufflesLeft === 0) {
			document.getElementById('shuffleButton').disabled = true;
		}
		document.getElementById('shufflesLeft').textContent = this.shufflesLeft;
		this.dealing = true;
		this.deck.shuffle();
		for (let pile of this.piles) {
			while (!pile.isEmpty() && !pile.topCard().isMarked()) {
				this.deck.addCard(pile.topCard());
			}
		}
		this.deck.shuffle();
		setTimeout(() => this.dealCard(), animationSpeed);
	}

	dealCard() {
		let card = this.deck.topCard();
		if (card) {
			card.unmark();
			for (let pile of this.piles) {
				if (pile.isEmpty()) {
					this.deck.drawCard(pile);
					setTimeout(() => this.dealCard(), animationSpeed);
					return;
				}
			}
		} else {
			setTimeout(() => this.discardAces(), animationSpeed);
		}
	}

	discardAces() {
		for (let pile of this.piles) {
			let card = pile.topCard();
			if (card && card.rank === 'A') {
				this.deck.addCard(card);
				setTimeout(() => this.discardAces(), animationSpeed);
				return;
			}
		}
		this.dealing = false;
		this.gameEnded = false;
		this.checkWin();
	}

	checkWin() {
		let win = true;
		let rowSuit = null; // suit of the 1st card in the row
		for (let pile of this.piles) {
			let col = this.piles.indexOf(pile) % 13;
			if (col === 12) {
				rowSuit = null;
				continue;
			}
			if (pile.isEmpty()) {
				rowSuit = null;
				win = false;
				continue;
			}
			let card = pile.topCard();
			if (card.rank !== Ranks[col]) {
				rowSuit = null; 
				win = false;
				continue;
			}
			if (col === 0) {
				rowSuit = card.suit;
			}
			if (card.suit !== rowSuit) {
				win = false;
				rowSuit = null;
				continue;
			}
			if (rowSuit) {
				card.mark();
			}       
		}
		if (win) {
			document.getElementById('gameOver').style.display = 'block';
			this.gameEnded = true;
		}
		return win;        
	}

	pileClick(pile) {
		if (this.dealing || this.gameEnded) {
			return;
		}
		if (pile.isEmpty()) {
			let leftPile = this.leftPile(pile);
			if (leftPile) {
				if (leftPile.isEmpty()) {
					return;
				}
				let leftCard = leftPile.topCard();
				if (leftCard.rank === 'K') { // king blocks
					return;
				}
				let card = this.deck.findDeckCard(Ranks[Ranks.indexOf(leftCard.rank) + 1] + leftCard.suit);
				pile.addCard(card);
				this.checkWin();
				return ;
			}
			// find card with rank 2 which is not ot the 1st position
			for (let suit of Suits) {
				let card = this.deck.findDeckCard('2' + suit);
				if (this.piles.indexOf(card.pile) % 13 !== 0) {
					pile.addCard(card);
					this.checkWin();
					return;
				}
			}
		}
		// click on a card
		let card = pile.topCard();
		if (card.isMarked()) {
			return ;
		}
		if (card.rank == '2') {
			// find an empty slot in the first column
			for (let pile of this.piles) {
				if (this.piles.indexOf(pile) % 13 === 0 && pile.isEmpty()) {
					pile.addCard(card);
					this.checkWin();
					return;
				}
			}
			return;
		}
		// find the card with the same suit and the previous rank
		let prevCard = this.deck.findDeckCard(Ranks[Ranks.indexOf(card.rank) - 1] + card.suit);
		let rightPile = this.rightPile(prevCard.pile);
		if (rightPile.isEmpty()) {
			rightPile.addCard(card);
			this.checkWin();
			return;
		}
	}

	leftPile(pile) {
		let index = this.piles.indexOf(pile);
		if (index % 13 === 0) {
			return null;
		}
		return this.piles[index - 1];
	}

	rightPile(pile) {
		let index = this.piles.indexOf(pile);
		if (index % 13 === 12) {
			return null;
		}
		return this.piles[index + 1];
	}
}

document.addEventListener('DOMContentLoaded', function() {
	const montana = new Montana(document.getElementById('table'));
	montana.startGame();
});
