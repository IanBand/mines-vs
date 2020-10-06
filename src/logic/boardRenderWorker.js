import BoardRenderWorker from 'worker-loader!./render.js';
export default class BoardRender{
    constructor(canvasRef, gameState, px, real, versus){
        this.real = real;
        this.versus = versus;
        this.state = gameState;
        this.px = px;
        //this.canvas.height = px * this.state.height;
        //this.canvas.width  = px * this.state.width;
        this.renderWorker = new BoardRenderWorker();
        const workerCanvas = canvasRef.transferControlToOffscreen();
        this.renderWorker.postMessage({type: 'init', canvas: workerCanvas}, [workerCanvas]);
                
        

        // this text setting really only works with 30px tiles, need to make it scalable or at least have 3 or 4 predetermined styles
        
        /*
        this.ctx.lineWidth = 1;
        this.ctx.font = `${px * .6}px Impact`;
        this.ctx.textAlign = 'center';
        */

        //this.drawPpp(p2);
    }
    anticipateReveal(x,y){

    }
    anticipateChord(x,y){

    }
    highlight(x,y){

    }
    drawAll(){

    }
}