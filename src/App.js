import { useEffect, useState, useLayoutEffect } from 'react';
import './App.css';
import ArtGrid from './ArtGrid';
import Settings from './Settings';
import TopBar from './TopBar';
import axios from 'axios';

function useWindowDimension() {
	const [dimension, setDimension] = useState([
		window.innerWidth,
		window.innerHeight,
	]);
	useEffect(() => {
		const debouncedResizeHandler = debounce(() => {
			console.log('***** debounced resize'); // See the cool difference in console
			setDimension([window.innerWidth, window.innerHeight]);
		}, 1000); // 100ms
		window.addEventListener('resize', debouncedResizeHandler);
		return () => window.removeEventListener('resize', debouncedResizeHandler);
	}, []); // Note this empty array. this effect should run only on mount and unmount
	return dimension;
}

function debounce(fn, ms) {
	let timer;
	return _ => {
		clearTimeout(timer);
		timer = setTimeout(_ => {
			timer = null;
			fn.apply(this, arguments);
		}, ms);
	};
}

function App() {
	const [rows, setRows] = useState(5);
	const [tileSize, setTileSize] = useState();
	const [count, setCount] = useState();
	const [width, height] = useWindowDimension();
	const [tokens, setTokens] = useState({});
	const [albums, setAlbums] = useState([]);

	const REDIRECT_URI = "http://localhost:3000";
	const CLIENT_ID = "1667bd23e69245408998d6429c6b6949";
	const CLIENT_SECRET = "e44899b0f5114a64bd5bcecdb6036cf3";
	const API = "https://api.spotify.com/v1/";

	useEffect(() => {
		let newToken = window.localStorage.getItem("token");
		if (newToken) {
			let newRefreshToken = window.localStorage.getItem("refresh_token");
			setTokens({token: newToken, refreshToken: newRefreshToken});
		} else {
			let code;
			if (window.location.search.length > 0) { // set upon redirect back from Spotify login
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
		console.log("effect: spotifyAuth");
	}, []);

	useEffect(() => {
		if (tokens.token && albums.length === 0) {
			getSpotifyAlbums();
		}
	}, [tokens]);

	const getSpotifyAlbums = async () => {
		let responses = [];
		const limit = 50;
		let offset = 0;
		let theresMore = true;
		do {
			const {data} = await axios.get(API + `me/albums?limit=${limit}&offset=${offset}`, {
				headers: {
					Authorization: `Bearer ${tokens.token}`
				},
			}).catch(function (error) {
				if (error.response && error.response.status === 401) {
					console.log("refresh 401");
					callAuthApi("grant_type=refresh_token"
						+ `&refresh_token=${tokens.refreshToken}`
						+ `&client_id=${CLIENT_ID}`
					);
				}
			})
			console.log(data);
			responses.push(data);

			offset += limit;
			theresMore = offset < data.total;
		} while (theresMore);

		console.log(responses);

		// Parse response to general format
		let newAlbums = [];
		responses.forEach(data =>
			newAlbums = newAlbums.concat(data.items.map(item => ({
				name: item.album.name,
				artist: item.album.artists[0].name,
				art_url: item.album.images[0].url,
				release_date: item.album.release_date,
				id: item.album.id
			})))
		);
		console.log("NEW ALBUMS");
		console.log(newAlbums);
		setAlbums(newAlbums);
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
			console.log("success 200");
			console.log(data);
			if (data.access_token !== undefined) {
				window.localStorage.setItem("token", data.access_token);
			}
			if (data.refresh_token !== undefined) {
				window.localStorage.setItem("refresh_token", data.refresh_token);
			}
			setTokens({token: data.access_token, refreshToken: data.refresh_token});
		} else if (this.status === 401) {
			console.log("refresh 401");
			callAuthApi("grant_type=refresh_token"
				+ `&refresh_token=${tokens.refreshToken}`
				+ `&client_id=${CLIENT_ID}`
			);
		} else {
			console.log("bad response");
			console.log(this.responseText);
			alert(this.responseText);
		}
	}

	useEffect(() => {
		setTileSize(height / rows);
		setCount(Math.floor(width / (height / rows)) * rows);
		console.log("effect: resize/rows");
	}, [rows, width, height]);

	return (
		<div className="App">
			<TopBar tokens={tokens} setTokens={setTokens} clientId={CLIENT_ID} clientSecret={CLIENT_SECRET} />
			<ArtGrid albums={albums} tileSize={tileSize} count={count} />
		</div>
	);
}

export default App;
