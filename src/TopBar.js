function TopBar({ token, setToken, clientId, clientSecret }) {

	const REDIRECT_URI = "http://localhost:3000";
	const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize?" +
		"response_type=code" +
		`&client_id=${clientId}` +
		"&scope=user-library-read" +
		`&redirect_uri=${REDIRECT_URI}`;

	const logout = () => {
		setToken("");
		window.localStorage.removeItem("token");
	}

	return (
		<div id="top-bar">
			{!token ?
				<a href={AUTH_ENDPOINT}>Login to Spotify</a>
			:
				<button onClick={logout}>Logout</button>
			}
		</div>
	);
  }
  
  export default TopBar;
  