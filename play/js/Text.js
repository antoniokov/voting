function translate (word) {
    return {
        'one': '1',
        'two': '2',
        'three': '3',
        'four': '4',
        'five': '5'
    }[word] || word;
}
