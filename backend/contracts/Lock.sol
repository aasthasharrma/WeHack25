// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract PeerToPeerLending {
    enum LoanStatus { Pending, Active, Completed, Defaulted, Cancelled }

    struct Loan {
        address payable borrower;
        address payable lender;
        uint256 collateralAmount;
        uint256 loanAmount;
        uint256 interestRate; // in percentage
        uint256 duration; // in seconds
        uint256 startTime;
        LoanStatus status;
    }

    uint256 public loanIdCounter;
    mapping(uint256 => Loan) public loans;

    event LoanCreated(uint256 loanId, address borrower, uint256 collateralAmount);
    event LoanFunded(uint256 loanId, address lender);
    event LoanCheckpointFailed(uint256 loanId);
    event CollateralClaimed(uint256 loanId);
    event LoanRepaid(uint256 loanId);
    event LoanCancelled(uint256 loanId);
    event CollateralRefunded(uint256 loanId);

    modifier onlyBorrower(uint256 _loanId) {
        require(msg.sender == loans[_loanId].borrower, "Not the borrower");
        _;
    }

    modifier onlyLender(uint256 _loanId) {
        require(msg.sender == loans[_loanId].lender, "Not the lender");
        _;
    }

    function createLoan(uint256 _loanAmount, uint256 _interestRate, uint256 _durationInMonths) external payable {
        require(msg.value > 0, "Collateral required");

        loanIdCounter++;
        uint256 _loanId = loanIdCounter;

        loans[_loanId] = Loan({
            borrower: payable(msg.sender),
            lender: payable(address(0)),
            collateralAmount: msg.value,
            loanAmount: _loanAmount,
            interestRate: _interestRate,
            duration: _durationInMonths * 30 days,
            startTime: 0,
            status: LoanStatus.Pending
        });

        emit LoanCreated(_loanId, msg.sender, msg.value);
    }

    function fundLoan(uint256 _loanId) external payable {
        Loan storage loan = loans[_loanId];
        require(loan.status == LoanStatus.Pending, "Loan already funded or closed");
        require(msg.value == loan.loanAmount, "Incorrect loan amount");

        loan.lender = payable(msg.sender);
        loan.status = LoanStatus.Active;
        loan.startTime = block.timestamp;

        loan.borrower.transfer(msg.value);

        emit LoanFunded(_loanId, msg.sender);
    }

    function cancelLoan(uint256 _loanId) external onlyBorrower(_loanId) {
        Loan storage loan = loans[_loanId];
        require(loan.status == LoanStatus.Pending, "Only pending loans can be cancelled");

        loan.status = LoanStatus.Cancelled;
        loan.borrower.transfer(loan.collateralAmount);

        emit LoanCancelled(_loanId);
        emit CollateralRefunded(_loanId);
    }

    function checkMidwayCheckpoint(uint256 _loanId) external {
        Loan storage loan = loans[_loanId];
        require(loan.status == LoanStatus.Active, "Loan is not active");
        require(block.timestamp >= loan.startTime + loan.duration / 2, "Checkpoint not reached");

        uint256 expectedValue = loan.loanAmount + (loan.loanAmount * loan.interestRate / 100);
        uint256 halfwayValue = expectedValue / 2;

        if (address(this).balance < loan.collateralAmount + halfwayValue) {
            loan.lender.transfer(loan.collateralAmount);
            loan.status = LoanStatus.Defaulted;

            emit LoanCheckpointFailed(_loanId);
            emit CollateralClaimed(_loanId);
        }
    }

    function repayLoan(uint256 _loanId) external payable onlyBorrower(_loanId) {
        Loan storage loan = loans[_loanId];
        require(loan.status == LoanStatus.Active, "Loan is not active");
        require(block.timestamp <= loan.startTime + loan.duration, "Loan expired");

        uint256 repaymentAmount = loan.loanAmount + (loan.loanAmount * loan.interestRate / 100);
        require(msg.value >= repaymentAmount, "Insufficient repayment");

        loan.lender.transfer(repaymentAmount);
        loan.borrower.transfer(loan.collateralAmount);

        // Refund overpayment if any
        if (msg.value > repaymentAmount) {
            payable(msg.sender).transfer(msg.value - repaymentAmount);
        }

        loan.status = LoanStatus.Completed;

        emit LoanRepaid(_loanId);
    }

    function contractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    receive() external payable {}
}
