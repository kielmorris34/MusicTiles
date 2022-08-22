import { useEffect, useState } from "react";

function ArtGrid({ albums, tileSize, count, flipTime, setDetails }) {

	useEffect(() => {
		let flipInterval;
		if (albums.length > 0) {
			flipInterval = window.setInterval(() => {
				// choose a random art-tile img and change src to next indexed album art
				let shownAlbums = [...document.getElementById("ArtGrid").children].map(tile => tile.firstChild.getAttribute("spotifylink"));
				let index;
				do {
					index = Math.floor(Math.random() * albums.length);
				} while (shownAlbums.includes(albums[index].spotify_link));  // prevent dupes

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
					tileImg.style.setProperty("display", "none");
					tileImg.setAttribute("src", albums[index].art_url);
					tileImg.setAttribute("alt", `${albums[index].name} by ${albums[index].artist}`);
					tileImg.setAttribute("key", albums[index].id);
					tileImg.setAttribute("albumName", albums[index].name);
					tileImg.setAttribute("albumArtist", albums[index].artist);
					tileImg.setAttribute("spotifyLink", albums[index].spotify_link);
					tileImg.style.setProperty("display", "block");
				}, 500); // half of flip-animation duration

				artGrid.setAttribute("lastFlipped", tileIndex);
			}, flipTime * 1000);
		} else {
			console.log("can't start flip interval");
		}
		return () => clearInterval(flipInterval);
	}, [flipTime, count, albums]);

	function setAlbumAsDetails(e) {
		setDetails({
			name: e.target.getAttribute("albumname"),
			artist: e.target.getAttribute("albumartist"),
			art_url: e.target.getAttribute("src"),
			spotify_link: e.target.getAttribute("spotifylink")
		});
	}

	return (
		<div id="ArtGrid">
			{albums.slice(0, count).map(album => (
				<div key={album.id} className="art-tile" style={{width: tileSize, height: tileSize}} 
					onClick={setAlbumAsDetails}>
					<img src={album.art_url} alt={`${album.name} by ${album.artist}`} 
						albumname={album.name} albumartist={album.artist} spotifylink={album.spotify_link}/>
				</div>
			))}
		</div>
	);
}

export default ArtGrid;
