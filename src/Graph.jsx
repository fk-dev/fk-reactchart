import React from 'react';
import Drawer from './Drawer.jsx';

import { init } from './helpers.js';
import { map } from 'underscore';

export default class Graph extends React.Component {

	componentWillMount(){
		this.init();
	}

	componentWillReceiveProps(pr){
		this.init(pr);
	}

	init(pr){
		pr = pr || this.props;
		if(pr.__preprocessed){
			this.sh = pr;
		}else{
			this.sh = init(pr);
		}
		this.sh.updateGraph(this);
	}

	render(){
		let state = this.sh.get();
		return <Drawer state={state} />;
	}
}

class Legend extends Graph {

	table(){

		let nCol = this.props.col || 1;

		let tabline = (cells,idx) => {
			let iconP = (cell) => {
				return {
					width: cell.icon.props.width,
					opacity: cell.icon.props.faded ? 0.5 : 1
				};
			};
			let labelP = (cell) => {
				return {
					opacity: cell.icon.props.faded ? 0.5 : 1
				};
			};

			let icon  = (cell) => <td key={`i.${cell.label}`} style={iconP(cell)} onClick={() => cell.click(this.sh)}>{cell.icon.icon(cell.icon.props)}</td>;
			let label = (cell) => <td key={cell.label} style={labelP(cell)} onClick={() => cell.click(this.sh)}>{cell.label}</td>;

			let fill = () => {
				let out = [];
				for(let i = 0; i < cells.length; i++){
					out.push(icon(cells[i]));
					out.push(label(cells[i]));
				}
				return out;
			};

			return <tr key={idx}>{fill()}</tr>;
		};

		let gmap = (tab, oneLine) => {
			let out = [];
			let line = [];
			let j = 0;
			for(let i = 0; i < tab.length; i++){
				if(j !== nCol){
					j++;
					line.push(tab[i]);
				}else{
					out.push(oneLine(line,i - 1));
					j = 1;
					line = [tab[i]];
				}
			}
			if(line.length !== 0){
				out.push(oneLine(line, tab.length));
			}
			return out;
		};

		return <table {...this.props}>
			<tbody>{gmap(this.sh.legend(), (line,idx) => tabline(line,idx))}</tbody>
		</table>;
	}

	line(){
		
		let print = (l,idx) => {
			// a little depth to the icon
			// a little space to breathe
			// here to avoid use of CSS, easyness of use
			// for a third party
			let margin = {
				style: {
					marginRight: '10pt'
				}
			};
			let { icon } = l;
			return <span key={idx} {...margin} onClick={icon.click}>
				<span verticalAlign='sub'>{icon.icon(icon.props)}</span>
				<span>{l.label}</span>
			</span>;
		};

		return <div {...this.props}>{map(this.sh.legend(), (l, idx) => print(l,idx) )}</div>;
	}

	render(){
		return this.props.line ? this.line() : this.table();
	}
}

Graph.Legend = Legend;
