window.Loader = {};
const preloadedImages = {};

Loader.load = function(imagePaths){
	if (!imagePaths.length) {
		Loader.onload();
	}

    imagePaths.forEach(function (ip) {
    	preloadedImages[ip] = null;
	});

	const _onAssetLoad = function (ip, img) {
		preloadedImages[ip] = img;

		const allLoaded = Object.keys(preloadedImages).every(function (ip) {
			return preloadedImages[ip] !== null;
        });

		if (allLoaded) {
            Loader.onload();
		}
    };

    imagePaths.forEach(function (ip) {
        const img = new Image();
        img.onload = function () { _onAssetLoad(ip, img) };
        img.src = ip;
	});

};
