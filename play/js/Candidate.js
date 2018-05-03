function Candidate(config){

	var self = this;
	Draggable.call(self, config);

	// Passed properties
	self.id = config.id;
	self.size = 40;

	// GRAPHICS
	var _graphics = candidates[self.id];
	self.fill = _graphics.fill;

	if (preloadedImages[_graphics.img]) {
        self.img = preloadedImages[_graphics.img];
	} else {
        self.img = new Image();
        self.img.src = _graphics.img;
	}

	self.draw = function(ctx){

		// RETINA
		var x = self.x*2;
		var y = self.y*2;
		var size = self.size*2;

		// Draw image instead!
		ctx.drawImage(self.img, x-size/2, y-size/2, size, size);

	};

}
