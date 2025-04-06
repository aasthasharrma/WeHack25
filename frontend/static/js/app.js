const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) =>{
      if (entry.isIntersecting){
          entry.target.classList.add('show');
      } else{
          entry.target.classList.remove('show');
      }
  });
});

const hiddenElements = document.querySelectorAll('.hidden');
hiddenElements.forEach((el) => observer.observe(el));

document.addEventListener('DOMContentLoaded', function () {
  var boxes = document.querySelectorAll('.box');

  boxes.forEach(function (box) {
      var checkbox = box.querySelector('input[type="checkbox"]');
      checkbox.addEventListener('change', function () {
          if (checkbox.checked) {
              boxes.forEach(function (otherBox) {
                  if (otherBox !== box && otherBox.classList.contains('expanded')) {
                      otherBox.classList.remove('expanded');
                      otherBox.querySelector('input[type="checkbox"]').checked = false;
                  }
              });
              box.classList.add('expanded');
          } else {
              box.classList.remove('expanded');
          }
      });
  });
});

function toggleMobileMenu() {
  const mobileMenu = document.querySelector('.mobile-menu');
  mobileMenu.classList.toggle('active');
}

// ==============================
// 🌐 Web3.js + MetaMask Setup
// For "Lend Crypto" Tab
// ==============================

let web3;
let contract;
const contractAddress = "0x3D66F64874E0e1655f91a34E84D8864E86aF76ad"; // <-- Replace with your actual deployed contract address

const contractABI = [
{
  "anonymous": false,
  "inputs": [{"indexed": false, "internalType": "uint256", "name": "loanId", "type": "uint256"}],
  "name": "CollateralClaimed",
  "type": "event"
},
{
  "anonymous": false,
  "inputs": [{"indexed": false, "internalType": "uint256", "name": "loanId", "type": "uint256"}],
  "name": "CollateralRefunded",
  "type": "event"
},
{
  "anonymous": false,
  "inputs": [{"indexed": false, "internalType": "uint256", "name": "loanId", "type": "uint256"}],
  "name": "LoanCancelled",
  "type": "event"
},
{
  "anonymous": false,
  "inputs": [{"indexed": false, "internalType": "uint256", "name": "loanId", "type": "uint256"}],
  "name": "LoanCheckpointFailed",
  "type": "event"
},
{
  "anonymous": false,
  "inputs": [
    {"indexed": false, "internalType": "uint256", "name": "loanId", "type": "uint256"},
    {"indexed": false, "internalType": "address", "name": "borrower", "type": "address"},
    {"indexed": false, "internalType": "uint256", "name": "collateralAmount", "type": "uint256"}
  ],
  "name": "LoanCreated",
  "type": "event"
},
{
  "anonymous": false,
  "inputs": [
    {"indexed": false, "internalType": "uint256", "name": "loanId", "type": "uint256"},
    {"indexed": false, "internalType": "address", "name": "lender", "type": "address"}
  ],
  "name": "LoanFunded",
  "type": "event"
},
{
  "anonymous": false,
  "inputs": [{"indexed": false, "internalType": "uint256", "name": "loanId", "type": "uint256"}],
  "name": "LoanRepaid",
  "type": "event"
},
{
  "inputs": [{"internalType": "uint256", "name": "_loanId", "type": "uint256"}],
  "name": "cancelLoan",
  "outputs": [],
  "stateMutability": "nonpayable",
  "type": "function"
},
{
  "inputs": [{"internalType": "uint256", "name": "_loanId", "type": "uint256"}],
  "name": "checkMidwayCheckpoint",
  "outputs": [],
  "stateMutability": "nonpayable",
  "type": "function"
},
{
  "inputs": [],
  "name": "contractBalance",
  "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
  "stateMutability": "view",
  "type": "function"
},
{
  "inputs": [
    {"internalType": "uint256", "name": "_loanAmount", "type": "uint256"},
    {"internalType": "uint256", "name": "_interestRate", "type": "uint256"},
    {"internalType": "uint256", "name": "_durationInMonths", "type": "uint256"}
  ],
  "name": "createLoan",
  "outputs": [],
  "stateMutability": "payable",
  "type": "function"
},
{
  "inputs": [{"internalType": "uint256", "name": "_loanId", "type": "uint256"}],
  "name": "fundLoan",
  "outputs": [],
  "stateMutability": "payable",
  "type": "function"
},
{
  "inputs": [],
  "name": "loanIdCounter",
  "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
  "stateMutability": "view",
  "type": "function"
},
{
  "inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
  "name": "loans",
  "outputs": [
    {"internalType": "address payable", "name": "borrower", "type": "address"},
    {"internalType": "address payable", "name": "lender", "type": "address"},
    {"internalType": "uint256", "name": "collateralAmount", "type": "uint256"},
    {"internalType": "uint256", "name": "loanAmount", "type": "uint256"},
    {"internalType": "uint256", "name": "interestRate", "type": "uint256"},
    {"internalType": "uint256", "name": "duration", "type": "uint256"},
    {"internalType": "uint256", "name": "startTime", "type": "uint256"},
    {"internalType": "uint8", "name": "status", "type": "uint8"}
  ],
  "stateMutability": "view",
  "type": "function"
},
{
  "inputs": [{"internalType": "uint256", "name": "_loanId", "type": "uint256"}],
  "name": "repayLoan",
  "outputs": [],
  "stateMutability": "payable",
  "type": "function"
},
{
  "stateMutability": "payable",
  "type": "receive"
}
];


window.addEventListener("load", async () => {
  if (window.ethereum) {
      web3 = new Web3(window.ethereum);
      try {
          await window.ethereum.request({ method: "eth_requestAccounts" });
          const accounts = await web3.eth.getAccounts();
          console.log("✅ Connected wallet:", accounts[0]);

          contract = new web3.eth.Contract(contractABI, contractAddress);

          // 👇 This is the new line to add:
          loadLoanRequests();

      } catch (error) {
          console.error("❌ User denied MetaMask access:", error);
      }
  } else {
      alert("MetaMask is not installed. Please install MetaMask to use this feature.");
  }
});


async function connectWallet() {
  if (window.ethereum) {
      web3 = new Web3(window.ethereum);
      try {
          await window.ethereum.request({ method: "eth_requestAccounts" });
          const accounts = await web3.eth.getAccounts();
          console.log("✅ Connected wallet:", accounts[0]);
          contract = new web3.eth.Contract(contractABI, contractAddress);
      } catch (error) {
          console.error("❌ User denied MetaMask access:", error);
      }
  } else {
      alert("MetaMask is not installed. Please install MetaMask to use this feature.");
  }
}
// Attach connectWallet to the global window object so that the inline onclick can access it.
window.connectWallet = connectWallet;


async function createLoan() {
  const accounts = await web3.eth.getAccounts();
  const from = accounts[0];

  const loanAmount = web3.utils.toWei(document.getElementById("loanAmount").value, "ether");
  const interestRate = parseInt(document.getElementById("interestRate").value);
  const durationMonths = parseInt(document.getElementById("duration").value);
  const collateralAmount = web3.utils.toWei(document.getElementById("collateralAmount").value, "ether");
  const stockTicker = document.getElementById('stock_ticker').value;

  console.log("loanAmount:", loanAmount);
  console.log("interestRate:", interestRate);
  console.log("durationMonths:", durationMonths);
  console.log("collateralAmount (sent as value):", collateralAmount);

  try {
      await contract.methods.createLoan(loanAmount, interestRate, durationMonths).send({
          from,
          value: collateralAmount,
          gas: 3000000
      });
      
      // Store analysis data with the loan
      const analysisData = {
          stockTicker,
          timestamp: new Date().toISOString(),
          modelPrediction: document.getElementById('model-prediction').innerHTML,
          newsSummary: document.getElementById('news-summary').innerHTML,
          redditSummary: document.getElementById('reddit-summary').innerHTML
      };
      
      // You might want to store this data in your backend or IPFS
      console.log('Analysis data stored with loan:', analysisData);
      
      alert("✅ Loan created successfully!");
      loadLoanRequests(); // Refresh the loan list
  } catch (err) {
      console.error("❌ Loan creation failed:", err);
      alert("Error creating loan. Please check your wallet and try again.");
  }
}


async function fundLoan(loanId, principal) {
  const accounts = await web3.eth.getAccounts();
  const from = accounts[0];

  try {
    await contract.methods.fundLoan(loanId).send({
      from,
      value: principal,
      gas: 3000000
    });

    alert("✅ Loan funded!");
    loadLoanRequests(); // Refresh loan list
  } catch (error) {
    console.error("🔴 Error funding loan:", error);
    alert("Funding failed. Check console.");
  }
}


async function loadLoanRequests() {
  const loanListContainer = document.getElementById("loanList");
  loanListContainer.innerHTML = "";

  try {
    const totalLoans = await contract.methods.loanIdCounter().call();

    for (let i = 1; i <= totalLoans; i++) {
      const loan = await contract.methods.loans(i).call();

      // ✅ Only show Pending loans
      if (parseInt(loan.status) === 0) {
        const loanCard = document.createElement("div");
        loanCard.style.border = "1px solid #999";
        loanCard.style.borderRadius = "10px";
        loanCard.style.padding = "15px";
        loanCard.style.marginBottom = "15px";
        loanCard.style.background = "#f9f9f9";

        const principalETH = web3.utils.fromWei(loan.loanAmount.toString(), "ether");
        const collateralETH = web3.utils.fromWei(loan.collateralAmount.toString(), "ether");
        const durationMonths = Math.round(Number(loan.duration) / (30 * 24 * 60 * 60));
        

        loanCard.innerHTML = `
          <p><strong>Loan ID:</strong> ${i}</p>
          <p><strong>Principal:</strong> ${principalETH} ETH</p>
          <p><strong>Collateral:</strong> ${collateralETH} ETH</p>
          <p><strong>Interest:</strong> ${loan.interestRate}%</p>
          <p><strong>Duration:</strong> ${durationMonths} months</p>
          <button onclick="fundLoan(${i}, '${loan.loanAmount}')">Fund This Loan</button>
        `;

        loanListContainer.appendChild(loanCard);
      }
    }
  } catch (error) {
    console.error("🔴 Error loading loan requests:", error);
    loanListContainer.innerHTML = "<p style='color:red;'>Failed to load loans. Check console.</p>";
  }
}



// Stock Analysis Functions
async function analyzeStock() {
    console.log("analyzeStock function called");
    const stockTicker = document.getElementById('stock_ticker').value;
    console.log("Stock ticker:", stockTicker);
    
    if (!stockTicker) {
        alert('Please enter a stock ticker');
        return;
    }

    try {
        // Show loading state
        console.log("Showing loading spinner");
        document.getElementById('analysis-results').style.display = 'none';
        document.getElementById('loading-spinner').style.display = 'block';

        console.log("Sending request to backend");
        const response = await fetch('http://localhost:5000/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ stock_ticker: stockTicker })
        });

        console.log("Response received:", response.status);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        console.log("Data received:", data);
        displayResults(data);
        
        // Hide loading state and show results
        document.getElementById('loading-spinner').style.display = 'none';
        document.getElementById('analysis-results').style.display = 'block';
    } catch (error) {
        console.error('Error:', error);
        alert('Error analyzing stock. Please try again.');
        document.getElementById('loading-spinner').style.display = 'none';
    }
}

function displayResults(data) {
    console.log("displayResults function called with data:", data);
    
    // Update news summary
    const newsSummary = document.getElementById('news-summary');
    console.log("newsSummary element:", newsSummary);
    
    if (data.news_summary === "Insufficient data") {
        newsSummary.innerHTML = `
            <h3>News Analysis</h3>
            <p><strong>Stock:</strong> ${data.stock_ticker}</p>
            <p>No recent news articles found for this stock. Please try again later or check a different stock ticker.</p>
        `;
    } else {
        try {
            console.log("Processing news summary data");
            
            // Format the news analysis according to the requested format
            let newsHtml = `<h3>News Analysis</h3>`;
            newsHtml += `<p><strong>Stock:</strong> ${data.stock_ticker}</p>`;
            
            // Count total articles
            let totalArticles = 0;
            if (data.news_summary && data.news_summary.sources) {
                Object.values(data.news_summary.sources).forEach(source => {
                    totalArticles += source.Articles || 0;
                });
            }
            newsHtml += `<p><strong>Total articles analyzed:</strong> ${totalArticles}</p>`;
            
            // Add source breakdown
            newsHtml += `<p><strong>Source Breakdown:</strong></p>`;
            if (data.news_summary && data.news_summary.sources) {
                Object.entries(data.news_summary.sources).forEach(([source, summary]) => {
                    if (summary.Articles > 0) {
                        newsHtml += `<p>  ${source}: ${summary.Articles} articles, Sentiment: ${summary.Avg_Sentiment}, Decision: ${summary.Decision}</p>`;
                    }
                });
            }
            
            // Add overall recommendation
            if (data.news_summary && data.news_summary.recommendation) {
                newsHtml += `<p><strong>Overall Recommendation:</strong> ${data.news_summary.recommendation}</p>`;
            }
            
            newsSummary.innerHTML = newsHtml;
        } catch (error) {
            console.error('Error displaying results:', error);
            newsSummary.innerHTML = `
                <h3>News Analysis</h3>
                <p><strong>Stock:</strong> ${data.stock_ticker}</p>
                <p>Error processing news data. Please try again later.</p>
            `;
        }
    }

    // Update Reddit summary
    const redditSummary = document.getElementById('reddit-summary');
    console.log("redditSummary element:", redditSummary);
    
    if (data.reddit_summary === "Insufficient data") {
        console.log("Insufficient Reddit data");
        redditSummary.innerHTML = `
            <h3>Reddit Analysis</h3>
            <p><strong>Stock:</strong> ${data.stock_ticker}</p>
            <p>No recent Reddit discussions found for this stock. Please try again later or check a different stock ticker.</p>
        `;
    } else {
        try {
            console.log("Processing Reddit summary data:", data.reddit_summary);
            
            // Format the Reddit analysis
            let redditHtml = `<h3>Reddit Analysis</h3>`;
            redditHtml += `<p><strong>Stock:</strong> ${data.stock_ticker}</p>`;
            
            // Count total posts
            let totalPosts = 0;
            if (data.reddit_summary && data.reddit_summary.subreddits) {
                Object.values(data.reddit_summary.subreddits).forEach(subreddit => {
                    totalPosts += subreddit.Posts || 0;
                });
            }
            redditHtml += `<p><strong>Total posts analyzed:</strong> ${totalPosts}</p>`;
            
            // Add subreddit breakdown
            redditHtml += `<p><strong>Subreddit Breakdown:</strong></p>`;
            if (data.reddit_summary && data.reddit_summary.subreddits) {
                Object.entries(data.reddit_summary.subreddits).forEach(([subreddit, summary]) => {
                    if (summary.Posts > 0) {
                        redditHtml += `<p>  r/${subreddit}: ${summary.Posts} posts, Sentiment: ${summary.Avg_Sentiment}, Decision: ${summary.Decision}</p>`;
                    }
                });
            }
            
            // Add overall recommendation
            if (data.reddit_summary && data.reddit_summary.recommendation) {
                redditHtml += `<p><strong>Overall Recommendation:</strong> ${data.reddit_summary.recommendation}</p>`;
            }
            
            redditSummary.innerHTML = redditHtml;
        } catch (error) {
            console.error('Error displaying Reddit results:', error);
            redditSummary.innerHTML = `
                <h3>Reddit Analysis</h3>
                <p><strong>Stock:</strong> ${data.stock_ticker}</p>
                <p>Error processing Reddit data. Please try again later.</p>
            `;
        }
    }

    // Update model prediction
    const modelPrediction = document.getElementById('model-prediction');
    console.log("modelPrediction element:", modelPrediction);
    
    if (data.model_prediction) {
        console.log("Processing model prediction data:", data.model_prediction);
        
        // Check if model_prediction is a string (error message) or an object
        if (typeof data.model_prediction === 'string') {
            modelPrediction.innerHTML = `
                <h3>Model Prediction</h3>
                <p><strong>Stock:</strong> ${data.stock_ticker}</p>
                <p>${data.model_prediction}</p>
            `;
        } else {
            let predictionHtml = `
                <h3>Model Prediction</h3>
                <p><strong>Stock:</strong> ${data.stock_ticker}</p>
                <p>${data.model_prediction.message}</p>
                <p><strong>Date:</strong> ${data.model_prediction.date}</p>
                <p><strong>Confidence:</strong> ${data.model_prediction.confidence_percentile.toFixed(2)}%</p>
            `;
            
            // Add visual indicator based on direction
            if (data.model_prediction.direction === "UP") {
                predictionHtml += `<p class="prediction-up">📈 UP</p>`;
            } else if (data.model_prediction.direction === "DOWN") {
                predictionHtml += `<p class="prediction-down">📉 DOWN</p>`;
            } else {
                predictionHtml += `<p class="prediction-flat">➡️ FLAT</p>`;
            }
            
            modelPrediction.innerHTML = predictionHtml;
        }
    } else {
        console.log("No model prediction available");
        modelPrediction.innerHTML = `
            <h3>Model Prediction</h3>
            <p><strong>Stock:</strong> ${data.stock_ticker}</p>
            <p>No model prediction available for this stock at this time.</p>
        `;
    }

    // Enable/disable loan creation based on analysis
    updateLoanCreationAvailability(data);
}

function updateLoanCreationAvailability(data) {
    console.log("updateLoanCreationAvailability function called with data:", data);
    
    const createLoanButton = document.getElementById('create-loan-button');
    const loanForm = document.getElementById('loan-form');
    
    console.log("createLoanButton element:", createLoanButton);
    console.log("loanForm element:", loanForm);
    
    if (data.model_prediction && data.model_prediction.confidence_percentile >= 70) {
        console.log("Enabling loan creation button");
        createLoanButton.disabled = false;
        loanForm.style.opacity = '1';
        createLoanButton.title = 'Create a loan based on this analysis';
    } else {
        console.log("Disabling loan creation button");
        createLoanButton.disabled = true;
        loanForm.style.opacity = '0.5';
        createLoanButton.title = 'Analysis confidence too low for loan creation';
    }
}

// Attach functions to the global window object
window.analyzeStock = analyzeStock;
window.createLoan = createLoan;
window.connectWallet = connectWallet;
window.fundLoan = fundLoan;



