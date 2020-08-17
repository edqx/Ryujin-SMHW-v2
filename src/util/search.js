function intersection(str1, str2) {
    let n = 0;
    let li = -1;
    let _li;

    for (let i = 0; i < str2.length; i++) {
        if (_li = str1.indexOf(str2[i], li) !== -1) {
            li = _li;
            n++;
        } else {
            return false;
        }
    }

    return n;
}

export function searchArray(_arr, prop, term) {
    let arr = _arr.slice();

    arr.sort((a, b) => intersection(prop(b), term.toLowerCase()) - intersection(prop(a), term.toLowerCase()));
    arr.sort((a, b) => prop(a).toLowerCase().indexOf(term.toLowerCase()) !== -1 ? -1 : 0);

    return arr.filter(a => intersection(prop(a), term.toLowerCase()));
}