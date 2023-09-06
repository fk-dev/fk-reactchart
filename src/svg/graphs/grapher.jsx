import React from 'react';

import Plain    from './Plain.jsx';
import Stairs   from './Stairs.jsx';
import BarChart from './BarChart.jsx';
import Pie      from './Pie.jsx';

import { isNil } from '../core/utils.js';

// the graphs function generator
let graph = {};

graph.Plain  = (props, opts) => <Plain {...opts} key={props.key} state={props}/>;

graph.Stairs = (props, opts) => <Stairs {...opts} key={props.key} state={props}/>;

graph.Bars   = graph.yBars = (props,opts) => <BarChart {...opts} key={props.key} state={props}/>;

graph.Pie    = (props, opts) => <Pie {...opts} key={props.key} state={props}/>;

export function grapher(key,props, opts){
	if(isNil(graph[key])){
		throw new Error('Unknown graph type "' + key + '"');
	}

	return props.show && !props.onlyMarks ? graph[key](props,opts) : null;
}
