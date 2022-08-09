import { useEffect } from 'react';
import'./App.js'

function TopBar({ tokens, setTokens, clientId, rows, setRows, flipTime, setFlipTime, setAlbums }) {

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
	}

	const handleRowChange = (e) => {
		setRows(e.target.value);
	};

	const handleFlipTimeChange = (e) => {
		setFlipTime(e.target.value);
	};

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

	return (
		<div id="top-bar">
			<div className="options">
				<button id="dark-toggle" onClick={themeToggle}>
					<i className="fa-solid fa-lightbulb"></i>
				</button>
				<div>
					<label>ROWS</label>
					<input type="range" min="2" max="12" step="1" value={rows} onChange={handleRowChange}/>
					<p>{rows}</p>
				</div>
				<div>
					<label>FLIP RATE</label>
					<input type="range" min="0.5" max="30" step="0.5" value={flipTime} onChange={handleFlipTimeChange}/>
					<p>{flipTime} seconds</p>
				</div>
			</div>
			{tokens.tokenType === "personal" ?
				<button id="logout" onClick={logout}>LOGOUT</button>
			: "" }
		</div>
	);
  }
  
  export default TopBar;
  