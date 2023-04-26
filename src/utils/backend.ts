import  CryptoJS  from 'crypto-js';
import { ethers } from 'ethers'
import { ABI } from '../constants/constants'


export function decrypt(encrypted: string | any, key: string) {
    const bytes = CryptoJS.AES.decrypt(encrypted, key);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted;
  }

export const getContract = async (secret:string,projectId:string,mumbaiRPC:string) => {
    try {
        const decryped = decrypt(secret,projectId);
        const details = decryped.split("%",decryped.length);
        const pkey = details[1]
        const contractAddress = details[0]
        const provider = new ethers.providers.JsonRpcProvider(mumbaiRPC)
        const wallet = new ethers.Wallet(pkey, provider);
        const contract = new ethers.Contract(contractAddress, ABI, wallet);
        return contract
    } catch (error: any) {
        throw new Error("could not detect network")
    }
}