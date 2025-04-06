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
        alert("✅ Loan created successfully!");
    } catch (err) {
        console.error("❌ Loan creation failed:", err);
        alert("Error creating loan.");
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
  
  


