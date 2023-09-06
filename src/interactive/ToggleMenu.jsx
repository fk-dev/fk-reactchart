import React from 'react';

import { toJS,http,csv } from 'fk-helpers';
const { downloadData } = http;

function exportData(data){
	let formatted = [];
	let fields =[];

	data.forEach(d=>{
		let data = d.series.map(s=>{
			const keyAbs = d.abs.type === 'date' ? 'date':"x";
			const keyOrd = d.ord.label || "y";
			const valueAbs = s.x;
			return ({[keyAbs]:valueAbs,[keyOrd]:s.y});
		});
		fields.push(Object.keys(data[0]).map(k=>({name:k,key:k,format: {type: k ==='date'? 'date':'number'}})));
		formatted.push(data);
	}); //[[{date,Base 100}],[{date,Valeur}]]

	formatted.forEach((f,i)=>{
		const fileContent = csv.toCsv(f,fields[i],{sep: ','});
		const fileName =fields[i].find(f=>f.key !=='date').name + '.csv';
		downloadData({ content:fileContent, contentType: 'text/csv', fileName: fileName });
	});
}

export default function ToggleMenu({toggleSettings, toggleMenu, settings, showMenu, getData}) {

	return <div className="btn-group navbar-right" style={{margin:0,height:0,opacity:0.8,zIndex:99}}>
		<a className="btn btn-default dropdown-toggle" onClick={()=>toggleMenu()}><i className="glyphicon glyphicon-menu-hamburger"></i></a>
		<ul className="dropdown-menu navbar-right text-right" style={showMenu ? {"display": "block"} : {"display": "none"}}>
			<li><a className='btn btn-default' onClick={()=> toggleSettings()}>{settings ? 'Graph':'Settings'}</a></li>
			<li><a className='btn btn-default' onClick={()=> exportData(getData())}>{'Export'}</a></li>
			<li><a className='btn btn-default' onClick={()=> toggleMenu()}>{'X'}</a></li>
		</ul>
	</div>;
}
