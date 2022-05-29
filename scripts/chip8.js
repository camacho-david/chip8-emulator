import Renderer from './renderer.js';
import Keyboard from './keyboard.js';
import Speaker from './speaker.js';
import CPU from './cpu.js';

const renderer = new Renderer(10);
const keyboard = new Keyboard();
const speaker = new Speaker();
const cpu = new CPU(renderer, keyboard, speaker);
 //When these registers are non-zero, they are automatically decremented at a rate of 60Hz. -Chip-8 Technical Reference


 let loop;

 let fps = 60, fpsInterval, startTime, now, then, elapsed;

 function init() {
	fpsInterval = 1000 / fps;
	then = Date.now();
	startTime = then;
    //TODO: remove renderer test code
    // renderer.testRenderer();
    // renderer.render();
    //END Testing code

	cpu.loadSpritesIntoMemory();
	cpu.loadRom('tetris');
	loop = requestAnimationFrame(step);
 }

 function step() {
	now = Date.now();
	elapsed = now - then;

	if (elapsed > fpsInterval) {
		cpu.cycle(); //One cpu clock cycle
	}

	loop = requestAnimationFrame(step);
}

init();