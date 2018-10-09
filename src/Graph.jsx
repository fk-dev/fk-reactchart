import React from 'react';
import Drawer from './Drawer.jsx';

import { init } from './helpers.js';
import { map } from 'underscore';

export default class Graph extends React.Component {

	componentDidMount(){
		this.init();
	}

	componentDidReceiveProps(pr){
		this.init(pr);
	}

	init(pr){
		pr = pr || this.props;
		if(pr.__preprocessed){
			this.sh = pr;
		}else{
			this.sh = init(pr);
		}
		this.myKey = this.sh.updateGraph(this, this.myKey);
	}

	render(){
		const state = this.sh ? this.sh.get() : null;
		return state ? <Drawer state={state} /> : null;
	}
}

class Legend extends Graph {

	table(){

		const nCol = this.props.col || 1;

		const tabline = (cells,idx) => {

			const iconP = (cell) => {
				return {
					width: cell.icon.props.width
				};
			};

			const cs = (cell) => cell.icon.props.faded ? 'fade-chart' : '';
      const clicker = (cell) => this.props.noMarkClick ? null : () => cell.click(this.sh);

			const icon  = (cell) => <td key={`i.${cell.label}`} className={cs(cell)} style={iconP(cell)} onClick={clicker(cell)}>{cell.icon.icon(cell.icon.props)}</td>;
			const label = (cell) => <td key={cell.label} className={cs(cell)} onClick={clicker(cell)}>{cell.label}</td>;

			const fill = () => {
				const out = [];
				for(let i = 0; i < cells.length; i++){
					out.push(icon(cells[i]));
					out.push(label(cells[i]));
				}
				return out;
			};

			return <tr key={idx}>{fill()}</tr>;
		};

		const gmap = (tab, oneLine) => {
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
		
		const print = (l,idx) => {
			// a little depth to the icon
			// a little space to breathe
			// here to avoid use of CSS, easyness of use
			// for a third party
			const margin = {
				style: {
					marginRight: '10pt'
				}
			};
			const { icon } = l;
			return <span key={idx} {...margin} onClick={icon.click}>
				<span verticalAlign='sub'>{icon.icon(icon.props)}</span>
				<span>{l.label}</span>
			</span>;
		};

		return <div {...this.props}>{map(this.sh.legend(), (l, idx) => print(l,idx) )}</div>;
	}

	render(){
		return this.sh ? this.props.line ? this.line() : this.table() : null;
	}
}

Graph.Legend = Legend;
