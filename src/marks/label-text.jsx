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

export function renderText(opts,text,anchor){
	const texts = text.split('\n');

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

	return <text key={opts.key} {...opts}>{texts.map((t,i) => <tspan key={`${rndKey()}.${i}`} {...opts} dy={offset(i - ao,opts.fontSize || 12)}>{t}</tspan>)}</text>;
}

export function renderTextOptions(opts,text){
	const texts = text.split('\n');

	return texts.map((t,i) => {
		return {
			dy: offset(i,opts.fontSize || 12),
		};
	});
}
