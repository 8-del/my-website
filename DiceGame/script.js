document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('loaded');

    const dice = [
        document.getElementById('die1'),
        document.getElementById('die2'),
        document.getElementById('die3'),
        document.getElementById('die4')
    ];
    const rollButton = document.getElementById('rollButton');
    const rollsLeftSpan = document.getElementById('rollsLeft');
    const scoreSpan = document.getElementById('score');
    const gameMessage = document.getElementById('gameMessage');
    const themeToggle = document.getElementById('checkbox');

    let diceValues = [0, 0, 0, 0];
    let lockedDice = [false, false, false, false];
    let rollsRemaining = 3;
    let score = 0;
    let targetNumber = 0;

    function enableDarkMode() {
        document.body.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark');
        themeToggle.checked = true;
    }

    function disableDarkMode() {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('theme', 'light');
        themeToggle.checked = false;
    }

    const currentTheme = localStorage.getItem('theme');
    if (currentTheme === 'dark') {
        enableDarkMode();
    } else {
        disableDarkMode();
    }

    themeToggle.addEventListener('change', () => {
        if (themeToggle.checked) {
            enableDarkMode();
        } else {
            disableDarkMode();
        }
    });

    function startNewRound() {
        diceValues = [0, 0, 0, 0];
        lockedDice = [false, false, false, false];
        rollsRemaining = 3;
        targetNumber = 0;
        rollsLeftSpan.textContent = rollsRemaining;
        gameMessage.textContent = "Match four numbers to win!";
        gameMessage.classList.remove('win', 'lose', 'neutral');
        gameMessage.classList.add('neutral');
        rollButton.disabled = false;
        updateDiceUI(true);
    }

    function rollDice() {
        if (rollsRemaining > 0) {
            rollsRemaining--;
            rollsLeftSpan.textContent = rollsRemaining;
            rollsLeftSpan.classList.add('changed');
            rollsLeftSpan.addEventListener('animationend', () => rollsLeftSpan.classList.remove('changed'), { once: true });

            gameMessage.textContent = "Rolling...";
            gameMessage.classList.remove('win', 'lose');
            gameMessage.classList.add('neutral');
            rollButton.disabled = true;

            let diceToRoll = [];
            dice.forEach((die, index) => {
                if (!lockedDice[index]) {
                    die.classList.add('rolling');
                    diceToRoll.push({ die, index });
                }
            });

            let newDiceValues = [...diceValues];
            diceToRoll.forEach(item => {
                newDiceValues[item.index] = Math.floor(Math.random() * 6) + 1;
            });

            let animationsCompleted = 0;
            const expectedAnimations = diceToRoll.length;

            if (expectedAnimations === 0) {
                diceValues = newDiceValues;
                checkForMatches();
                updateDiceUI();
                rollButton.disabled = false;
                return;
            }

            diceToRoll.forEach(item => {
                const onAnimationEnd = () => {
                    item.die.classList.remove('rolling');
                    item.die.removeEventListener('animationend', onAnimationEnd);

                    animationsCompleted++;

                    if (animationsCompleted === expectedAnimations) {
                        diceValues = newDiceValues;
                        checkForMatches();
                        updateDiceUI();
                        rollButton.disabled = false;
                    }
                };
                item.die.addEventListener('animationend', onAnimationEnd);
            });


        } else {
            gameMessage.textContent = "Out of rolls! New round starting...";
            gameMessage.classList.add('lose');
            rollButton.disabled = true;
            setTimeout(startNewRound, 1500);
        }
    }

    function checkForMatches() {
        if (targetNumber === 0) {
            const counts = {};
            let maxCount = 0;
            let numberToLock = 0;

            diceValues.forEach(num => {
                if (num !== 0) {
                    counts[num] = (counts[num] || 0) + 1;
                    if (counts[num] > maxCount) {
                        maxCount = counts[num];
                        numberToLock = num;
                    }
                }
            });

            if (maxCount >= 2) {
                targetNumber = numberToLock;
                gameMessage.textContent = `Goal: Get more ${targetNumber}s!`;
                for (let i = 0; i < diceValues.length; i++) {
                    if (diceValues[i] === targetNumber) {
                        lockedDice[i] = true;
                    }
                }
            } else {
                gameMessage.textContent = "No strong matches. Rolls reset for a fresh attempt!";
                rollsRemaining = 3;
                rollsLeftSpan.textContent = rollsRemaining;
                rollsLeftSpan.classList.add('changed');
                rollsLeftSpan.addEventListener('animationend', () => rollsLeftSpan.classList.remove('changed'), { once: true });

                targetNumber = 0;
                lockedDice = [false, false, false, false];
                diceValues = [0, 0, 0, 0];
                updateDiceUI(true);
            }

        } else {
            let newMatches = 0;
            for (let i = 0; i < diceValues.length; i++) {
                if (!lockedDice[i] && diceValues[i] === targetNumber) {
                    lockedDice[i] = true;
                    newMatches++;
                }
            }

            if (newMatches > 0) {
                gameMessage.textContent = `You got ${newMatches} more ${targetNumber}s!`;
            } else {
                gameMessage.textContent = `No new ${targetNumber}s this roll. Keep trying!`;
            }
        }

        checkWinCondition();
    }

    function checkWinCondition() {
        let matchingDiceCount = 0;
        for (let i = 0; i < diceValues.length; i++) {
            if (lockedDice[i] && diceValues[i] === targetNumber) {
                matchingDiceCount++;
            }
        }

        if (matchingDiceCount === 4) {
            gameMessage.textContent = `🎉 You Win! Four ${targetNumber}s! New round starting...`;
            gameMessage.classList.remove('neutral', 'lose');
            gameMessage.classList.add('win');
            score++;
            scoreSpan.textContent = score;
            scoreSpan.classList.add('changed');
            scoreSpan.addEventListener('animationend', () => scoreSpan.classList.remove('changed'), { once: true });

            rollButton.disabled = true;
            setTimeout(startNewRound, 1500);
        } else if (rollsRemaining === 0) {
            gameMessage.textContent = `Game Over! Didn't get four ${targetNumber}s. New round starting...`;
            gameMessage.classList.remove('neutral', 'win');
            gameMessage.classList.add('lose');
            rollButton.disabled = true;
            setTimeout(startNewRound, 1500);
        } else {
            if (targetNumber !== 0 && matchingDiceCount > 0) {
                 gameMessage.textContent += ` Rolls left: ${rollsRemaining}.`;
            }
        }
    }

    function updateDiceUI(clearAll = false) {
        for (let i = 0; i < dice.length; i++) {
            if (clearAll || diceValues[i] === 0) {
                dice[i].textContent = '';
                dice[i].removeAttribute('data-value');
                dice[i].classList.remove('locked');
            } else {
                dice[i].textContent = diceValues[i];
                dice[i].setAttribute('data-value', diceValues[i]);
            }
            if (lockedDice[i] && diceValues[i] !== 0) {
                dice[i].classList.add('locked');
            } else {
                dice[i].classList.remove('locked');
            }
        }
    }

    rollButton.addEventListener('click', rollDice);

    startNewRound();
});