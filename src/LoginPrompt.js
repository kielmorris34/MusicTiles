import spotifyLogo from "./images/spotify/logo/Spotify_Logo_Black.png"

function LoginPrompt({ authEndpoint }) {
	return (
		<div id="login-prompt">
			<div>
				<h1>Welcome to Music Tiles!</h1>
				<p>See your albums flipped through!</p>
				<a href={authEndpoint}>
					<strong>Login to</strong> <img src={spotifyLogo}/>
				</a>
			</div>
		</div>
	);
}

export default LoginPrompt;