function FillerIcons({ icon }) {

	const iconCount = 32;

	return (
		<div className="filler-icons">
			{ [...Array(iconCount)].map((e,i) =>
				<div><h1><i className={`fa-solid fa-${icon}`}></i></h1></div>
			)}
		</div>
	);
}

export default FillerIcons;