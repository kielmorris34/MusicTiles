import { useEffect, useState } from "react";
import spotifyLogo from "./images/spotify/logo/Spotify_Logo_Black.png"

function LoginPrompt({ authEndpoint, tokens }) {
	return (
		<>
			{ tokens.token_type !== "personal" ?
			<div id="login-prompt" s={tokens}>
				<div>
					<h1>MUSIC TILES</h1>
					<p>See your albums flipped through</p>
						<a href={authEndpoint}>
							<strong>Login to</strong> <img src={spotifyLogo}/>
						</a>
				</div>
			</div>
			: "" }
		</>
	);
}

export default LoginPrompt;