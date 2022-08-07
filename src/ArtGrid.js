import { useEffect, useState } from "react";

function ArtGrid({ albums, tileSize, count, flipTime }) {

	useEffect(() => {
		let flipInterval;
		if (albums.length > 0) {
			flipInterval = window.setInterval(() => {
				// choose a random art-tile img and change src to next indexed album art
				let shownAlbums = [...document.getElementById("ArtGrid").children].map(tile => tile.firstChild.getAttribute("src"));
				let index;
				do {
					index = Math.floor(Math.random() * albums.length);
				} while (shownAlbums.includes(index));

				const artGrid = document.getElementById("ArtGrid");
				// choose tile to flip
				let tileIndex;
				do {
					tileIndex = Math.floor(Math.random() * count);
				} while (tileIndex === artGrid.getAttribute("lastFlipped", tileIndex) && count > 1);
				const tileImg = artGrid.children.item(tileIndex).firstChild;

				// animate flip
				tileImg.classList.remove("flip-animation");
				void tileImg.offsetWidth;
				tileImg.classList.add("flip-animation");
				setTimeout(() => {
					tileImg.setAttribute("src", albums[index].art_url);
				}, 500); // half of flip-animation duration

				artGrid.setAttribute("lastFlipped", tileIndex);
			}, flipTime * 1000);
		} else {
			console.log("can't start flip interval");
		}
		return () => clearInterval(flipInterval);
	}, [flipTime, count, albums]);

	return (
		<div id="ArtGrid">
			{albums.slice(0, count).map(album => (
				<div key={album.id} className="art-tile" style={{width: tileSize, height: tileSize}}>
					<img src={album.art_url} alt="" />
				</div>
			))}
		</div>
	);
}

export default ArtGrid;
