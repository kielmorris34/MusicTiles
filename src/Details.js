import spotifyLogo from "./images/spotify/logo/Spotify_Logo_Green.png"

function Details({ details, setDetails }) {

	function closeDetails(e) {
		setDetails();
	}

	return (
		<>
			{ details !== undefined ?
			<div id="details" onClick={closeDetails}>
				<div>
					<div id="detail-text-box">
						<div>
							<h2>{details.name}</h2>
							<h4>{details.artist}</h4>
							{details.track !== undefined && details.track !== "undefined" ? 
								<h4 id='detail-track'><span>track {details.track_number}</span>&nbsp;&nbsp;&nbsp;{details.track}</h4>
							: ""}
							<p id="close-prompt">CLICK ANYWHERE TO CLOSE</p>
						</div>
						<a href={details.spotify_link} target="_blank" className="spotify-link" >
							Listen on <img src={spotifyLogo}/>
						</a>
					</div>
					<div id="detail-image" style={{backgroundImage: `url(${details.art_url})`}} />
					<div id="detail-spacer"></div>
				</div>
			</div>
			: "" }
		</>
	);
}

export default Details;