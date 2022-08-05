import { useEffect, useState } from "react";

function ArtGrid({ albums, tileSize, count }) {
	const [index, setIndex] = useState(count);

	return (
		<div id="ArtGrid">
			{albums.slice(0, count).map(album => (
				<div key={album.id} className="art-tile" style={{width: tileSize, height: tileSize}}>
					<img src={album.art_url} alt="" />
					{/* <div className="art-info">
						<p><strong>{album.name}</strong></p>
						<p>{album.artist}</p>
					</div> */}
				</div>
			))}
		</div>
	);
}

export default ArtGrid;
