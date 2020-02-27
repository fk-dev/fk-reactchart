import React from 'react';
import { rndKey } from '../core/utils.js';

const parseUnit = l => {
	let i = 1;
	let num;
	while(!Number.isNaN(Number(l.substring(0,i)))){
		num = Number(l.substring(0,i));
		i++;
	}
	const unit = l.substring(i-1);
	return {num, unit};
};

const offset = (i,l) => {
	if(typeof l === 'string'){
		const { unit, num } = parseUnit(l);
		return `${i * num}${unit}`;
	}else{
		return i*l;
	}

};

export function renderText(opts,text,anchor,lheight){
	const texts = text.split('\n');

	lheight = lheight || opts.fontSize || 12;

	const ancOffset = () => {
		switch(anchor){
			case 'top':
				return 0;
			case 'bottom':
				return texts.length - 1;
			default:
				return (texts.length - 1)/2;
		}
	};

	const ao = ancOffset();

	return <text key={opts.key} {...opts}>{texts.map((t,i) => <tspan {...opts} key={`${rndKey()}.${i}`} dy={offset(i - ao,lheight)}>{t}</tspan>)}</text>;
}

export function renderTextOptions(opts,text){
	const texts = text.split('\n');

	return texts.map(t => {
		return {
			dy: opts.fontSize || 12,
			line: t
		};
	});
}
