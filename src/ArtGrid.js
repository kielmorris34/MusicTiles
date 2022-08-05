import { useEffect, useState } from "react";

function ArtGrid({ albums, tileSize, count }) {
	const [pickedAlbums, setPickedAlbums] = useState([]);
	useEffect(() => {
		if (albums.length > 0) {
			let pile = [...albums];
			// add dupes if less albums are saved than the
			// desired amount to be shown
			while (pile.length < count) {
				pile.concat(pile);
			}
			const shuffled = [...pile].sort(() => 0.5 - Math.random());
			setPickedAlbums(shuffled.slice(0, count));
		}
	}, [count, albums]);

	return (
		<div id="ArtGrid">
			{pickedAlbums.map(album => (
				<div key={album.id} className="art-tile" style={{width: tileSize, height: tileSize}}>
					<img src={album.art_url} alt="" />
					<div className="art-info">
						<p><strong>{album.name}</strong></p>
						<p>{album.artist}</p>
					</div>
				</div>
			))}
		</div>
	);
}

export default ArtGrid;
