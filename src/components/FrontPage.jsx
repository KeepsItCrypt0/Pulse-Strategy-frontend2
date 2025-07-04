import React from "react";

const FrontPage = ({ onEnterApp }) => {
  return (
    <div className="min-h-screen gradient-bg flex flex-col items-center justify-center p-4">
      <div className="bg-white bg-opacity-90 shadow-lg rounded-lg p-8 max-w-4xl w-full card">
        <h1 className="text-4xl font-bold text-center text-purple-600 mb-6">Welcome to PulseStrategy</h1>
        <p className="text-gray-600 text-lg text-center mb-4">
          A decentralized, community-driven protocol built on PulseChain, designed to grow value for holders in a transparent, trustless way.
        </p>
        <p className="text-gray-600 text-center mb-6">
          Inspired by MicroStrategy’s leveraged Bitcoin accumulation to create value for shareholders, PulseStrategy uses immutable smart contracts to create self-sustaining, community-owned decentralized reserves with deflationary mechanics that benefit everyone involved.
        </p>
        <p className="text-gray-600 text-center mb-8">
          Whether you’re a long-term holder looking for steady growth, a trader seeking profits, or a liquidity provider looking to earn rewards, PulseStrategy offers a unique opportunity for you.
        </p>

        <h2 className="text-2xl font-semibold text-[#4B0082] mb-4">xBond & iBond Contracts</h2>
        <ul className="list-disc list-inside text-gray-600 mb-6">
          <li className="mb-2">
            <strong>Minting (180 Days):</strong>
            <ul className="list-circle list-inside ml-4">
              <li>Deposit PLSX/INC to mint xBond/iBond at a 1:1 ratio (minus 0.5% fee).</li>
              <li>After 180 days, minting stops forever.</li>
            </ul>
          </li>
          <li className="mb-2">
            <strong>Transfers:</strong>
            <ul className="list-circle list-inside ml-4">
              <li>0.5% tax on every transfer (except to/from contract or OA):</li>
              <li className="ml-4">0.25% burned, reducing supply.</li>
              <li className="ml-4">0.25% sent to the Origin Address.</li>
              <li>Burns make each remaining bond worth more PLSX/INC.</li>
            </ul>
          </li>
          <li>
            <strong>Redemption:</strong>
            <ul className="list-circle list-inside ml-4">
              <li>Redeem xBond/iBond at any time for your share of the PLSX/INC reserve.</li>
            </ul>
          </li>
        </ul>

        <h2 className="text-2xl font-semibold text-[#4B0082] mb-4">PLStr Contract</h2>
        <ul className="list-disc list-inside text-gray-600 mb-8">
          <li className="mb-2">
            <strong>vPLS Deposits:</strong>
            <ul className="list-circle list-inside ml-4">
              <li>Anyone can deposit vPLS to grow the reward pool (minimum 100,000 vPLS).</li>
              <li>No PLStr is minted for depositors—it’s purely altruistic, fueling rewards for xBond/iBond/LP holders.</li>
            </ul>
          </li>
          <li className="mb-2">
            <strong>Reward Claims:</strong>
            <ul className="list-circle list-inside ml-4">
              <li>Holders of xBond, iBond, or LP tokens can claim PLStr.</li>
              <li>Rewards are weighted by a formula that adjusts based on PLSX/INC ratios.</li>
              <li>LP providers get 2x rewards to incentivize liquidity.</li>
            </ul>
          </li>
          <li className="mb-2">
            <strong>Reward Expiration:</strong>
            <ul className="list-circle list-inside ml-4">
              <li>Unclaimed rewards expire after 90 days, resetting the reward pool.</li>
              <li>Expired rewards effectively burn PLStr, increasing vPLS backing for claimed PLStr.</li>
            </ul>
          </li>
          <li className="mb-2">
            <strong>Transfers:</strong>
            <ul className="list-circle list-inside ml-4">
              <li>0.5% of PLStr transfers are burned (except for claims/redemptions).</li>
            </ul>
          </li>
          <li>
            <strong>Redemption:</strong>
            <ul className="list-circle list-inside ml-4">
              <li>Redeem PLStr for a share of the vPLS reserve at any time.</li>
            </ul>
          </li>
        </ul>

        <div className="text-center mb-4">
          <a
            href="https://github.com/PulseStrategy369/PulseStrategy"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-block px-4 py-2 mb-4"
          >
            Read the Full Whitepaper
          </a>
        </div>

        <button
          onClick={onEnterApp}
          className="btn-primary w-full py-3 text-lg"
        >
          Enter App
        </button>
      </div>
    </div>
  );
};

export default FrontPage;
