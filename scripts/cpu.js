/*
      ____________________________
     /                           /\
    /   CHIP- 8 Specifications _/ /\
   /     David Camacho         / \
  /                           /\
 /___________________________/ /
 \___________________________\/
  \ \ \ \ \ \ \ \ \ \ \ \ \ \ \
______________________________________
4KBs of Memory (4096 Bytes)
16 8-bit registers
One 16-bit register that is used to store memory addresses
One delay timer
One sound timer
Program counter to store address currently being executed
Array to represent stack
Var for pause state of emulator + exec speed of emulator
*/

class CPU {
    constructor(render, keyboard, speaker) {
        this.renderer = renderer;
        this.keyboard = keyboard;
        this.speaker = speaker;

        this.memory = new Uint8Array(4096); //Memory
        this.v = new Uint8Array(16); //8-bit Registers
        this.i = 0; //Memory addresses
        this.delayTimer = 0;
        this.soundTimer = 0;
        this.pc = 0x200; //Program Counter to keep track of current address executed
        this.stack = new Array();

        this.paused = false; //necessary for later instructions
        this.speed = 10;
    }

    /*
    Chip-8 sprites may be up to 15 bytes, for a possible sprite size of 8x15.
    Programs may also refer to a group of sprites representing the hexadecimal digits 0 through F.
    These sprites are 5 bytes long, or 8x5 pixels.
    The data should be stored in the interpreter area of Chip-8 memory (0x000 to 0x1FF).
    Listing of character's sprites can be found in Section 2.3 of --> http://devernay.free.fr/hacks/chip8/C8TECH10.HTM#2.2
    */
    loadSpritesIntoMemory() {
        const sprites = [
            0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
            0x20, 0x60, 0x20, 0x20, 0x70, // 1
            0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
            0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
            0x90, 0x90, 0xF0, 0x10, 0x10, // 4
            0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
            0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
            0xF0, 0x10, 0x20, 0x40, 0x40, // 7
            0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
            0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
            0xF0, 0x90, 0xF0, 0x90, 0x90, // A
            0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
            0xF0, 0x80, 0x80, 0x80, 0xF0, // C
            0xE0, 0x90, 0x90, 0x90, 0xE0, // D
            0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
            0xF0, 0x80, 0xF0, 0x80, 0x80  // F
        ];

        // Sprites are stored in the interpreter section of memory starting at hex 0x000
        // Loops through each byte in sprites array to be stored in memory
        for (let i = 0; i < sprites.length; i++) {
            this.memory[i] = sprites[i];
        }
    }

    //Loads ROM data into memory by looping through it starting at location 0x200 as per the Chip-8 documentation
    loadProgramIntoMemory(program) {
        for (let loc = 0; loc < program.length; loc++) {
            this.memory[0x200 + loc] = program[loc];
        }
    }

    //Loads the ROM itself by grabbing the ROM from the roms folder.
    //Feel free to add you own ROM dumps :D
    loadRom(romName) {
        var request = new XMLHttpRequest;
        var self = this;
    
        // Handles the response received from sending (request.send()) our request
        request.onload = function() {
            // If the request response has content
            if (request.response) {
                // Store the contents of the response in an 8-bit array
                let program = new Uint8Array(request.response);
    
                // Load the ROM/program into memory
                self.loadProgramIntoMemory(program);
            }
        }
    
        // Initialize a GET request to retrieve the ROM from our roms folder
        request.open('GET', 'roms/' + romName);
        request.responseType = 'arraybuffer';
    
        // Send the GET request
        request.send();
    }

    /*CPU cycle handles the execution of instructions
    All instruction opcodes in section 3.1
    "All instructions are 2 bytes long and are stored most-significant-byte first." */
    cycle() {
        for (let i = 0; i < this.speed; i++) {
            if (!this.paused) {
                //First half of opcode     Second half of opcode
                let opcode = (this.memory[this.pc] << 8 | this.memory[this.pc + 1]);
                this.executeInstruction(opcode);
            }
        }
        if (!this.paused) {
            this.updateTimers();
        }

        this.playSound();
        this.renderer.render();
    }

    /* Section 2.5 --> 
    The delay timer is active whenever the delay timer register (DT) is non-zero. This timer does nothing more than 
    subtract 1 from the value of DT at a rate of 60Hz. When DT reaches 0, it deactivates.
    The sound timer is active whenever the sound timer register (ST) is non-zero.
    This timer also decrements at a rate of 60Hz, however, as long as ST's value is greater than zero, 
    the Chip-8 buzzer will sound. When ST reaches zero, the sound timer deactivates.
    */
    updateTimers() {
        if (this.delayTimer > 0) {
            this.delayTimer -= 1;
        }

        if (this.soundTimer > 0) {
            this.soundTimer -= 1;
        }
    }

    playSound() {
        if (this.soundTimer > 0) {
            this.speaker.play(440);
        } else {
            this.speaker.stop();
        }
    }

    executeInstruction(opcode) {
        // Each instruction is 2 bytes long, so increment pc by 2 for each instruction.
        this.pc += 2;

        //grabs second nibble 
        let x = (opcode & 0x0F00) >> 8;

        //grabs third nibble
        let y = (opcode & 0x00F0) >> 4;

        switch (opcode & 0xF000) {

            //Clear the display.
            case 0x0000:
                switch (opcode) {
                    case 0x00E0:
                        this.renderer.clear();
                        break;
                    case 0x00EE:
                        this.pc = this.stack.pop();
                        break;
                }

                break;
            //Return from a subroutine. by setting pc to address at the top of the stack
            case 0x1000:
                this.pc = (opcode & 0xFFF);
                break;

            //Jump to location nnn by setting pc to value stored in nnn
            case 0x2000:
                this.stack.push(this.pc);
                this.pc = (opcode & 0xFFF);
                break;

           // Skip next instruction if Vx = kk.
            case 0x3000:
                if (this.v[x] === (opcode & 0xFF)) {
                    this.pc += 2;
                }
                break;

            //Skip next instruction if Vx != kk.
            case 0x4000:
                if (this.v[x] !== (opcode & 0xFF)) {
                    this.pc += 2;
                }
                break;
            // Skip next instruction if Vx = Vy.
            case 0x5000:
                if (this.v[x] === this.v[y]) {
                    this.pc += 2;
                }
                break;

            // Set Vx = kk.
            case 0x6000:
                this.v[x] = (opcode & 0xFF);
                break;
            // Set Vx = Vx + kk.
            case 0x7000:
                this.v[x] += (opcode & 0xFF);
                break;

            // Set Vx = Vy.
            case 0x8000:
                switch (opcode & 0xF) {
                    case 0x0:
                        this.v[x] = this.v[y];
                        break;

                    //Set Vx to the value of Vx OR Vy.
                    case 0x1:
                        this.v[x] |= this.v[y]
                        break;
                    //Set Vx equal to the value of Vx AND Vy.
                    case 0x2:
                        this.v[x] &= this.v[y];
                        break;
                    //Set Vx equal to the value of Vx XOR Vy.
                    case 0x3:
                        this.v[x] ^= this.v[y];
                        break;
                    /* Sets Vx to Vx + Vy
                    "If the result is greater than 8 bits (i.e., > 255,) VF is set to 1, 
                    otherwise 0. Only the lowest 8 bits of the result are kept, and stored in Vx."
                    */
                    case 0x4:
                        let sum = (this.v[x] += this.v[y]);

                        this.v[0xF] = 0;

                        if (sum > 0xFF) {
                            this.v[0xF] = 1;
                        }

                        this.v[x] = sum;
                        break;

                    //Subtracts Vy from Vx
                    case 0x5:
                        this.v[0xF] = 0;

                        if (this.v[x] > this.v[y]) {
                            this.v[0xF] = 1;
                        }

                        this.v[x] -= this.v[y];
                        break;
                    //Tetermine the least-significant bit and set VF accordingly.
                    case 0x6:
                        this.v[0xF] = (this.v[x] & 0x1);

                        this.v[x] >>= 1;
                        break;
                    //Subtracts Vx from Vy and stores the result in Vx. If Vy is larger then Vx, we need to store 1 in VF, otherwise we store 0.
                    case 0x7:
                        this.v[0xF] = 0;

                        if (this.v[y] > this.v[x]) {
                            this.v[0xF] = 1;
                        }

                        this.v[x] = this.v[y] - this.v[x];
                        break;
                    //Shifts Vx left 1, and sets VF to either 0 or 1.
                    case 0xE:
                        this.v[0xF] = (this.v[x] & 0x80);
                        this.v[x] <<= 1;
                        break;
                }

                break;
            //Increments the program counter by 2 if Vx and Vy are not equal.
            case 0x9000:
                if (this.v[x] !== this.v[y]) {
                    this.pc += 2;
                }
                break;
            //Set the value of register i to nnn
            case 0xA000:
                this.i = (opcode & 0xFFF);
                break;
            //Set the program counter to nnn plus the value of register 0 
            case 0xB000:
                this.pc = (opcode & 0xFFF) + this.v[0];
                break;
            //Generate a random number in the range 0-255 and then AND that with the lowest byte of the opcode.
            case 0xC000:
                let rand = Math.floor(Math.random() * 0xFF);

                this.v[x] = rand & (opcode & 0xFF);
                break;
            
            //Handles the drawing and erasing of pixels on the screen
            /*  Sprite layout example:
                11110000
                10010000
                10010000
                10010000
                11110000
            */
            case 0xD000:
                let width = 8; //8 pixels wide per sprite
                let height = (opcode & 0xF);

                this.v[0xF] = 0; //Set to 1 if pixel is erased later

                for (let row = 0; row < height; row++) {
                    let sprite = this.memory[this.i + row];

                    for (let col = 0; col < width; col++) {
                        // If the bit (sprite) is not 0, render/erase the pixel
                        if ((sprite & 0x80) > 0) {
                            // If setPixel returns 1, which means a pixel was erased, set VF to 1
                            if (this.renderer.setPixel(this.v[x] + col, this.v[y] + row)) {
                                this.v[0xF] = 1;
                            }
                        }

                        // Shift the sprite left 1. This will move the next next col/bit of the sprite into the first position.
                        // Ex. 10010000 << 1 will become 0010000
                        sprite <<= 1;
                    }
                }
                break;
           
            case 0xE000:
                switch (opcode & 0xFF) {
                    //Skips the next instruction if the key stored in Vx is pressed, by incrementing the program counter by 2
                    case 0x9E:
                        if (this.keyboard.isKeyPressed(this.v[x])) {
                            this.pc += 2;
                        }
                        break;
                    // If the specified key is not pressed, skip the next instruction.
                    case 0xA1:
                        if (!this.keyboard.isKeyPressed(this.v[x])) {
                            this.pc += 2;
                        }
                        break;
                }

                break;
            
            case 0xF000:
                switch (opcode & 0xFF) {
                    //We're just setting Vx to the value stored in delayTimer.
                    case 0x07:
                        this.v[x] = this.delayTimer;
                        break;
                    //Pauses the emulator until a key is pressed
                    case 0x0A:
                        this.paused = true;

                        this.keyboard.onNextKeyPress = function (key) {
                            this.v[x] = key;
                            this.paused = false;
                        }.bind(this);
                        break;
                    // Sets the value of the delay timer to the value stored in register Vx
                    case 0x15:
                        this.delayTimer = this.v[x];
                        break;
                    // Sets the sound timer to Vx instead of the delay timer.
                    case 0x18:
                        this.soundTimer = this.v[x];
                        break;
                    // Add Vx to I.
                    case 0x1E:
                        this.i += this.v[x];
                        break;
                    // Setting I to the location of the sprite at Vx
                    case 0x29:
                        this.i = this.v[x] * 5;
                        break;

                    //Grab the hundreds, tens, and ones digit from register Vx and store them in registers I, I+1, and I+2 respectively
                    case 0x33:
                        // Get the hundreds digit and place it in I.
                        this.memory[this.i] = parseInt(this.v[x] / 100);

                        // Get tens digit and place it in I+1. Gets a value between 0 and 99, then divides by 10 to give us a value
                        // between 0 and 9.
                        this.memory[this.i + 1] = parseInt((this.v[x] % 100) / 10);

                        // Get the value of the ones (last) digit and place it in I+2. 0 through 9.
                        this.memory[this.i + 2] = parseInt(this.v[x] % 10);
                        break;
                    // looping through registers V0 through Vx and storing its value in memory starting at I
                    case 0x55:
                        for (let registerIndex = 0; registerIndex <= x; registerIndex++) {
                            this.memory[this.i + registerIndex] = this.v[registerIndex];
                        }
                        break;
                    // Reads values from memory starting at I and stores them in registers V0 through Vx.
                    case 0x65:
                        for (let registerIndex = 0; registerIndex <= x; registerIndex++) {
                            this.v[registerIndex] = this.memory[this.i + registerIndex];
                        }
                        break;
                }

                break;

            default:
                throw new Error('Unknown opcode ' + opcode);
        }
    }


}

export default CPU;
