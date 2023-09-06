import React from 'react';

let _icon = {};

_icon.square = _icon.Square = function(data,style,open){
	const l = Math.min(data.width, data.height) * 3/5;
	const x = data.hMargin + (data.width - l)/2 ;
	const y = data.vMargin + (data.height - l);
	const f = open ? 'none' : style ? `url(#${style}` : data.color;
	return <rect x={x} y={y} width={l} height={l} fill={f} stroke={data.color} />;
};

_icon.opensquare = _icon.OpenSquare = (data, style) => _icon.square(data,style, true);

_icon.dot = _icon.Dot = function(data,style, open){
	const x = (data.width + 2 * data.hMargin)/2;
	const r = Math.min(data.height, data.width) * 3 / 10; // 3 / 5 de remplissage
	const y = data.height + data.vMargin - r;
	const f = open ? 'none' : style ? `url(#${style})` : data.color;
	return <circle cx={x} cy={y} r={r} fill={f} stroke={data.color}/>;
};

_icon.opendot = _icon.OpenDot = (data,style) => _icon.dot(data,style,true);

_icon.bar = _icon.Bar = _icon.square;

_icon.pie = _icon.Pie = function(data,style){
	const x = data.hMargin + data.width/2;
	const y = 2 * data.vMargin + data.height;
	const r = data.height;
	const x1 = x + r * Math.cos(3/8 * Math.PI);
	const y1 = y - r * Math.sin(3/8 * Math.PI);
	const x2 = x + r * Math.cos(5/8 * Math.PI);
	const y2 = y - r * Math.sin(5/8 * Math.PI);
	const f = style ? `url(#${style})` : data.color;
	
	const path = 'M' + x + ',' + y + ' L' + x1 + ',' + y1 + ' A' + r + ',' + r + ' 0 0,0 ' + x2 + ',' + y2 + ' z';
	return <path fill={f} d={path}/>;
};

_icon.line = function(data){

	const l = Math.min(data.width, data.height);
	const x1 = data.hMargin + (data.width - l)/2 ;
	const x2 = x1 + l;
	const y = data.vMargin + (data.height - 6); // fraction of height of letters...
	return <line x1={x1} y1={y} x2={x2} y2={y} stroke={data.color} strokeWidth={data.strokeWidth}/>;
};


export function iconer(data, key, style){
	if(!_icon[key]){
		throw new Error('unrecognized mark type: "' + key + '"');
	}

	return _icon[key](data,style);
}
