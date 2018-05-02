// YES, TAU.
Math.TAU = Math.PI*2;

// For the election sandbox code
function _icon(candidate){
	return "<img src='" + candidates[candidate].icon + "'/>";
}

function metadataToArray(meta) {
    return Object.keys(meta).map(function (e) {
        const obj = meta[e];
        obj.id = e;
        return obj;
    })
}