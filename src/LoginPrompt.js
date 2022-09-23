import { useRef } from "react";
import spotifyLogo from "./images/spotify/logo/Spotify_Logo_Green.png"

function LoginPrompt({ redirectToSpotifyAuthorizeEndpoint, tokens }) {

	const loginPrompt = useRef(null);

	return (
		<>
			{ tokens.tokenType !== "personal" ?
			<div id="login-prompt" ref={loginPrompt}>
				<div>
					<h1>MUSIC TILES</h1>
					<p>See your collection flipped through!</p>
					<button onClick={redirectToSpotifyAuthorizeEndpoint} className="spotify-link">
						Login to <img src={spotifyLogo}/>
					</button>
					<button id='close-login' onClick={() => loginPrompt.current.style.setProperty("display", "none")}><i className="fa-solid fa-circle-xmark"></i></button>
				</div>
			</div>
			: "" }
		</>
	);
}

export default LoginPrompt;