'use strict';

let {init, Sprite, GameLoop} = kontra;

let {canvas, context} = init();

kontra.setImagePath('../gfx/');
kontra.initKeys();

let screenWidth = kontra.getCanvas().width;
let screenHeight = kontra.getCanvas().height;

kontra.load('player.png').then(_ => {
	let charsSheet = kontra.SpriteSheet({
		image: kontra.imageAssets.player,
		frameWidth: 18,
		frameHeight: 20,
		animations: {
			walk: {
				frames: '24..27',
				frameRate: 12,
			},
		},
	});
	let camera = {
		x: 0,
		y: 0,
	};
	let player = kontra.Sprite({
		x: screenWidth / 2,
		y: screenHeight / 2,
		width: 18,
		height: 20,
		movement_speed: 32,
		anchor: {
			x: 0.5,
			y: 0.5,
		},
		animations: charsSheet.animations,
		update: function(dt) {
			if (kontra.keyPressed('up')) {
				camera.y -= this.movement_speed * dt;
			}
			if (kontra.keyPressed('down')) {
				camera.y += this.movement_speed * dt;
			}
			if (kontra.keyPressed('left')) {
				camera.x -= this.movement_speed * dt;
			}
			if (kontra.keyPressed('right')) {
				camera.x += this.movement_speed * dt;
			}
			this.advance(dt);
		}
	});
	player.playAnimation('walk');
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
			for (let ty = 0; ty < this.width; ty += ts) {
				for (let tx = 0; tx < this.width; tx += ts) {
					let x = tx + camera.x;
					let y = ty + camera.y;
					let {h, s, l} = this.calc_ground_tile_color(x, y);
					this.context.fillStyle = `hsl(${h}, ${s}%, ${l}%)`;
					this.context.fillRect(tx, ty, ts, ts);
					this.context.strokeStyle = '#999';
					this.context.lineWidth = 1;
					this.context.strokeRect(tx, ty, ts, ts);
				}
			}
		}
	});

	let loop = GameLoop({
		update: function(dt) {
			ground.update(dt);
			player.update(dt);
		},
		render: function() {
			ground.render();
			player.render();
		},
	});

	loop.start();
})
