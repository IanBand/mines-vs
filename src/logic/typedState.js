// multiplayer minesweeper board state
import seedrandom from 'seedrandom';
import Tile from '@/logic/tile.js';
import {p1,p2} from '@/logic/const.js';


// for debugging https://nielsleenheer.com/articles/2017/the-case-for-console-hex/
console.hex = (d) => console.log((Object(d).buffer instanceof ArrayBuffer ? new Uint8Array(d.buffer) : 
typeof d === 'string' ? (new TextEncoder('utf-8')).encode(d) : 
new Uint8ClampedArray(d)).reduce((p, c, i, a) => p + (i % 16 === 0 ? i.toString(16).padStart(6, 0) + '  ' : ' ') + 
c.toString(16).padStart(2, 0) + (i === a.length - 1 || i % 16 === 15 ? 
' '.repeat((15 - i % 16) * 3) + Array.from(a).splice(i - i % 16, 16).reduce((r, v) => 
r + (v > 31 && v < 127 || v > 159 ? String.fromCharCode(v) : '.'), '  ') + '\n' : ''), ''));

// https://stackoverflow.com/questions/38381317/javascript-multidimensional-typed-array-int8array-example
// only copy typed array when the state actually updates


// fit tile render data into 1 byte
// tile bitmasks
// tile data needed to render the tile must be efficently stored to be passed to renderer
const value    = 0b00000111; // bits 0 - 2 (8 values)
const revealed = 0b00001000; // bit 3 (0 = covered)
const isMine   = 0b00010000; // bit 4 (0 = safe)
const flagged  = 0b00100000; // bit 5 (0 = not flagged)
const owner    = 0b11000000; // bits 6 - 7 (00 = no owner, 01 = p1, 10 = p2, 11 = unused)

// fit tile multiplayer data into 32 bits
const originX  = 0b00000000000000000000000001111111; // bits 0  - 6  max x dimensions are 2^7 = 128
const originY  = 0b00000000000000000011111110000000; // bits 7  - 13 max y dimensions are 2^7 = 128
const islandId = 0b00001111111111111100000000000000; // bits 14 - 27 max number of islands are 2^14 = 16384 (probably an overestimation)
const ppp      = 0b00110000000000000000000000000000; // bits 28 - 29 (00 = no owner, 01 = p1, 10 = p2, 11 = unused)
const checked  = 0b01000000000000000000000000000000; // bit 30
// bit 31 unused

export default class State{
    /**
     * @param {Number} height height of the board
     * @param {Number} width width of the board
     * @param {Number} mines nimber of mines to be placed on the board
     * @param {Any} seed seed for RNG
     * @param {Boolean} real flag to place mines and numbers
     */
    constructor(height, width, mines, seed, real){
        this.width = width;
        this.height = height;
        this.mines = mines;
        this.rng = seedrandom(`${seed}${mines}${height}${width}`);
        this.uncoveredSafeTiles = 0;
        //this.mineList = [];
        
        // allocate board
        this.board = new Uint8Array(this.height * this.width);
        this.boardMetadata = new Uint32Array(this.height * this.width);

        // init metadata objects
        for(let i = 0; i < this.width; ++i){
            this.board.push([]);
            for(let j = 0; j < this.height; ++j){
                this.board[i].push([]);
                this.board[i][j] = new Tile();
            }
        }

        // init board
        if(real){
            this.placeMines();
            this.placeNumbersOverArea(0,0,this.width,this.height);
        }
    }
    revealPoints(i,j,owner, originX, originY){
        const target = this.board[i + j * this.width];
        let points = 0;

        //check if tile is revealed or flagged
        if(target.revealed || target.flagged) return 0;

        //reveal tile
        target.revealed = true;
        target.owner = owner;
        target.origin = {x: originX, y: originY};
        points += target.value;

        //return early & penalize if mine
        if(target.isMine){
            // mine penalty will need balancing
            // cut points in half?
            // lose points based on mine value?  
            points -= 2 * target.value;
            return points;
        }else{
            this.uncoveredSafeTiles++;
        }

        //check win condition
        if(this.clear) return points;

        //if tile is a zero, recurse over all neighbors
        if(target.value === 0){
            this.neighbors(i,j).forEach( ({x,y}) => {
                points += this.revealPoints(x,y, owner, originX, originY);
            });
        }

        // tile is a nonzero value 
        return points;
    }
    placeMines(){
        let n = this.mines, x, y, target;

        while(n > 0){
            x = Math.floor(this.rng() * this.width  );
            y = Math.floor(this.rng() * this.height );
            

            target = this.board[i + j * this.width];

            //if no mine already at x,y
            if(!target.isMine){
                target.isMine = true;
                target.value = 9;
                //this.mineList.push({x,y});
                --n;
            }
        }
        /*this.mineList.sort((a,b) => {
            if(a.x > b.x) return 1;
            if(a.x < b.x) return -1;
            if(a.y > b.y) return 1;
            return -1; 
        });
        */
        //console.log(this.mineList);
    }
    /**
     * Calculates tile values based on the number of surrounding mines.
     * Values are only calculated for tiles within the rectangle defined by the
     * two points (x1,y1) and (x2,y2).
     * 
     * @param {Number} x1 lower x coordinate of rectangle to place numbers over
     * @param {Number} y1 lower y coordinate of rectangle to place numbers over
     * @param {Number} x2  upper x coordinate of rectangle to place numbers over
     * @param {Number} y2  upper x coordinate of rectangle to place numbers over
     */
    placeNumbersOverArea(x1, y1, x2, y2){
        //console.log(`placing numbers from [ (${x1},${y1}) to (${x2},${y2}) )`);
        for(let i = x1; i < x2; ++i){
            for(let j = y1; j < y2; ++j){

                

                this.board[i + j * this.width].value = 0;
                this.neighbors(i,j).forEach( ({x,y}) => {
                    if(this.board[x + y * this.width].isMine) this.board[i + j * this.width].value++
                });

                //if(i == 15 && j == 7) console.log(this.board[i + j * this.width].value)
                //TODO: turn these into tests

                //if(this.neighbors(i,j).length < 3) console.log(i,j)

                /*                
                console.hex(this.board[i + j * this.width].byteRepresentation());
                console.log(this.board[i + j * this.width]);
                this.board[i + j * this.width].loadFromByte(this.board[i + j * this.width].byteRepresentation());
                console.hex(this.board[i + j * this.width].byteRepresentation());
                console.hex(this.board[i + j * this.width]);
                console.log('=======================');
                */
            }
        }
    }
    placePpp(){
        const rand = this.rng() > 0.5 ? 0 : 1;
        for(let i = 0; i < this.width; ++i){
            for(let j = 0; j < this.height; ++j){
                // assign random ppp. there are better ways to do this, this will do for now
                // all members with the same islandId must have the same ppp
                if(this.board[i + j * this.width].value == 0){
                    this.board[i + j * this.width].ppp = (rand + this.board[i + j * this.width].islandId) % 2 == 0 ? p1 : p2;
                }
                else{
                    this.board[i + j * this.width].ppp = this.rng() > 0.5 ? p1 : p2;
                }
                
            }
        }
    }
    /**
     * Reclaims ownership of all tiles that share an origin click as the tile at (x,y)
     * Used for keeping two clients states in sync, after ownership has been determined by the method's caller.
     * 
     * @param {String} newOwner name of new owner
     * @param {Number} x coordinate
     * @param {Number} y coordiante
     */
    reclaimTiles(newOwner, x, y){

        const originTile = this.board[x + y * this.width];

        // case 1: tile at x,y is nonzero valued tile or mine
        if(originTile.value != 0 || originTile.isMine){
            
            // just reclaim it, i.e. set new owner
            console.log('reclaiming a nonzero tile @',x,y);
            originTile.owner = newOwner;
            return originTile.value; // return point value
        }
        // case 2: a zero tile...
        if(originTile.value == 0){
            console.log('reclaiming a zero tile @',x,y);
            // you're finding the click that you made with the same island id as the incoming zero click,
            // and actually uncoveered tiles. lets call it UsrClick0
            // then you're reclaiming all the tiles whos origin is UsrClick0
        
            // 1. get island id associated with {x,y}
            // 2. get origin click associated with any tile with that island id
            
            const origin = originTile.origin;
            let points = 0;
            // 3. reclaim all tiles (and their points) with the same origin click
            for(let i = 0; i < this.width; ++i){  
                for(let j = 0; j < this.height; ++j){
                    const target = this.board[i + j * this.width];
                    if(
                        target.origin.x == originTile.origin.x && 
                        target.origin.y == originTile.origin.y
                    ){
                        points += target.points;
                        target.owner = newOwner;
                    }
                }
            }
            return points;
        }
    }
    
    
    /**
     * Forces the tile at (i,j) to have a zero value, while preserving the validity of the board and the number of mines. 
     * @param {Number} i x coordinate of tile that will be zero
     * @param {Number} j y coordinate of tile that will be zero
     */
    forceZeroAt(i,j){
        let mines = this.board[i + j * this.width].value;
        //if( mines == 0) return;


        console.log('forcing zero at ',i,j);
        // clear mines from (i,j) and it's neighbors
        this.board[i + j * this.width].isMine = false;
        this.board[i + j * this.width].value = 0;
        this.neighbors(i,j).forEach( ({x,y}) => {
            this.board[x + y * this.width].isMine = false;
            //this.board[x + y * this.width].value = 0;
        });

        // replace mines
        let newMines = []; //[{x:i,y:j}];//.concat(targetNeighbors)  // always need to replace numbers at (i,j) and its neighbors
        let a, b;
        while(mines > 0){
            a = Math.floor(this.rng() * this.width  );
            b = Math.floor(this.rng() * this.height );

            //console.log(a,b);
            const target = this.board[a][b];
            
            if(
                !target.isMine &&          // no mine already at x,y
                !(a == i && b == j) &&     // target is not origin
                this.neighbors(i,j).every( // (a,b) is not a neighbor of origin
                    ({x,y}) => 
                    !(a == x && b == y) 
            )){
                target.isMine = true;
                target.value = 9;
                newMines.push({x:a,y:b});
                --mines;
            }
        }

        // recalc a radius 1 square around newly placed mines
        newMines.forEach(({x,y}) => {
            const nc = this.normalizeRectangle(x - 1, y - 1, x + 1, y + 1);
            this.placeNumbersOverArea(nc.x1, nc.y1, nc.x2 + 1, nc.y2 + 1);
        });

        const nc = this.normalizeRectangle(i - 2, j - 2, i + 2, j + 2);
        this.placeNumbersOverArea(nc.x1, nc.y1, nc.x2 + 1, nc.y2 + 1);

        // recalc a radius 3 square around first click
    }
    /**
     * returns an array of coordinates of the neighbors of the tile at (x,y)
     * @param {Number} x x coordinate of tile whos neighbors will be returned
     * @param {Number} y y coordinate of tile whos neighbors will be returned
     */
    neighbors(x,y) {
        const h = this.height, w = this.width;
        const neighbors = [
            {x:x+1, y},
            {x, y:y+1},
            {x:x-1, y},
            {x, y:y-1},
            {x:x+1, y:y+1},
            {x:x+1, y:y-1},
            {x:x-1, y:y+1},
            {x:x-1, y:y-1}
        ]
        return neighbors.filter( n => !(
            n.x == w  ||
            n.x < 0   ||
            n.y == h  ||
            n.y < 0  
        ));
    }
    normalizeRectangle(x1,y1,x2,y2){
        if(x1 < 0) x1 = 0;
        if(x1 >= this.width) x1 = this.width - 1;

        if(y1 < 0) y1 = 0;
        if(y1 >= this.height) y1 = this.height - 1;

        if(x2 < 0) x2 = 0;
        if(x2 >= this.width) x2 = this.width - 1;

        if(y2 < 0) y2 = 0;
        if(y2 >= this.height) y2 = this.height - 1;
    
        //console.log(x1,y1,x2,y2);
        return {x1,y1,x2,y2};
    }
    /*
     * clear status of the board; returns true when all mines have been uncovered
     */
    get clear(){
        // area - uncovered == mines
        return (this.height * this.width) - this.uncoveredSafeTiles === this.mines;
    }

    /*
     * 
     */
    placeIslandIds(){
        let id = 0;
        for(let i = 0; i < this.width; ++i){
            for(let j = 0; j < this.height; ++j){
                const target = this.board[i + j * this.width];
                if(target.value == 0 && target.checked == false){
                    this.markIslandRecursive(i, j, id);
                } 
                else if(target.value != 0){
                    target.islandId = id;
                    target.checked = true;
                }
                id++;
            }
        }
    }
    /**
     * helper function for placeIslandIds(). Recursively finds contiguous zero-valued 
     * neighbor tiles of the tile at (i,j), and sets their islandId field to id
     * @param {Number} i x coordinate
     * @param {Number} j y coordinate
     * @param {Number} id id that will be assigned to the island
     */
    markIslandRecursive(i, j, id){
        const target = this.board[i + j * this.width];
        if (target.checked) return;
        target.checked = true;
        target.islandId = id;

        this.neighbors(i,j).forEach( ({x,y}) => {
            if(this.board[x + y * this.width].value == 0 && this.board[x + y * this.width].checked == false){
                this.markIslandRecursive(x, y, id);
            }
        });
    }
    uncheckAll(){
        for(let i = 0; i < width; ++i){
            for(let j = 0; j < height; ++j){
                this.board[i + j * this.width].checked = false;
            }
        }
    }


}