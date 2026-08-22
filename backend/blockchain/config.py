import os
from dotenv import load_dotenv

# Load env vars
load_dotenv()

def get_rpc_url():
    return os.getenv("BLOCKCHAIN_RPC_URL", "http://127.0.0.1:8545")

def get_private_key():
    pk = os.getenv("BLOCKCHAIN_PRIVATE_KEY")
    if not pk:
        raise ValueError("BLOCKCHAIN_PRIVATE_KEY is not set in environment.")
    return pk

def get_contract_address():
    addr = os.getenv("BLOCKCHAIN_CONTRACT_ADDRESS")
    if not addr:
        raise ValueError("BLOCKCHAIN_CONTRACT_ADDRESS is not set in environment.")
    return addr

BLOCKCHAIN_CHAIN_ID = int(os.getenv("BLOCKCHAIN_CHAIN_ID", 1337))
