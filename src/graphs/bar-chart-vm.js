import { isNil } from '../core/utils.js';

export let vm = {
	create: (get, { props, motherCss }) => {
		return {
			css: isNil(props.css) ? motherCss : props.css,
			show: false
		};
	}
};
