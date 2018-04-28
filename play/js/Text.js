function translate (word) {
    return {
        'FPTP': 'Обычная',
        'IRV': 'Выбывание',
        'Borda': 'Борда',
        'Condorcet': 'Кондорсе',
        'Approval': 'Одобрение',
        'Score': 'Оценка',

        'square': 'квадрат',
        'triangle': 'треугольник',
        'pentagon': 'пятиугольник',
        'hexagon': 'шестиугольник',
        'bob': 'круг',

        'one': '1',
        'two': '2',
        'three': '3',
        'four': '4',
        'five': '5'
    }[word] || word;
}
