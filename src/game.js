'use strict';

let {init, Sprite, GameLoop} = kontra;

let {canvas, context} = init();

let ground = Sprite({
	x: 0,
	y: 0,
	tile_size: 20,
	width: 640,
	height: 480,
	calc_ground_tile_color: function(x, y) {
		let sx = k => Math.sin(x * k);
		let sy = k => Math.cos(y * k);
		let h = 120 + 25 * (sx(1) * sy(1));
		let s = 100 - 7 * (sx(1.5) + sy(1.7)) / 2;
		let l = 45 + 2.5 * (sx(360) + sy(420)) / 2;
		return {h: h, s: s, l:l};
	},
	render: function() {
		let ts = this.tile_size;
		for (let y = 0; y < this.width; y += ts) {
			for (let x = 0; x < this.width; x += ts) {
				let {h, s, l} = this.calc_ground_tile_color(x, y);
				this.context.fillStyle = `hsl(${h}, ${s}%, ${l}%)`;
				this.context.fillRect(x, y, ts, ts);
				this.context.strokeStyle = '#999';
				this.context.lineWidth = 1;
				this.context.strokeRect(x, y, ts, ts);
			}
		}
	}
});

let loop = GameLoop({
	update: function() {
		ground.update();
	},
	render: function() {
		ground.render();
	},
});

loop.start(); 
