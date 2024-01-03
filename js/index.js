// 👀

const toast_container = document.querySelector(".toast-container");
	
function toast(text) {
	const toast = document.createElement("div");
	toast.classList.add("toast");
	toast.innerText = text;
	toast_container.appendChild(toast);

	toast.addEventListener("finish", (event) => {console.log(event) });
	
	return new Promise(async (resolve, reject) => {
		await Promise.allSettled(
			toast.getAnimations().map(animation => 
				animation.finished
			)
		)
		toast_container.removeChild(toast);
		resolve();
	})
}