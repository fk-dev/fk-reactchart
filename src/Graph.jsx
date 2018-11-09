import React from 'react';
import Drawer from './Drawer.jsx';

import { init }   from './helpers.js';
import { rndKey } from './core/utils.js';

export default class Graph extends React.Component {

	constructor(props){
		super(props);
		this.myKey = rndKey();
		this.type = 'graph';
		this.init();
	}

	componentDidMount(){
		if(!this.sh){
			this.init();
			this.sh.updateGraph(this, this.myKey);
		}else{
			this.sh.setKey(this.myKey,this);
			this.sh.reinit();
		}
	}

	componentWillUnmount(){
		if(this.sh){
			this.sh.kill(this.myKey);
		}
	}

	shouldComponentUpdate(pr){

		if(!pr.__preprocessed){ // not sh, we update anyway
			this.sh = init(pr,this.type,{ key: this.myKey, obj: this, namespace: this.props.namespace}, this.props.debug);
			return true;
		}

		// sh managing updates
		if(pr.__mgrId !== this.sh.__mgrId){
			this.sh = pr;
			this.sh.setKey(this.myKey);
			this.sh.reinit();
			this.sh.updateGraph(this,this.myKey);
		}else if(!this.sh.canMeasure()){
			this.sh.reinit();
		}

		return false;
	}

	componentDidUpdate(){
		if(!this.sh){
			this.init();
			this.sh.updateGraph(this, this.myKey);
		}else if(this.props.__preprocessed && this.props.__mgrId !== this.sh.__mgrId){
			this.sh = this.props;
			this.sh.setKey(this.myKey, this);
			this.sh.reinit();
		}else if(!this.sh.canMeasure() || this.myKey !== this.sh.graphKey()){
			this.sh.setKey(this.myKey);
			this.sh.reinit();
			this.sh.updateGraph(this, this.myKey);
		}
	}

	init(){
		const pr = this.props;
		if(pr.__preprocessed){ // done outside graph
			this.sh = pr;
			this.sh.setKey(this.myKey);
		}else{ // to be done here
			this.sh = init(pr,this.type,{ key: this.myKey, obj: this, namespace: this.props.namespace}, this.props.debug);
		}
	}

	render(){
		const state = this.sh ? this.sh.get() : {cadre: {}, background: {}};
		const cn = this.props.namespace || ( this.sh ? this.sh.getNamespace() : 'reactchart' );
		return <Drawer id={this.myKey} state={state} className={cn}/>;
	}
}

class Legend extends React.Component {

	constructor(props){
		super(props);
		this.myKey = rndKey();
		this.type = 'legend';
		this.init();
	}

	shouldComponentUpdate(pr){

		if(!pr.__preprocessed){ // not sh, we update anyway
			this.sh = init(pr,this.type,{ key: this.myKey, obj: this});
			return true;
		}
		return false;
	}

	init(){
		const pr = this.props;
		if(pr.__preprocessed){ // done outside graph
			this.sh = pr;
			this.sh.setKey(this.myKey);
		}else{ // to be done here
			this.sh = init(pr,this.type,{ key: this.myKey, obj: this }, this.props.debug);
		}
	}

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

		return <div {...this.props}>{this.sh.legend().map( (l, idx) => print(l,idx) )}</div>;
	}

	render(){
		return this.sh ? this.props.line ? this.line() : this.table() : null;
	}
}

Graph.Legend = Legend;
