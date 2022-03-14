import React from 'react';
import Drawer from './Drawer.jsx';

import { init }   from './helpers.js';
import { rndKey, emptyState } from './core/utils.js';

export default class Graph extends React.Component {

	constructor(props){
		super(props);
		this.myKey = props.graphId || rndKey();
		if(props.onGenerateKey){
			props.onGenerateKey(this.myKey);
		}
		this.type = 'graph';
		this.init();
	}

	init(){
		const pr = this.props;
		if(pr.__preprocessed){ // done outside graph
			this.sh = pr;
			// only the key, can't forceUpdate before didMount
			this.sh.addKey(this.myKey);
			if(this.props.namespace){
				this.sh.setNamespace(this.props.namespace,this.myKey);
			}
			if(this.props.debug && !this.sh.hasDebug()){
				this.sh.setDebug(this.props.debug, this.myKey);
			}
		}else{ // to be done here
			if(pr.onGenerateKey){
				pr.onGenerateKey(this.myKey);
			}
			this.sh = init(pr,this.type,{ key: this.myKey, namespace: this.props.namespace}, this.props.debug);
		}
	}

	// we can call forceUpdate now
	componentDidMount(){
		if(!this.sh){
			throw new Error('A Chart object is initialized without a manager!');
		}

		this.sh.addKey(this.myKey,this);
	}

	shouldComponentUpdate(pr){
		return this.changeOfMgrByRawProps(pr) || pr.namespace !== this.props.namespace;
	}

	changeOfMgrByRawProps(pr){
		// we changed the props
			// 1 - human friendly
		if(!pr.__preprocessed){ // not sh, we update if not both empty (might be an empty graph rerendering)

			if(!this.sh || !this.sh.isEmpty(pr) || !this.sh.isEmpty()){
				this.sh.kill(this.myKey); // no more in previous helper
				this.sh = init(pr,this.type,{ key: this.myKey, obj: this, namespace: this.props.namespace}, this.props.debug);
			}

			// 2 - helpers
		}else if(pr.__mgrId !== this.sh.__mgrId){
			this.sh.kill(this.myKey); // no more in previous helper
			this.sh = pr;
			this.sh.addKey(this.myKey, this);
			if(this.props.debug && !this.sh.hasDebug()){
				this.sh.setDebug(this.props.debug, this.myKey);
			}
		}
		return false;
	}

	// case when updating props without going to shouldComponentUpdate
	componentDidUpdate(){
		if(this.props.__preprocessed){
			this.changeOfMgrByRawProps(this.props);
		}
	}

		// obj will go away
	componentWillUnmount(){
		if(this.sh && this.sh.__preprocessed){
			this.sh.kill(this.myKey);
		}
	}

	showIds(){
		if(this.props.whoAmI){
			return {
				mgr: this.sh.__mgrId,
				graph: this.myKey
			};
		}
	}

	render(){
		const state = this.sh && this.sh.ready() ? this.sh.get(this.myKey) : emptyState;
		const cn = this.props.namespace || ( this.sh ? this.sh.getNamespace() : 'reactchart' );
		const mgrId = this.sh ? this.sh.__mgrId : 'noMgr';
		return <Drawer id={this.myKey} mgrId={mgrId} state={state} className={cn} overflow={this.props.overflow} debug={this.showIds()}/>;
	}
}

class Legend extends React.Component {

	constructor(props){
		super(props);
		this.myKey = `l.${props.legendId || rndKey()}`;
		this.type = 'legend';
		this.init();
	}

	// we can call forceUpdate now
	componentDidMount(){
		if(!this.sh){
			throw new Error('A Legend object is initialized without a manager!');
		}

		this.sh.addKey(this.myKey,this);
	}

	shouldComponentUpdate(pr){

		if(!pr.__preprocessed){ // not sh, we update anyway
			this.sh = init(pr,this.type,{ key: this.myKey, obj: this});
			return true;
		}
		return false;
	}

	// obj will go away
	componentWillUnmount(){
		if(this.sh && this.sh.__preprocessed){
			this.sh.kill(this.myKey);
		}
	}

	init(){
		const pr = this.props;
		if(pr.__preprocessed){ // done outside graph
			this.sh = pr;
			this.sh.addKey(this.myKey);
		}else{ // to be done here
			this.sh = init(pr,this.type,{ key: this.myKey}, this.props.debug);
		}
	}

	iconStyle(props,type){

		const o = props.faded ? 0.2 : 1;
		const c = props.clickable ? "pointer" : null;

		let sty = {
			opacity: o,
			cursor: c
		};

		if(type === 'icon'){
			sty.width = props.width;
		}

		return sty;
	}

	table(){

		const nCol = this.props.col || 1;

		const tabline = (cells,idx) => {

			const cs = (cell) => cell.icon.props.faded ? 'fade-chart' : '';
      const clicker = (cell) => this.props.noMarkClick ? null : () => cell.click(this.sh, this.myKey);

			const icon  = (cell) => <td key={`i.${cell.label}`} className={cs(cell)} style={this.iconStyle(cell.icon.props,'icon')} onClick={clicker(cell)}>{cell.icon.icon(cell.icon.props)}</td>;
			const label = (cell) => <td key={`l.${cell.label}`} className={cs(cell)} style={this.iconStyle(cell.icon.props)} onClick={clicker(cell)}>{cell.label}</td>;

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
			tab = tab || [];
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

		return <table>
			<tbody>{gmap(this.sh.legend(this.myKey), (line,idx) => tabline(line,idx))}</tbody>
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
			const { icon, click, label } = l;
			return <span key={idx} {...margin} onClick={() => click(this.sh, this.myKey)}>
				<span style={this.iconStyle(icon.props,'icon')} verticalAlign='sub'>{icon.icon(icon.props)}</span>
				<span style={this.iconStyle(icon.props)}>{label}</span>
			</span>;
		};

		return <div>{(this.sh.legend(this.myKey) || []).map( (l, idx) => print(l,idx) )}</div>;
	}

	render(){
		return this.sh ? this.props.line ? this.line() : this.table() : null;
	}
}

Graph.Legend = Legend;
