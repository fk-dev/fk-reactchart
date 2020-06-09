import { isNil, deepCp } from './utils.js';

const palette = [ "#3A83F1", "#DC3FF1", "#F2693F", "#8AF23F", "#758d99",
	"#F1DC41", "#AC310C", "#40C8F2", "#980DAB", "#F6799B", "#9679F6", "#EE2038",
	"#00994D", "#758D99", "#F141AD", "#0C86AC", "#C729C7", "#D26F13", "#092508",
	"#FFBACD", "#7CB603", "#4088EC", "#46002C", "#FF5478", "#43859E", "#72680F",
	"#97E6EC", "#F777BE", "#AE241F", "#35457B", "#CCA9EF", "#4A0202", "#DDDF14",
	"#870062", "#B573F2", "#08B83C", "#F59288", "#056EFC", "#2D1B19", "#3AA676",
	"#2E5045", "#AFE9AA", "#F3D6C2", "#69F393", "#BFFA57", "#FA2C4B", "#355801",
	"#258B85", "#845100", "#14546B", "#034A29", "#B81288", "#F64BB2", "#D1C2EC",
	"#83A3F0", "#FEBCA3", "#362463", "#FDB2EA", "#FD981F", "#49F9DF", "#2490C0",
	"#282807", "#26C186", "#8D54CE", "#6D1662", "#57F2BD"];

const color = function(options,f){

	const { colors, offsets } = options;

	const inBetween = () => {

		const regularOffsets = n => {
			const _generate = () => {
				let out = [];
				for(let i = 1; i < n - 1; i++){
					out.push(i/(n-1));
				}
				return out;
			};
			return [0].concat(_generate()).concat(1);
		};

		const _computeCus = (off) => {
			for(let i = 1; i < off.length; i++){
				if(f <= off[i]){
					const end = (f - off[i - 1])/(off[i] - off[i - 1]);
					const start = (off[i] - f)/(off[i] - off[i - 1]);
					return {
						coord: [start,end],
						cols: colors.slice(i - 1, i + 1)
					};
				}
			}
			return {
				coord: [1 - f, f],
				cols: colors
			};
		};

		if(!offsets && colors.length === 2){
			return {
				coord: [1 - f, f],
				cols: colors
			};
		}else if(!offsets && colors.length > 2){
			return _computeCus(regularOffsets(colors.length));
		}else{
			return _computeCus(offsets);
		}
	};

	const toRGB = function(str,w){
		return {
			R: Math.round(parseInt(str.substr(1,2),16) * w),
			G: Math.round(parseInt(str.substr(3,2),16) * w),
			B: Math.round(parseInt(str.substr(5,2),16) * w)
		};
	};

	const addRGB = function(){
		return {
			R: arguments.reduce( (memo,ar) => memo + ar.R, 0),
			G: arguments.reduce( (memo,ar) => memo + ar.G, 0),
			B: arguments.reduce( (memo,ar) => memo + ar.B, 0)
		};
	};

	const _toString = n => {
		const tmp = Math.min(n, 255).toString(16);
		return tmp.length === 1 ? `0${tmp}` : tmp;
	};
	const toString = (rgb) => `#${_toString(rgb.R)}${_toString(rgb.G)}${_toString(rgb.B)}`.toUpperCase();

	const { coord, cols } = inBetween();
	return toString(cols.reduce( (memo, col, idx) => addRGB(memo,toRGB(col,coord[idx])), {R:0, G:0, B:0}));
	
};

const shade = function(options,f){
	let val = f;
	if(options.shadings && options.shadings.length >= 2){
		val = options.shadings[0] + (options.shadings[1] - options.shadings[0]) * f;
	}
	return val;
};

const white = '#FFFFFF';
const black = '#000000';

const shadeMgr = { color, shade };

const compute = function(mgr){

	const { computation, type, options, index, N, factor, shadeFunction, point } = mgr;

	switch(computation){
		case 'by index':
			return shadeMgr[type](options, index / N);
		case 'explicit':
			return shadeMgr[type](options, factor[index]);
		case 'by function':
			return shadeFunction ? shadeFunction(point) : 'black';
	}
};

// 
export function shader(shade,points){

	if(isNil(shade)){
		return;
	}

	if(isNil(points) && typeof shade === 'number'){
		return palette[shade];
	}

	let mgr = deepCp({},shade);
	mgr.N = points.length - 1;
	for(let i = 0; i < points.length; i++){
		mgr.index = i;
		mgr.point = points[i];
		points[i][shade.type] = compute(mgr);
	}
}

export function lighter(col, f)  { return color({colors: [col, white]}, f);}
export function darker(col, f)   { return color({colors: [col, black]}, f);}
export function lighterInv(col,f){ return color({colors: [col, white]}, [1/f , 1 - 1/f]);}
