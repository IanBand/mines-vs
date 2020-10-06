import State from '@/logic/state';
import BoardRender from '@/logic/boardRender';
import MouseHandler from '@/logic/mouseHandler';

//import BoardRenderWorker from 'worker-loader!./boardRender.worker.js';
import BoardRenderWorker from '@/logic/boardRender.worker.js';


import {p1,p2} from '@/logic/const.js'; // for debugging purposes - multiplayer features are tested in singleplayer first

export default class SingleGame{
    constructor(
        boardRef, 
        height, 
        width, 
        mines,
        px
        ){
        // save stuff
        this.height = height;
        this.width = width;
        this.mines = mines;
        this.renderRef = boardRef;
        this.px = px;
        this.state  = new State(height, width, mines, Math.random(), true);
        this.render = new BoardRender(
            boardRef, 
            this.state, 
            px, 
            true, // real flag
            false // versus flag, true for testing purposes
        );
        this.renderWorker = new BoardRenderWorker();
        console.log(this.renderWorker);
        this.renderWorker.postMessage({postMessage: true});
        

        this.mouseHandler = new MouseHandler(
            boardRef, 
            this.state, 
            this.render,
            (x,y) => { this.leftClick(x,y);},
            (x,y) => {      this.flag(x,y);},
            (x,y) => {     this.chord(x,y);}
        );
        this.firstClick = true;
        this.points = 0;
    }
    leftClick(x,y){

        //dont reveal flagged tiles
        if(this.state.board[x][y].flagged){
            return;
        } 

        // keep track of first game click
        if(this.firstClick){
            
            //guarentee zero on first click
            this.state.forceZeroAt(x,y);

            // start timer
            this.firstClick = false;
        }

        // recursive reveal, get points awarded for reveal
        const points = this.state.revealPoints(x, y, p1, x, y);
        //console.log(`scored: ${points}, total: ${this.points += points}`);
        if( points < 0){
            // game lost!
            // stop timer
            return;
        }

        if(this.state.clear){
            // game won
            console.log('game over!');
            return;
        }
    }
    flag(x,y){
        const target = this.state.board[x][y];
        if(!target.revealed){
            target.flagged = !target.flagged;
        }
    }
    chord(i,j){
        const choordTarg = this.state.board[i][j];
        if(!choordTarg.revealed || choordTarg.isMine) return;
        let revealList = [];
        let neighborFlagCount = 0;

        // count neighboring flags and save potential tile coordinates to reveal 
        this.state.neighbors(i,j).forEach( ({x,y}) => {
            const target = this.state.board[x][y];
            if(target.flagged && !target.revealed){
                ++neighborFlagCount;
            }else if(!target.flagged && !target.revealed){
                revealList.push({x,y});
            }
        });

        // reveal tiles if the value matches number of surounding flags
        if(neighborFlagCount === choordTarg.value){
            revealList.forEach( ({x,y}) => {
                this.leftClick(x,y);
            });
        }
    }
}