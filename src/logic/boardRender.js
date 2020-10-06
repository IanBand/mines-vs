/* LEGACY BOARD RENDER CLASS */

// renders minesweeper state on canvas
// handles baseline canvas click functionality
import {p1, p2} from '@/logic/const.js';

const theme = {
    border: '#808080',
    background1: '#c0c0c0',
    background2: '#c8c8c8',
    p1Background1: '#dfc0c0',
    p1Background2: '#dfc8c8',
    p2Background1: '#c0c0df',
    p2Background2: '#c8c8df',
    cover1: '#474798',
    cover2: '#5050a5',
    coverBorder: '#383868',
    revealFlagCover1: '#8484AC', //'#2c2c8a',
    revealFlagCover2: '#8C8CB7', //'#30309c',
    p1FlagFill: '#e0345f',
    p1FlagStroke: '#ab1a3e',
    p2FlagFill: '#34c6e0', 
    p2FlagStroke: '#239dc2',
    _1: '#0000f0',
    _2: '#008000',
    _3: '#f00000',
    _4: '#000080',
    _5: '#800000',
    _6: '#008080',
    _7: '#000000',
    _8: '#808080',
    _9: '#808000',
    hover: '#ffffff30',
    enimyHover: '#00000030',
    mine: '#000000'
}

// flag triangle constants
const scale = 0.65; // ratio of triangle sidelength to tile sidelength 
const r3o2 = 0.86602540378; // sqrt(3) / 2. height of equalateral triangle
const x_off = (1 - scale * r3o2) * 0.5;

function xor(a,b) {
    return ( a ? 1 : 0 ) ^ ( b ? 1 : 0 );
}
// could also do a != b;

export default class BoardRender{
    constructor(canvasRef, gameState, px, real, versus){
        this.real = real;
        this.versus = versus;
        this.state = gameState;
        this.px = px;
        this.canvas = canvasRef;
        this.ctx = this.canvas.getContext('2d');
        this.canvas.height = px * this.state.height;
        this.canvas.width  = px * this.state.width;

        // this text setting really only works with 30px tiles, need to make it scalable or at least have 3 or 4 predetermined styles
        this.ctx.lineWidth = 1;
        this.ctx.font = `${px * .6}px Impact`;
        this.ctx.textAlign = 'center';
        
        
        this.drawAll();
        
        //this.drawPpp(p2);
    }
    oob(x,y){ 
        return x >= this.state.width || x < 0 || y >= this.state.height || y < 0;  
    }
    drawAll(){
        const ctx = this.ctx;
        const state = this.state;
        const px = this.px;

        for(let i = 0; i < state.width; ++i){
            for(let j = 0; j < state.height; ++j){
                this.drawTileState(i,j);
            }
        }
    }
    drawTileState(i,j){
        //TODO: break into drawValue(x,y,n), drawMine(x,y), drawCover(x,y)
        if(this.oob(i,j)) return;

        this.ctx.beginPath();
        this.ctx.rect(i * this.px, j * this.px, this.px, this.px);

        if(!this.state.board[i][j].revealed){
            this.drawCover(i,j);

            if(this.state.board[i][j].flagged){
                this.drawFlag(i,j);
            }
        
        }else{
            this.drawBackground(i,j);

            if(this.state.board[i][j].isMine){
                this.drawMine(i, j);
            }else{
                this.drawValue(i, j, this.state.board[i][j].value);
            }
        }
    }
    drawBackground(x,y){
        const light = xor( x % 2 == 0, y % 2 == 0);

        // draw revealed cell
        if(this.versus && this.state.board[x][y].owner == p1){
            this.ctx.fillStyle = light ? theme.p1Background1 : theme.p1Background2;
        }
        else if(this.versus && this.state.board[x][y].owner == p2){
            this.ctx.fillStyle = light ? theme.p2Background1 : theme.p2Background2;
        }
        else{
            this.ctx.fillStyle = light ? theme.background1 : theme.background2;
        }
        this.ctx.strokeStyle = this.ctx.fillStyle;

        //this.ctx.filter = 'blur(1px)';
        this.ctx.fill();
        this.ctx.stroke();
        //this.ctx.filter = 'none';
    }
    drawFlag(x,y){
        const target = this.state.board[x][y];
        const ctx = this.ctx;
        const px = this.px;

        // use p1 flag colors for singleplayer
        ctx.fillStyle   = this.versus && target.owner == p2 ? theme.p2FlagFill   : theme.p1FlagFill;
        ctx.strokeStyle = this.versus && target.owner == p2 ? theme.p2FlagStroke : theme.p1FlagStroke;
        ctx.lineWidth = 2;
        ctx.beginPath();

        ctx.moveTo( (x + x_off) * px ,     (  y + (1 - scale) * 0.5) * px ); // top left triangle point
        ctx.lineTo( (x + x_off) * px ,     ( (y + 1 - (1 - scale) * 0.5)) * px ); // bottom left triangle point
        ctx.lineTo( (x + 1 - x_off) * px , ( y + 0.5) * px ); // right triangle point
        ctx.lineTo( (x + x_off) * px ,     ( y + (1 - scale) * 0.5) * px ); // back to origin
        ctx.lineTo( (x + x_off) * px ,     ( y + 0.5) * px ); // go halfway down to properly get corner of stroke 

        ctx.fill();
        ctx.stroke();

        ctx.lineWidth = 1;
    }
    drawValue(x,y,n){
        this.ctx.fillStyle = theme['_' + n];
        this.ctx.fillText(n, (x + 0.5) * this.px, (y + 0.5) * this.px + 7);
    } 
    drawMine(x,y){
        //draw mine
        this.ctx.beginPath();
        this.ctx.fillStyle = theme.mine;
        //this.ctx.lineWidth = 0;
        this.ctx.arc(
            (x + 0.5) * this.px, 
            (y + 0.5) * this.px, 
            this.px * 0.25, 
            0, 
            2 * Math.PI);
        this.ctx.fill();
    }
    drawCover(x,y){
        const ctx = this.ctx;
        const light = xor( x % 2 == 0, y % 2 == 0);
        const px = this.px;
        //draw covered cell
        ctx.strokeStyle = light ? theme.cover1 : theme.cover2;
        ctx.fillStyle = ctx.strokeStyle;
        ctx.fill();
        ctx.stroke();

        
        
        //draw edges based on empty neighbors
        //logic is fine, drawing lines is glitchy without blur... perhapse rewrite on a new thread or something
        
        ctx.beginPath();
        this.ctx.filter = 'blur(2px)';
        ctx.strokeStyle = theme.coverBorder;
        ctx.lineWidth = 2;
        if(x + 1 < this.state.height && this.state.board[x + 1][y].revealed){
            //draw east (x) boarder
            ctx.moveTo((x + 1) * px, y * px);
            ctx.lineTo((x + 1) * px, (y + 1) * px);
        }
        if(x - 1 > 0 && this.state.board[x - 1][y].revealed){
            //draw west boarder
            ctx.moveTo(x * px, y * px);
            ctx.lineTo(x * px, (y + 1) * px);
        }
        if(y + 1 < this.state.height && this.state.board[x][y + 1].revealed){
            //draw north boarder
            ctx.moveTo((x + 1) * px, (y + 1) * px);
            ctx.lineTo(x * px,       (y + 1) * px);
        }
        if(y - 1 > 0 && this.state.board[x][y - 1].revealed){
            //draw south boarder
            ctx.moveTo((x + 1) * px, y * px);
            ctx.lineTo(x * px,       y * px);
        }
        ctx.stroke();
        ctx.lineWidth = 1;
        this.ctx.filter = 'none';
        
        
    }
    highlight(x,y){
        if(this.oob(x,y)) return;
        const target = this.state.board[x][y];
        const ctx = this.ctx, px = this.px;
        if(!target.revealed || !(target.value == 0 || target.isMine)){
            ctx.beginPath();
            ctx.fillStyle = theme.hover;
            ctx.strokeStyle = ctx.fillStyle;
            ctx.rect(x * px, y * px, px, px);
            ctx.fill();
            ctx.stroke();
        }
    }
    anticipateReveal(x,y){
        if(this.oob(x,y)) return;

        const light = xor( x % 2 == 0, y % 2 == 0);
        const target = this.state.board[x][y];
        const ctx = this.ctx, px = this.px;
        if(!target.revealed){
            ctx.beginPath();

            if(target.flagged) ctx.fillStyle = light ? theme.revealFlagCover1 : theme.revealFlagCover2;
            else               ctx.fillStyle = light ? theme.background1      : theme.background2;

            ctx.strokeStyle = ctx.fillStyle;
            ctx.rect(x * px, y * px, px, px);
            ctx.fill();
            ctx.stroke();

            if(target.flagged) this.drawFlag(x,y);
        }
    }
    anticipateChord(x,y){
        if(this.oob(x, y)) return;
        this.anticipateReveal(x, y);
        for( let {x,y} of this.state.neighbors(x, y)){
            if(!this.state.board[x][y].revealed){
                this.anticipateReveal(x,y);
            }
        }
    }
    // debug drawings
    drawPpp(player){
        const ctx = this.ctx;
        const state = this.state;
        const px = this.px;
        


        for(let i = 0; i < state.width; ++i){
            for(let j = 0; j < state.height; ++j){
                const light = xor( i % 2 == 0, j % 2 == 0);
                const target = this.state.board[i][j];
                if(target.ppp == player){
                    this.ctx.fillStyle = light ? theme.p1Background1 : theme.p1Background2;
                }
                else{
                    this.ctx.fillStyle = light ? theme.p2Background1 : theme.p2Background2;
                }
                ctx.strokeStyle = ctx.fillStyle;
                ctx.beginPath();
                ctx.rect(i * this.px, j * this.px, this.px, this.px);
                ctx.fill();
                ctx.stroke();

                
                this.drawValue(i,j,target.value < 9 ? target.value : 0);
                if(target.isMine) this.drawMine(i,j);
                
            }
        }
    }
}