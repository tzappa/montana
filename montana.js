let animationSpeed = 10; // ms for card animation

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
