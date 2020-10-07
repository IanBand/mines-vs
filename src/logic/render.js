// a worker thread for handling animations on the board

// https://glitch.com/edit/#!/offscreencanvas-demo?path=worker.js%3A9%3A14
// https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers


// need signals for:
// redraw board?
// animate click
// animate flag
// animate mine
// animate move
// animate win
// animate lose

// animations signals will start playing an animation at coordinates of the board
// multiple animations will be able to play concurrently
// once all animations have finished, the board animation loop pauses until the next signal occures
// animations are queued up and played until they are all done, then it pauses.

// divide the board into an (x + 1) by (y + 1) grid, so each "intersection: of the grid state has its own animation tile?
// or do independent animations play at some board coordinates

// need a map (state coordinates) => {board render coordinates}

// https://webpack.js.org/loaders/worker-loader/
// https://medium.com/samsung-internet-dev/offscreencanvas-workers-and-performance-3023ca15d7c7

var canvas = null;
var ctx = null;

onmessage = function (e) {
    switch(e.type){
        default: 
            break;
        case 'init':
            canvas = e.canvas;
            ctx = canvas.getContext("2D");
    }

    console.log('worker received a message!', e);
  
    //workerResult.onmessage = true;
  
    //postMessage(workerResult);
};