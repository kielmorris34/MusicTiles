function TopBar({ tokens, setTokens, clientId, rows, setRows, flipTime, setFlipTime }) {

	const REDIRECT_URI = "http://localhost:3000";

	const logout = () => {
		setTokens({});
		window.localStorage.removeItem("token");
		window.localStorage.removeItem("refresh_token");
	}

	const handleRowChange = (e) => {
		setRows(e.target.value);
	};

	const handleFlipTimeChange = (e) => {
		setFlipTime(e.target.value);
	};

	return (
		<div id="top-bar">
			<div className="options">
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
				<button id="logout" onClick={logout}><strong>LOGOUT</strong></button>
			: "" }
		</div>
	);
  }
  
  export default TopBar;
  