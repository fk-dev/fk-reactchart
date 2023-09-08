import React from "react";
import { flatten, extend } from "underscore";

import { iconer } from "../icons/iconer.jsx";
import { shader } from "./colorMgr.js";
import * as evMgr from "./events-mgr.js";
import { newGradient, getAGradientVM, remove } from "./gradient-mgr.js";
import Gradienter from "../Gradienter.jsx";
const filterDateEvents = {
	"1M":{
		onClick: 'filterOneMonth',
		label:'1m'
	},
	"3M":{
		onClick: 'filterThreeMonths',
		label:'3m'
	},
	"6M":{
		onClick: 'filterSixMonths',
		label:'6m'
	},
	"YTD":{
		onClick: 'filterYTD',
		label:'ytd'
	},
	"1Y": {
		onClick: 'filterOneYear',
		label:'1y'
	},
	"3Y":{
		onClick: 'filterThreeYears',
		label:'3y'
	},
	"5Y":{
		onClick: 'filterFiveYears',
		label:'5y'
	},
	"ALL":{
		onClick:'filterAll',
		label:'Tout'
	},
	'from':{
		onChange:'from',
	},
	'to':{
		onChange:'to'
	}
};
export const vm = {
  create: function (get, { props, mgrId, keys }) {
    const events = evMgr.create(props.legend.events);
		const filterDates = props.dateFilters||[];/*[{ interval: "1M", label: "1m" },{ interval: "date" }, ]*/
    const filterEvents = filterDates.map(
      ({interval,label}) => {
				// console.log("check event:"+JSON.stringify({event:filterDateEvents[interval],interval}));
        return {
          event: evMgr.create(filterDateEvents[interval]),
          label:label || filterDateEvents[interval].label||'',
					interval
        };
      }
    ); //[{onClick:filterNyears},...]
    // for icon, just to help reading
    const icw = props.legend.iconWidth - 2 * props.legend.iconHMargin;
    const ich = props.legend.iconHeight - 2 * props.legend.iconVMargin;
    const ichm = props.legend.iconHMargin;
    const icvm = props.legend.iconVMargin;

    const getALegend = (data, gprops, idx, grad, key) => {
      let icc = gprops.color;
      const sha = extend({}, gprops.shader);
      // will use css inline style
      if (sha && sha.options) {
        // type is shade or color
        const colors =
          sha.type === "shade" ? [icc, "white"] : sha.options.colors;
        const offsets = sha.type === "shade" ? null : sha.options.offsets;
        grad.id = newGradient({ colors, offsets }, mgrId);
      }
      const ics = gprops.width < 2 ? gprops.width * 1.5 : gprops.width; // slightly more bold, if needed
      const gradVM = getAGradientVM(mgrId, grad.id);
      const iconProps = {
        color: icc,
        width: icw,
        height: ich,
        hMargin: ichm,
        vMargin: icvm,
        strokeWidth: ics,
        faded: !props.graphProps[idx].show,
        clickable: events.hasClick,
      };
      let perPoint = [];
      if (data.series) {
        for (let p = 0; p < data.series.length; p++) {
          if (data.series[p].legend) {
            let point = data.series[p];
            let typeMark = gprops.markType;
            iconProps.color = point.color || shader(p);
            perPoint.push({
              icon: {
                icon: (pr) => (
                  <svg width={pr.width} height={pr.height}>
                    {gradVM ? (
                      <defs>
                        <Gradienter state={gradVM} />
                      </defs>
                    ) : null}
                    {iconer(pr, typeMark, grad.id)}
                  </svg>
                ),
                props: extend({}, iconProps),
              },
              label: point.legend || "data #" + idx,
              click: events.onClick(idx),
							key: `${key}.${p}`
            });
          }
        }
      }

      return perPoint.length !== 0
        ? perPoint
        : {
            icon: {
              icon: (p) => (
                <svg width={p.width} height={p.height}>
                  {gradVM ? (
                    <defs>
                      <Gradienter state={gradVM} />
                    </defs>
                  ) : null}
                  {gprops.onlyMarks ? null : iconer(p, "line")}
                  {gprops.mark ? iconer(p, gprops.markType, grad.id) : null}
                </svg>
              ),
              props: iconProps,
            },
						key,
            label: gprops.name || "graph #" + idx,
            click: events.onClick(idx),
          };
    };

    let leg = [];
    for (let i = 0; i < props.data.length; i++) {
      let grad = {};
      leg.push(getALegend(props.data[i], props.graphProps[i], i, grad, keys[i]));
      if (grad.id) {
        remove(mgrId, grad.id);
      }
    }
    let rectRef={};
    const handleHover = (index) => {
      // console.log("on hover  - ref:",rectRef[index]);
      rectRef[index].setAttribute(
        "style",
        "fill: #cfcfcf; box-shadow: 0 0 5px rgba(0, 0, 0, 0.3);"
      );
    };
    const handleClick = (index) => {
      // console.log("onClick - ref:",rectRef[index]);
      Object.keys(rectRef).forEach(index=>{
        rectRef[index].setAttribute("style", "fill: #f7f7f7; box-shadow: none; font-size:500");
        rectRef[index].clicked = false;
      });
      rectRef[index].clicked = true;
      
      rectRef[index].setAttribute(
        "style",
        "fill: #cfcfcf; box-shadow: 0 0 5px rgba(0, 0, 0, 0.3);"
      );
    };
    const handleMouseLeave = (index) => {
      if(rectRef[index].clicked){
        return;
      }
      rectRef[index].setAttribute("style", "fill: #f7f7f7; box-shadow: none;");
    };
    let res = flatten(leg);
    const dateFilters = filterEvents.map(
      ({event,label,interval},index) => {
				if(['from','to'].includes(interval)){
					return {
						icon: {
							icon: (pr) => (
								<input
									type="text"
									placeholder={label}
									onFocus={(e) => {
										e.target.type = "date";
									}}
									onBlur={(e) => {
										e.target.type = "text";
									}}
									onChange = {pr.change}
									style={{ width: 100,marginLeft:interval === "from"? 100:10 }}
								/>
							),
							props: {
								color: "#eb4034",
								width: 30,
								height: 20,
								strokeWidth: 2,
								hMargin: 0,
								vMargin: 0,
								clickable: interval,
							},
						},
						click: e=>e,
						change:event.onChange(),
						label: "",
					};
				}else{
					return {
						icon: {
							icon: (pr) => (
								<svg
									width={pr.width}
									height={pr.height}
									style={{marginRight: 5,marginLeft:index === 0 ? 50:0}}
								>
                  <g onMouseOver={()=>handleHover(index)}
									onMouseLeave={()=>handleMouseLeave(index)}
                  onClick={()=>handleClick(index)}
                  >
									<rect
									ref={ref =>{rectRef[index] = ref;}}
									style={{
										fill: interval ==="ALL" ? "#cfcfcf": "#f7f7f7",
										transition: "fill 0.3s",
										cursor: "pointer",
									}}
										width={40}
										height={25}
										rx={3}
										ry={3}
									/>
									<text fill="black" fontWeight={300} x={3} y={18} fontFamily="Lucida Grande, Lucida Sans Unicode, Arial, Helvetica, sans-serif">
										{label}
									</text>
                  </g>
								</svg>
							),
							props: {
								width: 40,
								height: 25,
								strokeWidth: 2,
								hMargin: 0,
								vMargin: 0,
								clickable: label,
							},
						},
						click: event.onClick(),					
					};
				}
      }
    );

    res.push(...dateFilters);
    
    return res;
  },
};
