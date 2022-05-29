//Renderer: Want graphics? This is your guy! Toggles pixels for the display to be rendered onto the initialized canvas.


class Renderer {
    constructor(scale) {
        //Origina Chip-8 dimensions
        this.cols = 64;
        this.rows = 32;
        this.scale = scale;

        //Scalining to modern display dimensions by grabbing the canvas, its context, and setting the w and h of the canvas
        this.canvas = document.querySelector('canvas');
        this.ctx = this.canvas.getContext('2d');

        this.canvas.width = this.cols * this.scale;
        this.canvas.height = this.rows * this.scale;
        //Array to represent the 2048 pixels
        this.diaplay = new Array(this.cols * this.rows);
    }

    /*
    Chip8 Technical Reference Description:
    The interpreter reads n bytes from memory, starting at the address stored in I. These bytes are then displayed as 
    sprites on screen at coordinates (Vx, Vy). Sprites are XORed onto the existing screen. If this causes any pixels 
    to be erased, VF is set to 1, otherwise it is set to 0. If the sprite is positioned so part of it is outside the 
    coordinates of the display, it wraps around to the opposite side of the screen. See instruction 8xy3 for more
    information on XOR, and section 2.4, Display, for more information on the Chip-8 screen and sprites.
    */ 

    //Switches pixel between on and off
    setPixel(x, y) {
        if (x > this.cols) {
            x -= this.cols;
        } else if (x < 0) {
            x += this.cols;
        }
        
        if (y > this.rows) {
            y -= this.rows;
        } else if (y < 0) {
            y += this.rows;
        }
        let pixelLoc = x + (y * this.cols); 

        //Sprites are XORed onto the existing screen. 
        //If this causes any pixels to be erased, VF is set to 1, otherwise it is set to 0
        this.display[pixelLoc] ^= 1;

        return !this.display[pixelLoc]; // True --> pixel erased, False --> otherwise
    }

    clear() {
        this.display = new Array(this.cols * this.rows);//Since our display is an array, this will initialize a new array --> clearing the display
    }

    render() {
        //display cleared ∀ render cycles (60 cycles per second)
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for (let i = 0; i < this.cols * this.rows; i++) {

            let x = (i % this.cols) * this.scale;
            let y = Math.floor(i / this.cols) * this.scale;

            //Draw a pixel if there belongs on at this value
            if (this.display[i]) {
                //Black pixel color
                this.ctx.fillStyle = '#000';
                this.ctx.fillRect(x, y, this.scale, this.scale);
            }
        }
    }
    //Dummy renderer for testing and debugging purposes
    testRenderer() {
        this.setPixel(0,0);
        this.setPixel(5,2);
    }
}
export default Renderer;
