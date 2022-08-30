function LoadingSpinner({ albums }) {

	return (
		<>
			{ albums.length === 0 ?
			<div id="loading">
				<div>
					<h1><i className="fa-solid fa-compact-disc"></i></h1>
				</div>
			</div>
			: "" }
		</>
	);
}

export default LoadingSpinner;