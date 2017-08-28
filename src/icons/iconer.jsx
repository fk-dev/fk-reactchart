import React from 'react';

let _icon = {};

_icon.square = _icon.Square = function(data,open){
	let l = Math.min(data.width, data.height) * 3/5;
	let x = data.hMargin + (data.width - l)/2 ;
	let y = data.vMargin + (data.height - l);
	let f = open ? 'none' : data.color;
	return <rect x={x} y={y} width={l} height={l} fill={f} stroke={data.color} />;
};

_icon.opensquare = _icon.OpenSquare = (data) => _icon.square(data,true);

_icon.dot = _icon.Dot = function(data,open){
	let x = (data.width + 2 * data.hMargin)/2;
	let r = Math.min(data.height, data.width) * 3 / 10; // 3 / 5 de remplissage
	let y = data.height + data.vMargin - r;
	let f = open ? 'none' : data.color;
	return <circle cx={x} cy={y} r={r} fill={f} stroke={data.color}/>;
};

_icon.opendot = _icon.OpenDot = (data) => _icon.dot(data,true);

_icon.bar = _icon.Bar = _icon.square;

_icon.pie = _icon.Pie = function(data){
	let x = data.hMargin + data.width/2;
	let y = 2 * data.vMargin + data.height;
	let r = data.height;
	let x1 = x + r * Math.cos(3/8 * Math.PI);
	let y1 = y - r * Math.sin(3/8 * Math.PI);
	let x2 = x + r * Math.cos(5/8 * Math.PI);
	let y2 = y - r * Math.sin(5/8 * Math.PI);
	
	let path = 'M' + x + ',' + y + ' L' + x1 + ',' + y1 + ' A' + r + ',' + r + ' 0 0,0 ' + x2 + ',' + y2 + ' z';
	return <path fill={data.color} d={path}/>;
};

_icon.line = function(data){

	let l = Math.min(data.width, data.height);
	let x1 = data.hMargin + (data.width - l)/2 ;
	let x2 = x1 + l;
	let y = data.vMargin + (data.height - 6); // fraction of height of letters...
	return <line x1={x1} y1={y} x2={x2} y2={y} stroke={data.color} strokeWidth={data.strokeWidth}/>;
};


export function iconer(data, key){
	if(!_icon[key]){
		throw new Error('unrecognized mark type: "' + key + '"');
	}

	return _icon[key](data);
}
