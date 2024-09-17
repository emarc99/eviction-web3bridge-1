import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-network-helpers");

async function main() {
    const ROUTER_ADDRESS = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
    const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
    const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

    const TOKEN_HOLDER = "0xf584F8728B874a6a5c7A8d4d387C9aae9172D621";

    await helpers.impersonateAccount(TOKEN_HOLDER);
    const impersonatedSigner = await ethers.getSigner(TOKEN_HOLDER);

    const amountOut = ethers.parseUnits("1", 18); // 1 ETH to swap for exact amount
    const amountInMax = ethers.parseUnits("3000", 6); // Max 3000 USDC

    const amountOutMin = ethers.parseUnits("1000", 6); // Minimum 1000 USDC for swapExactETHForTokens
    const ethAmount = ethers.parseUnits("1", 18); // 1 ETH to be swapped for tokens

    // USDC and WETH contract instances
    const USDC_Contract = await ethers.getContractAt(
        "IERC20",
        USDC,
        impersonatedSigner
    );
    const WETH_Contract = await ethers.getContractAt(
        "IERC20",
        WETH,
        impersonatedSigner
    );

    // Uniswap Router contract
    const ROUTER = await ethers.getContractAt(
        "IUniswapV2Router",
        ROUTER_ADDRESS,
        impersonatedSigner
    );

    // Approve USDC for the swap
    const approveTx = await USDC_Contract.approve(ROUTER_ADDRESS, amountInMax);
    await approveTx.wait();

    // Log balances before the first swap
    const ETHERS_BALANCE_BEFORE_SWAP_1 = await ethers.provider.getBalance(TOKEN_HOLDER);
    console.log("ETH Balance before swapTokensForExactETH: ", ethers.formatUnits(ETHERS_BALANCE_BEFORE_SWAP_1, 18));

    // First swap: swapTokensForExactETH (USDC -> ETH)
    const deadline1 = Math.floor(Date.now() / 1000) + 60 * 10; // 10-minute deadline
    const txReceipt1 = await ROUTER.swapTokensForExactETH(
        amountOut, // Amount of ETH to receive
        amountInMax, // Max amount of USDC to spend
        [USDC, WETH], // Path: USDC -> WETH
        TOKEN_HOLDER, // To: token holder's address
        deadline1 // Deadline
    );
    await txReceipt1.wait();

    // Log ETH balance after first swap
    const ETHERS_BALANCE_AFTER_SWAP_1 = await ethers.provider.getBalance(TOKEN_HOLDER);
    console.log("ETH Balance after swapTokensForExactETH: ", ethers.formatUnits(ETHERS_BALANCE_AFTER_SWAP_1, 18));

    // Second swap: swapExactETHForTokens (ETH -> USDC)
    const deadline2 = Math.floor(Date.now() / 1000) + 60 * 10; // 10-minute deadline
    const txReceipt2 = await ROUTER.swapExactETHForTokens(
        amountOutMin, // Minimum amount of USDC to receive
        [WETH, USDC], // Path: WETH -> USDC
        TOKEN_HOLDER, // To: token holder's address
        deadline2, // Deadline
        //{ value: ethAmount } // Send exact ETH amount
    );
    await txReceipt2.wait();

    // Log USDC balance after second swap
    const USDC_BALANCE_AFTER_SWAP = await USDC_Contract.balanceOf(TOKEN_HOLDER);
    console.log("USDC Balance after swapExactETHForTokens: ", ethers.formatUnits(USDC_BALANCE_AFTER_SWAP, 6));

    // Log ETH balance after the second swap
    const ETHERS_BALANCE_AFTER_SWAP_2 = await ethers.provider.getBalance(TOKEN_HOLDER);
    console.log("ETH Balance after swapExactETHForTokens: ", ethers.formatUnits(ETHERS_BALANCE_AFTER_SWAP_2, 18));

    console.log(ROUTER);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
