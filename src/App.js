import React, { useEffect, useState } from 'react';
import twitterLogo from './assets/twitter-logo.svg';
import myEpicNft from './utils/MyEpicNFT.json';
import nftGif from './assets/nft.gif';
import './styles/App.css';

import { ethers } from 'ethers';

import {
  FaWallet,
  FaCheckCircle,
  FaCheck,
  FaRegGem,
  FaThLarge,
  FaQrcode,
} from 'react-icons/fa';

import { CopyToClipboard } from 'react-copy-to-clipboard';

import { useLoading, Grid } from '@agney/react-loading';

// Constants
const TWITTER_HANDLE = 'nedmarafawi';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const OPENSEA_COLLECTION_LINK =
  'https://testnets.opensea.io/collection/sqaurenft-28frtibznr';
const TOTAL_MINT_COUNT = 50;

// @TODO: Note on contract redeploys
// Step 1: Deploy the contract 'npx hardhat run scripts/deploy.js --network rinkeby'
// Step 2: Update the 'CONTRACT_ADDRESS'
// Step 3: Update the abi file(src/utils/MyEpicNFT.json)

// Contract Address
const CONTRACT_ADDRESS = '0x173eA9DD8844E39e3e31584175990794d24534bd';

const App = () => {
  // Store our user's public wallet.
  const [currentAccount, setCurrentAccount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [mintCount, setMintCount] = useState(0);
  const [openSeaLink, setOpenSeaLink] = useState(OPENSEA_COLLECTION_LINK);
  const [etherScanLink, setEtherScanLink] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  // Make sure this is async.
  const checkIfWalletIsConnected = async () => {
    // Make sure that you have access to window.ethereum
    const { ethereum } = window;

    if (!ethereum) {
      console.log('Make sure you have metamask!');
    } else {
      console.log('We have the ethereum object', ethereum);
    }

    // Check if we're authorized to access the user's wallet.
    const accounts = await ethereum.request({ method: 'eth_accounts' });

    // User can have multiple authorized accounts.
    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log('Found an authorized account:', account);
      setCurrentAccount(account);

      let chainId = await ethereum.request({ method: 'eth_chainId' });
      console.log('Connected to chain ' + chainId);

      // String, hex code of the chainId of the Rinkebey test network.
      const rinkebyChainId = '0x4';
      if (chainId !== rinkebyChainId) {
        console.log('You are not connected to the Rinkeby Test Network');
      }

      // Setup listener
      setupEventListener();
    } else {
      console.log('No authorized account found');
    }
  };

  // Implement our connectWallet method
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert('Get MetaMask!');
        return;
      }
      // Fancy method to request access to account
      const accounts = await ethereum.request({
        method: 'eth_requestAccounts',
      });
      console.log('Connected', accounts[0]);
      setCurrentAccount(accounts[0]);

      let chainId = await ethereum.request({ method: 'eth_chainId' });
      console.log('Connected to chain ' + chainId);

      // String, hex code of the chainId of the Rinkebey test network.
      const rinkebyChainId = '0x4';
      if (chainId !== rinkebyChainId) {
        console.log('You are not connected to the Rinkeby Test Network');
      }

      // Setup listener
      // This is for the case where a user comes to our site and connected
      // their wallet for the first time.
      setupEventListener();
    } catch (error) {
      console.log(error);
    }
  };

  // Our listener
  const setupEventListener = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          myEpicNft.abi,
          signer
        );

        connectedContract.on('NewEpicNFTMinted', (from, tokenId) => {
          console.log(from, tokenId.toNumber());
          // alert(
          //   `Hey there! We've minted your NFT. It may be blank right now. It can take a max of 10 min to show up on OpenSea. Here's the link: https://testnets.opensea.io/assets/${CONTRACT_ADDRESS}/${tokenId.toNumber()}`
          // );
          setOpenSeaLink(
            `https://testnets.opensea.io/assets/${CONTRACT_ADDRESS}/${tokenId.toNumber()}`
          );
        });
        console.log('Setup event listeners!');
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const askContractToMintNft = async () => {
    setIsSuccessful(false);

    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        // We always need these three things to communicate with the contract
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          myEpicNft.abi,
          signer
        );

        console.log('Going to pop wallet now to pay gas...');
        let nftTxn = await connectedContract.makeAnEpicNFT();
        setIsLoading(true);

        console.log('Mining... please wait.');
        await nftTxn.wait();
        setIsLoading(false);
        setIsSuccessful(true);
        getMintCount();

        console.log(nftTxn);
        setEtherScanLink(`https://rinkeby.etherscan.io/tx/${nftTxn.hash}`);
        console.log(
          `Mined, see transaction: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`
        );
      } else {
        console.log("Ethereum object doesn't exist");
      }
    } catch (error) {
      console.log(error);
    }
  };

  // Set a limit on the # of minted NFTs
  const getMintCount = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();

        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          myEpicNft.abi,
          signer
        );

        let nftCount = await connectedContract.getTotalNFTsMintedCount();
        console.log('NFTs minted: ', parseInt(nftCount, 10));
        setMintCount(parseInt(nftCount, 10));
      } else {
        console.log("Ethereum object doesn't exist");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getButton = () => {
    if (currentAccount === '') {
      return (
        <button
          onClick={connectWallet}
          className="cta-button connect-wallet-button"
        >
          <FaWallet />
          &nbsp; Connect Wallet
        </button>
      );
    }
    return (
      <button
        onClick={askContractToMintNft}
        className="cta-button mint-button"
        title="Mint an NFT"
        disabled={isLoading || mintCount === TOTAL_MINT_COUNT}
      >
        <FaRegGem />
        &nbsp;
        {isLoading ? 'Mining...please wait!' : 'Mint NFT'}
      </button>
    );
  };

  const onCopyText = () => {
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 1000);
  };

  const navigateToOpenSea = () => {
    window.open(OPENSEA_COLLECTION_LINK, '_blank');
  };

  // When the page loads
  useEffect(() => {
    checkIfWalletIsConnected();
    getMintCount();
  }, []);

  // // Render Methods
  // const renderNotConnectedContainer = () => (
  //   <button
  //     onClick={connectWallet}
  //     className="cta-button connect-wallet-button"
  //   >
  //     Connect to Wallet
  //   </button>
  // );

  // const renderMintUI = () => (
  //   <button
  //     onClick={askContractToMintNft}
  //     className="cta-button connect-wallet-button" disabled={isLoading}
  //   >
  //     {isLoading || 'Minting... please wait!' : 'Mint NFT'}
  //   </button>
  // );

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <div className="header gradient-text ">
            TRIPLE
            <div className="gradient-text4">W&nbsp;</div>
            <div className="gradient-text1">N</div>
            <div className="gradient-text2">F</div>
            <div className="gradient-text3">T</div>
          </div>
          {/* <p className="sub-text">Mint before it’s too late!</p> */}

          <div className="bg-container">
            <img
              src={nftGif}
              alt="NFT demo GIF"
              className="nft-gif gif-bg-color "
            />

            {mintCount < TOTAL_MINT_COUNT && (
              <p className="mint-count">
                {mintCount} / {TOTAL_MINT_COUNT} claimed
              </p>
            )}
            {mintCount === TOTAL_MINT_COUNT && (
              <p className="mint-count">Sold out!</p>
            )}
            <p className="about">
              TRIPLEW #01 is an NFT project consisting of 50 randomly generated
              three-word combination.
              {/* TRIPLEW #001 is an NFT project consisting of 50 randomly
              generated three-word combination. Each piece is a unique,
              one-of-a-kind, and really funny. */}
            </p>
            {getButton()}
            <button
              onClick={navigateToOpenSea}
              className="cta-button opensea-button"
              title="View collection on OpenSea"
            >
              <FaThLarge />
              &nbsp; View collection on OpenSea
            </button>
            {currentAccount !== '' && (
              <>
                {/* <p className="wallet-address-title">Current Wallet:</p> */}
                <p className="wallet-address-text">
                  {/* <FaQrcode /> */}
                  <div className="copy-action">
                    <CopyToClipboard
                      onCopy={onCopyText}
                      text={currentAccount}
                      title="Current wallet connected"
                    >
                      <span>{isCopied ? 'Copied!' : `${currentAccount}`}</span>
                    </CopyToClipboard>
                  </div>
                  {/* <div className="wallet-checkmark">
                    <FaCheckCircle />
                  </div> */}
                </p>
              </>
            )}
            {isSuccessful && (
              <div className="success-message ">
                <div className="success-message-color">
                  <div className="wallet-checkmark">
                    {/* <FaCheckCircle /> */}
                  </div>
                  <p>
                    <FaCheck />
                    &nbsp; Congratulations! You've just minted an NFT
                  </p>
                </div>
                <p>
                  View your NFT on&nbsp;
                  <a
                    className="openSea-link"
                    href={openSeaLink}
                    target="_blank"
                    rel="noreferrer"
                  >
                    OpenSea
                  </a>
                </p>
                <p>
                  See your transaction on&nbsp;
                  <a
                    className="etherScan-link"
                    href={etherScanLink}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Etherscan
                  </a>
                </p>
              </div>
            )}
          </div>
          {/* {currentAccount === ''
            ? renderNotConnectedContainer()
            : renderMintUI()} */}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built by @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
