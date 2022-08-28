import spotifyLogo from "./images/spotify/logo/Spotify_Logo_Black.png"

function Details({ details, setDetails }) {

	function closeDetails() {
		setDetails();
	}

	function closeDetails(e) {
		// only close if background is clicked
		if (e.target.id === "details") setDetails();
	}

	return (
		<>
			{ details !== undefined ?
			<div id="details" onClick={closeDetails}>
				<div>
					<img src={details.art_url} />
					<div id="detail-text-box">
						<div>
							{details.track ? 
								<h3>{details.track}<span>TRACK</span></h3>
							: ""}
							<h3>{details.name}</h3>
							<h4>{details.artist}</h4>
						</div>
						<a href={details.spotify_link} target="_blank" className="spotify-link" >
							<strong>Listen on</strong> <img src={spotifyLogo}/>
						</a>
					</div>
				</div>
			</div>
			: "" }
		</>
	);
}

export default Details;