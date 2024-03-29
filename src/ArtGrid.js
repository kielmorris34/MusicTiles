import { useEffect, useState } from "react";

function ArtGrid({ albums, tileSize, count, flipTime, setDetails, flipTile, details }) {


	useEffect(() => {
		let flipInterval;
		if (albums.length > 0 && flipTime < 99) {
			flipInterval = window.setInterval(() => {
				// choose a random art-tile img and change src to next indexed album art
				let shownAlbums = [...document.getElementById("ArtGrid").children].map(tile => tile.firstChild.getAttribute("spotifylink"));
				let index;
				let tries = 0;
				do {
					index = Math.floor(Math.random() * albums.length);
					tries++;
				//} while (shownAlbums.includes(albums[index].spotify_link));  // prevent dupes -- DOESN'T WORK :(
				} while (shownAlbums.indexOf(albums[index].spotify_link) !== -1 && tries < 200);

				// choose tile to flip
				let tileIndex;
				const lastFlipped = document.getElementById("ArtGrid").getAttribute("lastFlipped", tileIndex);
				do {
					tileIndex = Math.floor(Math.random() * count);
				} while (tileIndex === lastFlipped && count > 1);
				flipTile(tileIndex, albums[index]);

			}, flipTime * 1000);
		}
		return () => clearInterval(flipInterval);
	}, [flipTime, count, albums]);
	
	function setAlbumAsDetails(e) {
		setDetails(JSON.parse(e.target.getAttribute("album")));
	}

	return (
		<div id="ArtGrid">
			{albums.slice(0, count).map(album => (
				<div key={album.id} className="art-tile" style={{width: tileSize, height: tileSize}}
					onClick={setAlbumAsDetails}>
					<img src={album.art_url} alt={`${album.name} by ${album.artist}`} arturl={album.arturl}
						 spotifylink={album.spotify_link} album={JSON.stringify(album)} />
				</div>
			))}
		</div>
	);
}

export default ArtGrid;
