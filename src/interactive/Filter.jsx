import React, { useState, useMemo } from 'react';
import { utc } from 'moment';
import { makeInterval, isValid } from './legend-utils.js';
export default function Filter({mgr,filter}){

	const getBoundaries = (mgr,filter) => {
		const cu = mgr.props().curves.find(x =>  ['Bars','Plain'].indexOf(x.type) !== -1);
		const { originalDs } = mgr.rawProps();
		const { ds } = cu?.type === 'Plain' ? cu.path : ( cu?.marks?.[0]?.mark ?? {} );
		let absoluteFrom, absoluteTo;
		if(originalDs || ds){
			absoluteFrom = (originalDs ?? ds).x.d.min;
			absoluteTo   = (originalDs ?? ds).x.d.max;
		};

		let activeFilters = [];
		const hasFrom = filter.find(x => x.interval === 'from');
		const hasTo   = filter.find(x => x.interval === 'to');
		filter.forEach( f => {
			const { label, interval } = f;
			const { from, to, isActive } = makeInterval(interval,{absoluteFrom, absoluteTo});
			if(isActive){
				activeFilters.push({key: interval, label, from, to});
			}
		});

		return {absoluteFrom, absoluteTo, activeFilters, hasFrom, hasTo};
	};

	const { absoluteFrom, absoluteTo, activeFilters, hasFrom, hasTo } = useMemo(() => getBoundaries(mgr,filter),[mgr,filter]);
	const [who, setWho] = useState('ALL');
	const [from, setFrom] = useState(absoluteFrom);
	const [to, setTo] = useState(absoluteTo);
	
	const fromValue = (who,value) => {
		const _from = who === 'from' ? value : from;
		const _to   = who === 'to'   ? value : to;
		return { from: _from, to: _to };
	};

	const clickMe = (me,value) => {
		const { from, to } = value ? fromValue(me,value) : activeFilters.find(x => x.key === me);
		mgr.dynamic.filter.curve({from,to });
		setWho(me);
		setFrom(from);
		setTo(to);
	};

	const filterFromTo = (val,type) => {
		let value = utc(val);
		if(!value.isValid()){ return; }
		value = value.toDate();
		if(isValid({value, absoluteFrom, absoluteTo})){
			clickMe(type,value);
		}
	}

	const filterFrom = from => {
		filterFromTo(from,'from');
	};

	const filterTo = to => {
		filterFromTo(to,'to');
	};

	return absoluteFrom && absoluteTo ? <div className='reactchart-filter'>
		{activeFilters.map(f => <button key={f.key} disabled={who === f.key} className={`reactchart-btn${who === f.key ? ' reactchart-btn-active' : ''}`} onClick={() => clickMe(f.key)}>{f.label}</button>)}
		{hasFrom ? <input type="text" placeholder={hasFrom.label} className='reactchart-from'
			onFocus={(e) => e.target.type = "date"} onBlur={(e) => e.target.type = "text"} onChange={(e) => filterFrom(e.target.value)}/> : null}
		{hasTo   ? <input type="text" placeholder={hasTo.label} className='reactchart-to'
			onFocus={(e) => e.target.type = "date"} onBlur={(e) => e.target.type = "text"} onChange={(e) => filterTo(e.target.value)}/> : null}
	</div> : null;
}
