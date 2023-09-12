import { extname } from 'path';

const preprocessString = (str) => str[0] !== '\ufeff' ? `\ufeff${str}` : str;

const toByteArray = b64Data => {
	const sliceSize = 512;

	const byteCharacters = window.atob(b64Data);
	const byteArrays = [];

	for(let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
		const slice = byteCharacters.slice(offset, offset + sliceSize);

		const byteNumbers = new Array(slice.length);
		for (let i = 0; i < slice.length; i++) {
			byteNumbers[i] = slice.charCodeAt(i);
		}

		const byteArray = new Uint8Array(byteNumbers);

		byteArrays.push(byteArray);
	}

	return byteArrays;
};

//https://stackoverflow.com/questions/9267899/arraybuffer-to-base64-encoded-string
const arrayBufferToBase64 = ( buffer ) => {
    let binary = '';
    let bytes = new Uint8Array( buffer );
    const len = bytes.byteLength;
		// BOM
		killTheBOM(bytes);
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode( bytes[ i ] );
    }
    return window.btoa( binary );
};

/////
const typeAccess = [
	{ ext: "csv",  content: "text/csv" },
	{ ext: "xml",  content: "text/xml" },
	{ ext: "json", content: "application/json" },
	{ ext: 'svg',  content: "text/svg" },
	{ ext: 'txt',  content: "text/plain" },
	{ ext: 'json', content: "application/json" },
	{ ext: 'pdf',  content: "application/pdf" },
	{ ext: 'xls',  content: "application/vnd.ms-excel" },
	{ ext: ['zip', 'docx', 'xlsx'], content: "application/zip" }
];

function getContentType(ne) { 
	return typeAccess.find(function (t) {
		const { ext } = t;
		return Array.isArray(ext) ? ext.find(y => '.' + y === ne) !== -1 : ('.' + ext) === ne;
	});
}

const getFileType = function (name) {

	const ne = extname(name);
	if (!ne) { return; }

	const type = getContentType(ne);

	return type;
};

const blob = {
	to: (c,enc,type) => new Blob(enc === 'arrayBuffer' || Array.isArray(c) ? c : enc === 'base64' ? toByteArray(c) : [preprocessString(c)], {type: type || ''})
};

export const base64 = {
		to: (c, encoding) => {
			switch(encoding){
				case 'base64':
					return c;
				case 'arraybuffer':
				case 'arrayBuffer':
				case 'ArrayBuffer':
				case 'array buffer':
				case 'Array Buffer':
				case 'Array buffer':
					return arrayBufferToBase64(c);
				default:
					return Buffer.from( preprocessString(c), encoding || 'utf8').toString('base64'); /// passed as is to Buffer, defaults to utf8
			}
		}
};

function downloadRef({ content, contentType, fileName, encoding }) {

	// utils
	const isBlob = () => encoding === 'blob' || (content.size && content.type && Object.keys(content).length === 2);
	const isIE = () => window.navigator && window.navigator.msSaveBlob; // IE => blob

	// params
	// file name
	const fileNameToUse = fileName ? getFileType(fileName) ? fileName : fileName + '.csv' : 'download.csv';
	// ref
	const contentTypeToUser = contentType || getFileType(fileNameToUse) || 'text/csv';

	//FROM https://stackoverflow.com/questions/695151/data-protocol-url-size-limitations
	const ref = () => {
		if (isIE()) { // no ref
			window.navigator.msSaveOrOpenBlob(isBlob() ? content : blob.to(content, encoding), fileNameToUse);
			return;
		} else if (isBlob() || content.length > 500000) { // blob
			return window.URL.createObjectURL(isBlob() ? content : blob.to(content, encoding), { type: contentTypeToUser });
		} else { // link
			return `data:${contentTypeToUser};base64,${base64.to(content, encoding)}`;
		}
	};

	return { href: ref(), fileNameToUse };

}

export function downloadData({ content, contentType, fileName, encoding }) {

	const { href, fileNameToUse } = downloadRef({ content, contentType, fileName, encoding });

	const downloadLink = document.createElement('a');
	if (href) {
		downloadLink.setAttribute('href', href);
	}
	downloadLink.setAttribute('download', fileNameToUse);
	document.body.appendChild(downloadLink);      //needed by Firefox but not by chrome
	downloadLink.click();
	document.body.removeChild(downloadLink);      //Revert the append
}
