/*
	all the proprieties
*/
import { extend, extendOwn } from 'underscore';

// defaults for marks
let marks = {};

const commonMark = () => {
	return {
		draw: false,
		css: null,
		ds: {
			x: {},
			y: {}
		},
		position: {
			x: 0,
			y: 0
		},
		width: 0,
		shade: 1
	};
};

marks.dot = marks.Dot = () => extend(commonMark(), {
	radius: 3,
	color: 'black',
	fill: null,
	size: null
});

marks.square = marks.Square = () => extend(commonMark(),{
	color: 'black',
	fill: null,
	size: 0,
});

marks.bar = marks.Bar = () => extend(commonMark(),{
	drop:{
		x:null,
		y:0
	},
	span:0.5,
	offset: {
		x: 0,
		y: 0
	}
});

// defaults for graphs
let graph = {};
graph.common = () => {
	return {
		css: null,
		color: 'black',
		width: 1,
		fill: 'none',
		shade: 1,
		show: true,
		// mark props, explicit at heigh level
		// overwritten if present in markProps
		mark: true,
		markColor: null,
		baseLine: {x:null, y:0},
		dropLine: {x: false, y:false},
		markSize: 3,
		markType: 'dot',
		onlyMarks: false,
		// contains low-level description,
		// i.e. specific things like radius
		// for a dot, or anything.
		markProps: {},
		shader: null, //playing with colors
		process: null, //playing with data {dir: x || y, type: 'histogram'}
		tag: {
			css: null,
			show: false, // show the tag
			print: (p) => p.tag,
			fontSize: 10,
			pin: false, // show the pin
			pinColor: 'black', // color of the pin
			pinLength: 10, // 10 px as pin length
			pinWidth: 1, // 1 px as pin width
			pinAngle: 90, // direction of pin
			pinHook: 3, // 3px for hook
			color: 'black' // color of the tag
		}
	};
};

graph.Bars = graph.bars = () => extend(graph.common(), {
	color: 'none',
	width: 0,
	dir: {
		x: false,
		y: true
	},
	drop: {x: null, y: 0},
	markType: 'bar',
	markProps: {
		width: 0,
		draw: false
	},
	// Number or {}
	span: null, // auto compute
	offset: {x: 0, y: 0}
});

graph.yBars = graph.ybars = () => extend(graph.Bars(),{
	dir: {
		x: true,
		y: false
	},
});

graph.Pie = graph.pie = () => extend(graph.common(),{
	pie: 'disc', // tore
	pieOrigin: {x: 0, y:0}, // offset from center
	pieRadius: null, // 2/3 of world
	pieToreRadius: 0, // 0: no hole, 1 : no border!
	tag: {
		show: false, // show the tag
		print: (p) => p.tag,
		pin: false, // show the pin
		pinColor: 'black', // color or the pin
		pinLength: 0.35, // 10 px as pin length
		pinRadius: 0.75, // 3/4 of pie size
		pinHook: 10, // absolute length
		color: 'black' // color of the tag
	}
});

//graph.Bars = graph.common;
graph.Plain = graph.plain = graph.common;

graph.Stairs = graph.stairs = () => extend(graph.common(), { stairs: "right" });

///////////
// major / minor props
/////////////

// that's a major
export const Grid = {
	show: false,
	color: 'LightGray',
	width: 0.5,
	length: 0
};

// that's a major
export const Tick = {
	show: true,
	css: null,
	width: 1,
	length: 15,
	out: 0.25, // proportion that is outside
	step: null,
	color: 'black',
	labelOffset: {x:0, y:0 },
	labelize: () => false, //utils.isNil(val) ? '' : val instanceof Date ? moment(val).format('YYYY') : val.toFixed(1);},
	label: '',
	rotate: 0,
	labelFSize: 10,
	labelColor: 'black'
};

//
const axe = {
	ticks: {
		major: Tick,
		minor: extendOwn(extend({},Tick),{
			show: false,
			length: 7,
			out: 0,
			color: 'gray',
			labelize: () => false
		})
	},
	grid: {
		major: Grid,
		minor: extendOwn(extend({},Grid),{
			width: 0.3
		})
	},
	show: true,
	css: null, //
	// to force locally definition
	min: null,
	max: null,
	interval: null,
	tickLabels: [], //{coord: where, label: ''}, coord in ds
	color:     'black',
	width:      1,
	label:      '',
	labelOffset: {x: 0, y: 0},
	labelAnchor: 'middle',
	labelFSize:  20,
	labelRotate: 0,
	labelColor: 'black',
	empty:      false,
	CS:         'cart',
	partner: 0,
	// for ticklabel formatting
	factor: 1,
	factorColor: 'black',
	factorOffset: {x: 0, y: 0},
	factorAnchor: 'middle',
	factorFSize: 10
};

export function Axes(axis){
	return {
		abs: axis.abs.map( p => extend({placement: p}, axe)),
		ord: axis.ord.map( p => extend({placement: p}, axe))
	};
}

///
export function Graph(axis){
	return {
		////// general
		css: false,
		name: 'G',
		height: 400,	// defines the universe's height
		width:	600,	// defines the universe's width
		axisOnTop: false,
		// margins
		innerMargin: {left: null, bottom: null, right: null, top: null}, // left, bottom, right, top
		// defMargins.axis.ticks
		// if defined, overwrite
		factorMargin: {left: null, bottom: null, right: null, top: null}, // left, bottom, right, top
		// factorMargin + defMargins.axis.label + defMargins.axis.ticks
		// if defined, overwrite
		outerMargin: {left: null, bottom: null, right: null, top: null}, // left, bottom, right, top
		// data process, what to do with failed points
		discard: true,

		////// cadre
    cadre: {
			show: false,
			css: false
		},

		////// legend
		legend: {
			css: false,
			iconWidth: 30,
			iconHeight: 20,
			iconHMargin: 0, // offset from center
			iconVMargin: 0, // offset from center
			iconUnit: 'px',
			events: {
				onClick: null // fade or suppress
			}
		},

		////// foreground
		foreground: null,

		////// background
		background: {
      show: false,
			css: null,
			color: 'none'
		},

		////// title
		titleProps: {
			title: '',
			titleFSize: 30,
			titleRotate: 0,
			css: null
		},

		////// data, series
		data: [],
		////// data, props
		graphProps: [],
		////// axis
		axisProps: Axes(axis)
	};
}

const type = (arr,dir) => {
	const v = arr.length === 0 ? 0 : arr[0][dir];
	const lab = arr.length !== 0 && arr[0].label && arr[0].label[dir];
	return lab ? 'label' : v instanceof Date ? 'date' : 'number';
};

const data = (serie,axis,axe) => {

	axis.abs = axis.abs.length ? axis.abs : ["bottom"];
	axis.ord = axis.ord.length ? axis.ord : ["left"];

	const absDef = axis.abs.indexOf('bottom') !== -1 ? axis.abs.indexOf('bottom') : 0;
	const ordDef = axis.ord.indexOf('left')   !== -1 ? axis.ord.indexOf('left')   : 0;

	const index = {
		abs: axe && axe.abs && axe.abs.axis ? axis.abs.indexOf(axe.abs.axis) : absDef,
		ord: axe && axe.ord && axe.ord.axis ? axis.ord.indexOf(axe.ord.axis) : ordDef
	}; 
	return {
		type: 'Plain', // Plain, Bars, yBars
		series: [], // x, y
		phantomSeries:[], // added points to play on the world's limit
		stacked: null, // x || y || null
		coordSys: 'cart', // cart || polar
		ord: {
			axis: axis.ord[index.ord], // 'left' || 'right'
			type: type(serie,'y') // 'number' || 'date' || 'label'
		},
		abs: {
			axis: axis.abs[index.abs], // 'bottom' || 'top'
			type: type(serie,'x') // 'number' || 'date' || 'label'
		}
	};
};

export function defaults(key){ return key === 'data' ? data : graph[key]();}

export function marksDefault(key){ return marks[key]();}

/* If no marginsO are defined, here are the rules:
 *  - ticks and ticks labels are 20 px in the y dir (height of text),
 *			40 px in the x dir (length of text).
 *  - we take a 10px margin on title and labels
 *  - bottom and right margin:
 *			- 20px + ({x,y}LabelFSize + 10 px) if a {x,y}Label is defined,
 *  - top and left margin:
 *			- 20px + ({x,y}LabelFSize	+ 10 px) if a {x,y}Label is defined,
 *  - top margin takes a titleFSize + 10px more if a title is defined
 */
export const defMargins = {
	outer: {
		label: {
			bottom: 20,
			top: 20,
			left: 20,
			right: 20,
			mar: 10
		},
		tickLabels: {
			left: 40,
			right: 40,
			bottom: 15,
			top: 15
		},
		ticks: {
			left: 4, // Math.ceil(15 * 0.25)
			right: 4,
			bottom: 4,
			top: 4
		},
		factor: {
			right: 30,
			top: 25
		},
		min: 5
	},
	inner: {
		left: 10, 
		bottom: 10, 
		right: 10, 
		top: 10
	},
	title: 10,
	min: 0,
	max: 4
};
