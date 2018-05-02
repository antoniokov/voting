const systems = {
    'FPTP': {
        label: 'Обычная',
        voter: PluralityVoter,
        election: Election.plurality,
        buttonMargin: 4
    },
    'IRV': {
        label: 'Выбывание',
        voter: RankedVoter,
        election: Election.irv
    },
    'Borda': {
        label: 'Борда',
        voter: RankedVoter,
        election: Election.borda,
        buttonMargin: 4
    },
    'Condorcet': {
        label: 'Кондорсе',
        voter: RankedVoter,
        election: Election.condorcet
    },
    'Approval': {
        label: 'Одобрение',
        voter:ApprovalVoter,
        election:Election.approval,
        buttonMargin: 4
    },
    'Score': {
        label: 'Оценки',
        voter:ScoreVoter,
        election:Election.score
    }
};
