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
const contractABI = [ /* Paste your contract ABI here */ ];

window.addEventListener("load", async () => {
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

    // Replace with your own input values or form bindings
    const loanAmount = web3.utils.toWei("1", "ether");
    const interestRate = 10; // 10%
    const durationMonths = 2;
    const collateralAmount = web3.utils.toWei("0.5", "ether");

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

async function fundLoan() {
    const accounts = await web3.eth.getAccounts();
    const from = accounts[0];

    const loanId = document.getElementById("loanIdInput").value;
    const loanAmount = web3.utils.toWei("1", "ether");

    try {
        await contract.methods.fundLoan(loanId).send({
            from,
            value: loanAmount,
            gas: 3000000
        });
        alert("✅ Loan funded successfully!");
    } catch (err) {
        console.error("❌ Loan funding failed:", err);
        alert("Error funding loan.");
    }
}
