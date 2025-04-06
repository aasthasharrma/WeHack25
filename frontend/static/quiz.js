// Initialize the budget
let budget = 1000; // Initial budget

function displayOutcome(choice, questionNum) {
    // Different outcomes for each question
    const outcomes = {
        1: {
            'A': {text: 'You lose 30% — it keeps falling.', liquidityChange: -300},
            'B': {text: 'You\'re stopped out early — small loss.', liquidityChange: -50},
            'C': {text: 'Calls expire worthless.', liquidityChange: -200},
            'D': {text: 'Puts double in value — smart play.', liquidityChange: 250}
        },
        2: {
            'A': {text: 'Short position works well — markets continue to drop.', liquidityChange: 400},
            'B': {text: 'Bank stocks rally on higher rates.', liquidityChange: 150},
            'C': {text: 'Tech stocks recover quickly.', liquidityChange: 200},
            'D': {text: 'Cash is king during volatility.', liquidityChange: 0}
        },
        3: {
            'A': {text: 'Stock continues to moon — you make 500%!', liquidityChange: 5000},
            'B': {text: 'Stock crashes — puts pay off big time.', liquidityChange: 1000},
            'C': {text: 'You avoid the crash — no gains, no losses.', liquidityChange: 0},
            'D': {text: 'Stock drops but you collect premium.', liquidityChange: 100}
        }
    };

    // Get the outcome for this specific question and choice
    const outcome = outcomes[questionNum][choice];
    
    // Calculate new budget
    budget += outcome.liquidityChange;
    const outcomeText = `${outcome.text} New budget: $${budget}`;

    // Update the outcome text
    document.getElementById('outcomeText'+questionNum).innerText = outcomeText;

    // Update budget display
    document.getElementById('budgetDisplay').innerText = `Budget: $${budget}`;
}

// This assumes you have an HTML element with ID 'budgetDisplay' to show the budget