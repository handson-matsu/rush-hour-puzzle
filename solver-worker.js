import {solve} from './engine.js';
self.onmessage=({data})=>{try{self.postMessage({path:solve(data.cars,data.state)});}catch{self.postMessage({error:true});}};
