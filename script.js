let provider, signer, contract, userAddress;
const tokenAddress = "0xYourTokenAddressHere"; // Replace with your ERC20 token contract address
const tokenABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function balanceOf(address) view returns (uint)",
  "function transfer(address to, uint amount) returns (bool)",
  "function stake(uint amount) returns (bool)"
];

const connectBtn = document.getElementById("connectBtn");
const disconnectBtn = document.getElementById("disconnectBtn");
const swapBtn = document.getElementById("swapBtn");
const stakeBtn = document.getElementById("stakeBtn");
const portfolioOverview = document.getElementById("portfolioOverview");
const marketOverview = document.getElementById("marketOverview");
const referralLink = document.getElementById("referralLink");
const stakingSection = document.getElementById("stakingSection");
const feeBreakdown = document.getElementById("feeBreakdown");
const newsFeed = document.getElementById("newsFeed");
const priceChart = document.getElementById("priceChart");
const tokenBalanceElement = document.getElementById("tokenBalance");

connectBtn.addEventListener("click", async () => {
  if (!window.ethereum) return alert("MetaMask required");

  provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = await provider.getSigner();
  userAddress = await signer.getAddress();

  contract = new ethers.Contract(tokenAddress, tokenABI, signer);
  document.getElementById("userAddress").textContent = userAddress;

  fetchPortfolioData();
  fetchMarketData();
  fetchNewsFeed();
  fetchPriceChartData();
  fetchTransactionHistory();
});

disconnectBtn.addEventListener("click", () => {
  document.getElementById("walletSection").classList.add("hidden");
  document.getElementById("status").textContent = "";
});

async function fetchPortfolioData() {
  try {
    const balance = await contract.balanceOf(userAddress);
    const totalValue = ethers.formatUnits(balance, 18); // Example DMC value
    tokenBalanceElement.textContent = `DMC Balance: ${totalValue}`;
    document.getElementById("totalValue").textContent = `Total Portfolio Value: $${totalValue}`;
  } catch (err) {
    console.error("Error fetching portfolio data:", err);
  }
}

async function fetchMarketData() {
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=ethereum,binancecoin,polygon,dmc&order=market_cap_desc`;

  try {
    const response = await axios.get(url);
    const marketData = response.data.map(coin => `
      <div>
        <strong>${coin.name}</strong>: $${coin.current_price}
      </div>
    `).join("");
    marketOverview.innerHTML = marketData;
  } catch (err) {
    console.error("Error fetching market data:", err);
  }
}

async function fetchNewsFeed() {
  const url = "https://cryptonews-api.com/api/v1/category?section=general";

  try {
    const response = await axios.get(url);
    const newsItems = response.data.data.map(news => `
      <li><a href="${news.url}" target="_blank">${news.title}</a></li>
    `).join("");
    newsFeed.innerHTML = newsItems;
  } catch (err) {
    console.error("Error fetching news feed:", err);
  }
}

async function fetchPriceChartData() {
  const ctx = document.getElementById('priceChart').getContext('2d');
  const url = "https://api.coingecko.com/api/v3/coins/dmc/market_chart?vs_currency=usd&days=7";

  try {
    const response = await axios.get(url);
    const priceData = response.data.prices.map(price => ({
      x: new Date(price[0]),
      y: price[1]
    }));

    new Chart(ctx, {
      type: 'line',
      data: {
        datasets: [{
          label: 'DMC Price (USD)',
          data: priceData,
          borderColor: '#00bcd4',
          backgroundColor: 'rgba(0, 188, 212, 0.2)',
          fill: true
        }]
      },
      options: {
        responsive: true,
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'day'
            },
            title: {
              display: true,
              text: 'Date'
            }
          },
          y: {
            title: {
              display: true,
              text: 'Price (USD)'
            }
          }
        }
      }
    });
  } catch (err) {
    console.error("Error fetching price chart data:", err);
  }
}

swapBtn.addEventListener("click", async () => {
  const amount = document.getElementById("swapAmount").value;
  const fromToken = document.getElementById("swapFromToken").value;
  const toToken = document.getElementById("swapToToken").value;
  document.getElementById("swapStatus").textContent = "Swapping...";

  // Example for token swap using Uniswap
  if (fromToken === 'eth' && toToken === 'dmc') {
    // Swap ETH for DMC (Uniswap example, requires integration with Uniswap)
    const uniswapRouterAddress = "0x5C69bEe701ef814a2B6a3EDD2B3c63dF5E404C7d"; // Uniswap V2 Router address
    const uniswapRouterABI = [
      "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)"
    ];

    const uniswapContract = new ethers.Contract(uniswapRouterAddress, uniswapRouterABI, signer);
    const path = [ethers.AddressZero, tokenAddress]; // ETH to DMC
    const amountIn = ethers.parseUnits(amount, 18); // Amount of ETH to swap

    try {
      const tx = await uniswapContract.swapExactETHForTokens(
        0, // Min amount out (set to 0 for simplicity)
        path,
        userAddress,
        Math.floor(Date.now() / 1000) + 60 * 10, // Deadline: 10 minutes
        { value: amountIn }
      );
      await tx.wait();
      document.getElementById("swapStatus").textContent = `Swap complete! TX: ${tx.hash}`;
    } catch (err) {
      document.getElementById("swapStatus").textContent = `Swap failed: ${err.message}`;
    }
  } else {
    document.getElementById("swapStatus").textContent = `Token swap not implemented for ${fromToken} to ${toToken}.`;
  }
});

stakeBtn.addEventListener("click", async () => {
  const amount = document.getElementById("stakeAmount").value;

  try {
    const tx = await contract.stake(ethers.parseUnits(amount, 18));
    await tx.wait();
    document.getElementById("stakingStatus").textContent = `Staked ${amount} DMC!`;
    fetchPortfolioData(); // Update portfolio after staking
  } catch (err) {
    document.getElementById("stakingStatus").textContent = `Staking failed: ${err.message}`;
  }
});

async function fetchTransactionHistory() {
  const apiKey = "your-etherscan-api-key"; // Replace with your Etherscan API key
  const url = `https://api-sepolia.etherscan.io/api?module=account&action=txlist&address=${userAddress}&startblock=0&endblock=99999999&sort=desc&apikey=${apiKey}`;

  document.getElementById("loading").classList.remove("hidden");

  try {
    const res = await fetch(url);
    const data = await res.json();
    const txList = data.result.map(tx => `
      <li>
        TX: <a href="https://sepolia.etherscan.io/tx/${tx.hash}" target="_blank">${tx.hash}</a> 
        - ${ethers.formatUnits(tx.value, 18)} DMC
        - Status: ${tx.isError === "0" ? "Success" : "Failed"}
      </li>
    `).join("");

    document.getElementById("txHistory").innerHTML = txList;
  } catch (err) {
    console.error("History error:", err);
  }

  document.getElementById("loading").classList.add("hidden");
}

async function generateQRCode(address) {
  const canvas = document.getElementById("qrCodeCanvas");
  QRCode.toCanvas(canvas, address, { color: { dark: "#00bcd4" } });
}
