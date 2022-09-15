function ResizeIndicator({ albums }) {

	return (
		<>
		{ albums.length > 0 ? (
			<div id="resizing">
				<h1>
					<i className="fa-solid fa-maximize"></i>
				</h1>
				<p>RESIZING</p>
			</div>
		) : ("")}
		</>
	);
}

export default ResizeIndicator;