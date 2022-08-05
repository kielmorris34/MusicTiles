function TopBar({ tokens, setTokens, clientId }) {

	const REDIRECT_URI = "http://localhost:3000";
	const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize?" +
		"response_type=code" +
		`&client_id=${clientId}` +
		"&scope=user-library-read" +
		`&redirect_uri=${REDIRECT_URI}`;

	const logout = () => {
		setTokens({});
		window.localStorage.removeItem("token");
		window.localStorage.removeItem("refresh_token");
	}

	return (
		<div id="top-bar">
			{!tokens.token ?
				<a href={AUTH_ENDPOINT}>Login to Spotify</a>
			:
				<button onClick={logout}>Logout</button>
			}
		</div>
	);
  }
  
  export default TopBar;
  