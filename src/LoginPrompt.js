import { useEffect, useState } from "react";
import spotifyLogo from "./images/spotify/logo/Spotify_Logo_Green.png"

function LoginPrompt({ redirectToSpotifyAuthorizeEndpoint, tokens }) {

	return (
		<>
			{ tokens.tokenType !== "personal" ?
			<div id="login-prompt">
				<div>
					<h1>MUSIC TILES</h1>
					<p>See your collection flipped through!</p>
						<a onClick={redirectToSpotifyAuthorizeEndpoint} className="spotify-link">
							Login to <img src={spotifyLogo}/>
						</a>
				</div>
			</div>
			: "" }
		</>
	);
}

export default LoginPrompt;