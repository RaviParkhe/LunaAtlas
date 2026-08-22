import os
import json
import logging
from web3 import Web3
from eth_account import Account
from blockchain.config import get_rpc_url, get_private_key, get_contract_address, BLOCKCHAIN_CHAIN_ID

logger = logging.getLogger(__name__)

_HERE = os.path.dirname(os.path.abspath(__file__))
ARTIFACT_PATH = os.path.join(_HERE, "hardhat", "artifacts", "contracts", "LunarDecisionRegistry.sol", "LunarDecisionRegistry.json")

def get_contract_abi_bytecode():
    if not os.path.exists(ARTIFACT_PATH):
        raise FileNotFoundError(f"Contract artifact not found at {ARTIFACT_PATH}. Run 'npx hardhat compile' first.")
    with open(ARTIFACT_PATH, "r") as f:
        data = json.load(f)
    return data["abi"], data["bytecode"]

class DecisionRegistry:
    def __init__(self):
        self.w3 = Web3(Web3.HTTPProvider(get_rpc_url()))
        if not self.w3.is_connected():
            raise ConnectionError(f"Failed to connect to RPC at {get_rpc_url()}")
            
        self.private_key = None
        self.account = None
        try:
            self.private_key = get_private_key()
            self.account = Account.from_key(self.private_key)
        except ValueError:
            pass # Only an issue if we need to write
            
        self.abi, self.bytecode = get_contract_abi_bytecode()
        
        try:
            addr = get_contract_address()
            self.contract = self.w3.eth.contract(address=addr, abi=self.abi)
        except ValueError:
            self.contract = None
            
    def deploy(self):
        """Deploys the smart contract to the network."""
        if not self.account:
            raise ValueError("Private key required for deployment.")
            
        LunarContract = self.w3.eth.contract(abi=self.abi, bytecode=self.bytecode)
        tx = LunarContract.constructor().build_transaction({
            'from': self.account.address,
            'nonce': self.w3.eth.get_transaction_count(self.account.address),
            'gas': 3000000,
            'gasPrice': self.w3.eth.gas_price
        })
        
        signed_tx = self.w3.eth.account.sign_transaction(tx, private_key=self.private_key)
        tx_hash = self.w3.eth.send_raw_transaction(signed_tx.raw_transaction)
        tx_receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
        
        self.contract = self.w3.eth.contract(address=tx_receipt.contractAddress, abi=self.abi)
        return tx_receipt.contractAddress
        
    def register_decision(self, manifest: dict):
        if not self.contract:
            raise ValueError("Contract not loaded. Deploy or set BLOCKCHAIN_CONTRACT_ADDRESS.")
        if not self.account:
            raise ValueError("Private key required to register decision.")
            
        decision_id = manifest["decision_id"].encode('utf-8')
        # Padding to bytes32 is handled by web3 if we pass bytes, but we should make sure it fits
        decision_id_bytes = decision_id.ljust(32, b'\0')[:32]
        
        h = manifest["artifacts"]
        record = (
            bytes.fromhex(h["datasetHash"][2:]),
            bytes.fromhex(h["featureConfigHash"][2:]),
            bytes.fromhex(h["preprocessingHash"][2:]),
            bytes.fromhex(h["modelHash"][2:]),
            bytes.fromhex(h["clusterHash"][2:]),
            bytes.fromhex(h["ahpConfigHash"][2:]),
            bytes.fromhex(h["ahpResultHash"][2:]),
            bytes.fromhex(h["mlXaiHash"][2:]),
            bytes.fromhex(h["ahpXaiHash"][2:]),
            bytes.fromhex(h["geminiHash"][2:]),
            bytes.fromhex(h["counterfactualHash"][2:]),
            bytes.fromhex(h["reportHash"][2:]),
            int(self.w3.eth.get_block('latest').timestamp),
            manifest["site"]["site_id"],
            manifest["pipeline"]["version"]
        )
        
        tx = self.contract.functions.registerDecision(decision_id_bytes, record).build_transaction({
            'from': self.account.address,
            'nonce': self.w3.eth.get_transaction_count(self.account.address),
            'gas': 1000000,
            'gasPrice': self.w3.eth.gas_price
        })
        
        signed_tx = self.w3.eth.account.sign_transaction(tx, private_key=self.private_key)
        tx_hash = self.w3.eth.send_raw_transaction(signed_tx.raw_transaction)
        tx_receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
        return tx_receipt
        
    def get_decision(self, decision_id: str):
        if not self.contract:
            raise ValueError("Contract not loaded.")
        decision_id_bytes = decision_id.encode('utf-8').ljust(32, b'\0')[:32]
        if not self.contract.functions.decisionExists(decision_id_bytes).call():
            return None
        return self.contract.functions.getDecision(decision_id_bytes).call()
