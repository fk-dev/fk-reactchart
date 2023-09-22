import React, { useState } from 'react';
import { downloadData } from './http-utils.js';

function toCsv(name, serie, options){

	let lines = [[name,""].join(',')];
	lines.push(options.map(x => x.name).join(','));

	serie.forEach( point => {

		const line = options.map( ({key, format}) => {
			const rawVal = point[key];
			const val = format === 'date' ? rawVal.toISOString() : rawVal;
			return val;
		}).join(',');

		lines.push(line);
	});

	return lines.join('\n');
}

function exportData(data){
	let formatted = [];
	let fields =[];

	data.forEach(d => {
		let data = d.series.map(s=>{
			const keyAbs = d.abs.type === 'date' ? 'date':"x";
			const keyOrd = d.ord.label || "y";
			const valueAbs = s.x;
			return ({[keyAbs]:valueAbs,[keyOrd]:s.y});
		});
		fields.push(Object.keys(data[0]).map(k=>({name:k,key:k,format: k ==='date'? 'date':'number'})));
		formatted.push(data);
	}); //[[{date,Base 100}],[{date,Valeur}]]

	formatted.forEach((f,i)=>{
		const fileContent = toCsv(data[i].name,f,fields[i]);
		const fileName =fields[i].find(f=>f.key !=='date').name + '.csv';
		downloadData({ content:fileContent, contentType: 'text/csv', fileName: fileName });
	});
}

export default function ToggleMenu({toggleSettings, settings, getData}) {

	const [inputVal, setInputVal] = useState(false);

	function _toggleSettings(){
		toggleSettings();
		setInputVal(!inputVal);
	}

	function _exportData(data){
		exportData(data);
		setInputVal(!inputVal);
	}

	return <div className='reactchart-toggle-menu'>
		<input id="menu-toggle" type='checkbox' checked={inputVal} onChange={(e) => setInputVal(e.target.checked)}/>
		<label className='menu-button-container' htmlFor="menu-toggle">
			<div className='menu-button'></div>
		</label>
		<ul className="menu">
			<li><span onClick={()=> _toggleSettings()}>{settings ? 'Graph':'Settings'}</span></li>
			<li><span onClick={()=> _exportData(getData())}>{'Export'}</span></li>
		</ul>
	</div>;
}
