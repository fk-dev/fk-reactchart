let React = require('react');
let Plain = require('./Plain.jsx');
let Stairs = require('./Stairs.jsx');
let BarChart = require('./BarChart.jsx');
let Pie = require('./Pie.jsx');

let utils = require('../core/utils.js');

// the graphs function generator
let graph = {};

graph.Plain  = (props, opts) => <Plain {...opts} key={props.key} state={props}/>;

graph.Stairs = (props, opts) => <Stairs {...opts} key={props.key} state={props}/>;

graph.Bars   = graph.yBars = (props,opts) => <BarChart {...opts} key={props.key} state={props}/>;

graph.Pie    = (props, opts) => <Pie {...opts} key={props.key} state={props}/>;

let m = function(key,props, opts){
	if(utils.isNil(graph[key])){
		throw new Error('Unknown graph type "' + key + '"');
	}

	return graph[key](props,opts);
};

module.exports = m;
