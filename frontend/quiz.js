// Initialize the budget
let budget = 1000; // Initial budget

function displayOutcome(choice,questionNum) {
    const outcomes = {
        'A': {text: 'You lose 30% — it keeps falling.', liquidityChange: -300},
        'B': {text: 'You’re stopped out early — small loss.', liquidityChange: -50},
        'C': {text: 'Calls expire worthless.', liquidityChange: -200},
        'D': {text: 'Puts double in value — smart play.', liquidityChange: 250}
    };

    // Calculate new budget
    budget += outcomes[choice].liquidityChange;
    const outcomeText = `${outcomes[choice].text} New budget: $${budget}`;

    // Update the outcome text
    document.getElementById('outcomeText'+questionNum).innerText = outcomeText;

    // Optionally, update budget display if you have a separate element for it
    document.getElementById('budgetDisplay').innerText = `Budget: $${budget}`;
}

// This assumes you have an HTML element with ID 'budgetDisplay' to show the budget
