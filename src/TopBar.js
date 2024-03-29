import { useEffect } from 'react';
import'./App.js'
import spotifyLogo from "./images/spotify/logo/Spotify_Logo_Green.png"

function TopBar({ tokens, setTokens, rows, setRows, flipTime, setFlipTime, setAlbums, 
	contentMode, setContentMode, playlists, setPlaylists, selectedPlaylist, setSelectedPlaylist, cascade, goFullscreen, redirectToSpotifyAuthorizeEndpoint }) {

	// Set initial theme (dark/light)
	useEffect(() => {
		let theme = window.localStorage.getItem("theme");
		if (theme) setTheme(theme);
	}, []);

	const logout = () => {
		window.localStorage.removeItem("token");
		window.localStorage.removeItem("refresh_token");
		setTokens({});
		setAlbums([]);
		setPlaylists([]);
	}

	const handleRowChange = (e) => {
		setRows(e.target.value);
	};

	const handleFlipTimeChange = (e) => {
		setFlipTime(e.target.value);
	};

	const handleContentModeChange = (e) => {
		setAlbums([]);
		setContentMode(e.target.value)
		window.localStorage.setItem("content_mode", e.target.value);
	}

	const handlePlaylistChange = (e) => {
		setAlbums([]);
		setSelectedPlaylist(e.target.value);
	}

	function themeToggle() {
		let theme = window.localStorage.getItem("theme");
		if (!theme || theme === 'light') {
			theme = 'dark';
		} else {
			theme = 'light';
		}
		setTheme(theme);
	}

	function setTheme(theme) {
		const rootStyle = document.documentElement.style;
		rootStyle.setProperty('--theme-color', `var(--${theme}-color)`)
		rootStyle.setProperty('--theme-bg-color', `var(--${theme}-bg-color)`)
		rootStyle.setProperty('--theme-accent-color', `var(--${theme}-accent-color)`)
		rootStyle.setProperty('--theme-gradient', `var(--${theme}-gradient)`)

		window.localStorage.setItem("theme", theme);
	}

	// For small screens only
	function toggleTopBar() {
		document.getElementById("top-bar").classList.toggle("open")
		document.getElementById("toggle-top-bar-icon").classList.toggle("fa-angle-down")
		document.getElementById("toggle-top-bar-icon").classList.toggle("fa-angle-up")
	}

	return (
		<div id="top-bar">
			<div className="options">
				<div className='always-centered'>
					<button onClick={themeToggle} title='Toggle theme'>
						<i className="fa-solid fa-lightbulb"></i>
					</button>
					<button onClick={goFullscreen} title='Toggle fullscreen'>
						{ document.fullscreenElement === null ? (  // careful with this, I think it's only working bc
							<i className="fa-solid fa-expand"></i> // of something else triggering re-render
						) : (
							<i className="fa-solid fa-compress"></i>
						)}
					</button>
					<button onClick={cascade} title='Refresh tiles'>
						<i className="fa-solid fa-rotate-right"></i>
					</button>
				</div>
				<div>
					<label>ROWS</label>
					<input type="range" min="2" max="12" step="1" value={rows} onChange={handleRowChange}/>
					<p>{rows}</p>
				</div>
				<div>
					<label>FLIP RATE</label>
					<input id='flip-rate-slider' type="range" min="0.5" max="30.0" step="0.5" value={flipTime} onChange={handleFlipTimeChange}/>
					<p>{parseFloat(flipTime).toLocaleString('en-US', {minimumFractionDigits: 1})} seconds</p>
				</div>
				<div>
						<>
						<label>CONTENT</label>
						<div id='content-radios' onChange={handleContentModeChange}>
							<div>
								<input type="radio" value="ALBUMS" name="content_mode" id="radio-albums" disabled={tokens?.tokenType !== "personal"} />
								<label className='radio-label'>Albums</label>
							</div>
							<div>
								<input type="radio" value="SONGS" name="content_mode" id="radio-songs" disabled={tokens?.tokenType !== "personal"} />
								<label className='radio-label'>Songs</label>
							</div>
							<div>
								<input type="radio" value="PLAYLIST" name="content_mode" id="radio-playlist" disabled={tokens?.tokenType !== "personal"} />
								<label className='radio-label'>Playlist</label>
							</div>
						</div>
						</>
					{ contentMode === "PLAYLIST" ? (
						<select name="playlist" onChange={handlePlaylistChange} value={selectedPlaylist}>
							{ Object.keys(playlists).map(playlist => (	
								<option value={playlist}>{playlist}</option>
							))}
						</select>
					) : ""}
				</div>
			</div>
			<div id='right-side' className='always-centered'>
				{tokens.tokenType === "personal" ?
					<button id="loginout" onClick={logout}>LOGOUT</button>
				:
					<button id="loginout" onClick={redirectToSpotifyAuthorizeEndpoint}>LOGIN</button>
				}
				<img src={spotifyLogo} alt="Spotify logo" />
			</div>
			<button id='toggle-top-bar' onClick={toggleTopBar} title='Toggle Options'>
				<i id='toggle-top-bar-icon' className="fa-solid fa-angle-down"></i>
			</button>
		</div>
	);
  }
  
  export default TopBar;
  