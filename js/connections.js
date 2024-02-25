const board = document.querySelector(".board");
const submit = document.querySelector(".submit");
const deselect = document.querySelector(".deselect-all");
const dialog = document.querySelector(".dialog--results-modal");
const x = document.querySelector(".button--dialog");
const closeModal = document.querySelector(".close-modal");
const attemptsRemaining = document.querySelector(".attempts-remaining-container");
const buttons = document.querySelector(".connections-buttons");
const dialog_title = document.querySelector(".dialog-header__title");
const puzzle_recap = document.querySelector(".puzzle-recap");
const share_btn = document.querySelector(".share-results");

const congratulations = [
	"Next Time!",
	"Phew!",
	"Solid!",
	"Great!",
	"Perfect!"
]
const recap_emojis = [
	"🟨",
	"🟩",
	"🟦",
	"🟪"
]

share_btn.onclick = () => {
	let storage = loadStorage();
	toast("Copied to clipboard!");
	navigator.clipboard.writeText(storage.emojis);
}

closeModal.onclick = function() {
	dialog.close();
}

// Useful functions

// Storage functions
function saveStorage(data) {
	localStorage.connections = JSON.stringify(data);
}
const loadStorage = () => JSON.parse(localStorage.connections || "{}");

// Board functions
const itemRow = item => item.classList[1].slice(-1);
const itemCol = item => item.classList[2].slice(-1);

function deselectAll() {
	const selected = document.querySelectorAll(".item--selected");
	board.classList.remove("board--full");

	submit.classList.remove("button--fill");
	submit.disabled = true;

	selected.forEach((item) => item.classList.remove("item--selected"))
}

// Button onclicks
deselect.onclick = deselectAll;
submit.onclick = checkSelected;

async function solveCategory(category) {
	let storage = loadStorage();
	
	let items = storage.board.map((row, row_index) => row.map((item, item_index) => [row_index, item_index, item.category]).filter(n => n[2] === category)).flat();
	items = items.map(item => document.querySelector(`.item--row-${item[0]}.item--col-${item[1]}`));
	
	const num_solved = storage.categories.filter(object => object.solved).length;

	const rows = items.map(item => item.classList[1].slice(-1));
	const valid_cols = [0,1,2,3].filter(col => storage.board[num_solved][col].category !== category)
	const move = items.filter((item, index) => rows[index] !== num_solved.toString());

	valid_cols.forEach((col, index) => {
		const item = move[index];
		const item_row = item.classList[1].slice(-1);
		const item_col = item.classList[2].slice(-1);
		swapSquares(item_row, item_col, num_solved, col);
	});

	storage = loadStorage();

	storage.categories[category].solved = true;
	const items_text = items.map(item => item.textContent).join(", ");
	storage.categories[category].items = items_text;
	storage.categories[category].row = num_solved;

	saveStorage(storage);

	await new Promise(resolve => setTimeout(resolve, 1000));
	
	createBanner(category);
	deselectAll();
}

function findCategory(text) {
	let storage = loadStorage();
	return storage.board.flat().filter(item => item.text === text)[0].category;
}

function generateRecap() {
	let storage = loadStorage();
	let emojis = "";
	const groups = storage.history.map(arr => arr.map(guess => storage.board.flat().filter(item => item.text === guess)[0].category));
	groups.forEach(group => {
		const row = document.createElement("div");
		row.classList.add("puzzle-recap__row");
		puzzle_recap.appendChild(row);

		group.forEach(item => {
			const elem = document.createElement("div");
			elem.classList.add("puzzle-recap__item",`puzzle-recap__item--group-${item}`);
			row.appendChild(elem);
			emojis += recap_emojis[item];
		})
		emojis += "\n";
	})
	if (!storage.emojis) {
		storage.emojis = emojis;
		saveStorage(storage);
	}
}

function createBanner(category) {
	let storage = JSON.parse(localStorage.connections);
	const banner = document.createElement("div");
	const row = storage.categories[category].row;
	const items = storage.categories[category].items;
	banner.classList.add("answer-banner",`answer-banner--group-${category}`, `item--row-${row}`)

	const banner_title = document.createElement("span");
	banner_title.classList.add("banner-text", "banner-text--title");
	banner_title.textContent = storage.categories[category].name;
	banner.appendChild(banner_title);

	const banner_subtitle = document.createElement("span");
	banner_subtitle.classList.add("banner-text", "banner-text--subtitle");
	banner_subtitle.textContent = items;
	banner.appendChild(banner_subtitle);

	board.appendChild(banner);
}

function loadBoard() {
	storage = loadStorage();

	if (!storage || storage.version !== data.version) {
		saveStorage(data);
	}
	storage = loadStorage();
	
	// 🆕 Create elements
	storage.board.forEach((row, row_index) => {
		row.forEach((item, col_index) => {
			const elem = document.createElement("div");
			elem.classList.add("item",`item--row-${row_index}`,`item--col-${col_index}`);
			elem.textContent = item.text;
			board.appendChild(elem);
			elem.onclick = handleClick;
		});
	})
	// 🎋 Create banners
	storage.categories.forEach((category, index) => {
		if (category.solved) {
			createBanner(index);
		}
	});
	// ⌛ Attempts remaining
	for (let i = storage.attemptsRemaining; i > 0; i--) {
		const node = document.createElement("span");
		node.classList.add("circle");
		attemptsRemaining.appendChild(node);
	}
	// if lost
	if (storage.gameOver) {
		gameOver();
	}
	fitText();
}

function gameOver() {
	let storage = loadStorage();
	buttons.innerHTML = "";
	const node = document.createElement("button");
	node.classList.add("button", "button--pill");
	node.textContent = "Show Results";
	node.onclick = function() {
		dialog.showModal();
	};

	buttons.appendChild(node);

	dialog_title.textContent = congratulations[storage.attemptsRemaining];
	generateRecap();
	dialog.showModal();
}

function handleClick(event) {
	var item = event.currentTarget;
	var num_selected = document.querySelectorAll(".item--selected").length;

	if (item.classList.contains("item--selected")) {
		item.classList.remove("item--selected");
	}
	else {
		if (num_selected === 4) return;
		item.classList.add("item--selected");
	}
	num_selected = document.querySelectorAll(".item--selected").length;

	if (num_selected === 4) {
		board.classList.add("board--full");

		submit.classList.add("button--fill");
		submit.disabled = false;
	}
	else {
		board.classList.remove("board--full");
		
		submit.classList.remove("button--fill");
		submit.disabled = true;
	}
}

// CHECK SELECTED
async function checkSelected() {
	const selected = Array.from(document.querySelectorAll(".item--selected"));
	const selected_text = selected.map(item => item.textContent);
	
	selected.forEach((item, index) => item.style.animation = `bounce 400ms ease-in ${index * 100}ms`);
	let storage = loadStorage();

	// Check if already guessed, then send alert
	const is_already_guessed = storage.history.some(guess => {
		return JSON.stringify(guess.toSorted()) === JSON.stringify(selected_text.toSorted());
	});
	
	if (is_already_guessed) return toast("Already guessed!");
	
	// Otherwise, add to already guessed
	storage.history.push(selected_text);
	
	saveStorage(storage);

	await new Promise(resolve => setTimeout(resolve, 1000));
	
	// SPLIT HANDLING INTO SEPARATE FUNCTIONS
	
	let categories = selected.map(item => {
		return storage.board[itemRow(item)][itemCol(item)].category;
	})
	// 🪅 RIGHT
	if ( categories.every(category => category === categories[0]) ) {
		const category = categories[0];
		
		await solveCategory(category);
		storage = loadStorage();
		if (storage.categories.every(category => category.solved)) {
			// 🏆 WIN
			storage.gameOver = true;
			saveStorage(storage);
			gameOver();
		}
	}
	// 🦡 WRONG
	else {
		selected.forEach((item, index) => item.style.animation = `shake 300ms ease-in ${index * 20}ms`);

		// Check and update remaining attempts
		storage.attemptsRemaining -= 1;
		document.querySelector(".circle").remove();
		saveStorage(storage);
		if (storage.attemptsRemaining === 0) {
			// 💥 FAIL
			endGame()
			return;
		}
		// 🤏 ONE AWAY
		if (
			categories.toSorted().slice(1).every(item => item === categories[1])
			|| categories.toSorted().slice(0,-1).every(item => item === categories[0])
		) {
			toast("One away!")
		}
	}
}

async function endGame() {
	await new Promise(resolve => setTimeout(resolve, 1000));
	deselectAll();

	for (let i = 0; i < 4; i++) {
		if (!storage.categories[i].solved) {
			await solveCategory(i);
			await new Promise(resolve => setTimeout(resolve, 300));
		}
	}
	storage = loadStorage();
	storage.gameOver = true;
	saveStorage(storage)
	gameOver();
}

async function swapSquares(row1, col1, row2, col2) {
	const storage = loadStorage();
	
	const item1 = document.querySelector(`.item--row-${row1}.item--col-${col1}`);
	const item2 = document.querySelector(`.item--row-${row2}.item--col-${col2}`);

	const item1_object = storage.board[row1][col1];
	const item2_object = storage.board[row2][col2];

	storage.board[row1][col1] = item2_object;
	storage.board[row2][col2] = item1_object;
	
	item1.classList.remove(`item--row-${row1}`,`item--col-${col1}`);
	item1.classList.add(`item--row-${row2}`,`item--col-${col2}`);

	item2.classList.remove(`item--row-${row2}`,`item--col-${col2}`);
	item2.classList.add(`item--row-${row1}`,`item--col-${col1}`);

	localStorage.connections = JSON.stringify(storage);
}

loadBoard();

// Draft code for text box fitting
function fitText() {
	for (child of board.children) {
		textFit(child, {
			maxFontSize: 15,
			multiLine: false
		});
	}
}
window.onresize = fitText;