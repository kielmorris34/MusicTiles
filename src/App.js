import { useEffect, useState, useLayoutEffect } from 'react';
import './App.css';
import ArtGrid from './ArtGrid';
import Settings from './Settings';
import TopBar from './TopBar';
import axios from 'axios';

function useWindowSize() {
	const [size, setSize] = useState([0, 0]);
	useLayoutEffect(() => {
		function updateSize() {
			setSize([window.innerWidth, window.innerHeight]);
		}
		window.addEventListener('resize', updateSize);
		updateSize();
		return () => window.removeEventListener('resize', updateSize);
	}, []);
	return size;
}

function App() {
	const [rows, setRows] = useState(5);
	const [tileSize, setTileSize] = useState();
	const [count, setCount] = useState();
	const [width, height] = useWindowSize();
	const [token, setToken] = useState("");
	const [refreshToken, setRefreshToken] = useState("");
	const [albums, setAlbums] = useState([]);

	const REDIRECT_URI = "http://localhost:3000";
	const CLIENT_ID = "1667bd23e69245408998d6429c6b6949";
	const CLIENT_SECRET = "e44899b0f5114a64bd5bcecdb6036cf3";
	const API = "https://api.spotify.com/v1/";

	useEffect(() => {
		let token = window.localStorage.getItem("token");
		if (token) {
			setToken(token);
			let refreshToken = window.localStorage.getItem("refresh_token");
			if (refreshToken) setRefreshToken(refreshToken);

			getSpotifyAlbums();
		} else {
			let code;
			if (window.location.search.length > 0) {
				code = (new URLSearchParams(window.location.search)).get('code');
				callAuthApi("grant_type=authorization_code"
					+ `&code=${code}`
					+ `&redirect_uri=${encodeURI(REDIRECT_URI)}`
					+ `&client_id=${CLIENT_ID}`
					+ `&client_secret=${CLIENT_SECRET}`
				);
				window.history.pushState("", "", REDIRECT_URI); // remove param from url
			}
		}

	}, []);

	const getSpotifyAlbums = async () => {
		console.log("getting albums...");
		const {data} = await axios.get(API + "me/albums", {
			headers: {
				Authorization: `Bearer ${token}`
			},
		});
		// Parse response to general format
		setAlbums(data.items.map(item => ({
			name: item.album.name,
			artist: item.album.artists[0].name,
			art_url: item.album.images[0].url,
			release_date: item.album.release_date,
			id: item.album.id
		})));
	}

	function callAuthApi(body) {
		let xhr = new XMLHttpRequest();
		xhr.open("POST", "http://accounts.spotify.com/api/token");
		xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
		xhr.setRequestHeader('Authorization', 'Basic ' + btoa(CLIENT_ID + ":" + CLIENT_SECRET));
		xhr.send(body);
		xhr.onload = handleAuthorizationResponse;
	}

	function handleAuthorizationResponse() {
		if (this.status === 200) {
			var data = JSON.parse(this.responseText);
			console.log(data);
			if (data.access_token !== undefined) {
				window.localStorage.setItem("token", data.access_token);
				setToken(data.access_token);
				getSpotifyAlbums();
			}
			if (data.refresh_token !== undefined) {
				window.localStorage.setItem("refresh_token", data.refresh_token);
				setRefreshToken(data.refresh_token);
			}
		} else if (this.status === 401) {
			callAuthApi("grant_type=refresh_token"
				+ `&refresh_token=${refreshToken}`
				+ `&client_id=${CLIENT_ID}`
			);
		} else {
			console.log(this.responseText);
			alert(this.responseText);
		}
	}

	useEffect(() => {
		setTileSize(height / rows);
		setCount(Math.floor(width / (height / rows)) * rows);
	}, [rows, width, height]);

	return (
		<div className="App">
			<TopBar token={token} setToken={setToken} clientId={CLIENT_ID} clientSecret={CLIENT_SECRET} />
			<ArtGrid albums={albums} tileSize={tileSize} count={count} />
		</div>
	);
}

export default App;
