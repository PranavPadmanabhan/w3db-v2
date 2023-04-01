import { ethers } from 'ethers'
import { ABI } from '../constants/constants'

export const getContract = async () => {
    const key = "daec36e309ed45f4cdd2ea0cdaac0ac71f5d658c6e82d340eface4d3f859ecbc"
    const rpc = "https://polygon-mumbai.g.alchemy.com/v2/GMLHwaQBD8_cYHiiPmLXfXxkPksB_iqr"
    try {
        const provider = new ethers.providers.JsonRpcProvider(rpc)
        const wallet = new ethers.Wallet(key, provider);
        const address = "0xC1868BE8dBdAea7178197fAE26971223BB3887c7"
        const contract = new ethers.Contract(address, ABI, wallet);
        return contract
    } catch (error: any) {
        throw new Error("could not detect network")
    }
}