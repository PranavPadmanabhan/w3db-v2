import { getContract } from "./backend";
import fs from "fs";
import { ThirdwebStorage } from "@thirdweb-dev/storage";
import CryptoJS from "crypto-js";
import { ethers } from "ethers";

type Db = {
  name: string | null;
  owner: string | null;
};
type state = {
  hasSetup: boolean;
};

export default class DB {
  private Db: Db = { name: null, owner: null };
  private states: state = { hasSetup: false };
  constructor(address: string, name: string) {
    try {
      this.Db.name = name;
      this.Db.owner = address;
      this.init();
    } catch (error) {
      console.clear();
    }
  }

  private async setUpDb() {
    this.states.hasSetup = false;
    const contract = await getContract();
    try {
      fs.readdir("./rdata", async (err, files) => {
        const database = await contract.getDatabase();
        if (err?.message.includes("no such file or directory")) {
          if (database.toString().trim().length !== 0) {
            const res = await fetch(database.toString());
            const data = await res.json();
            fs.mkdirSync("./rdata");
            fs.writeFileSync("./rdata/db", JSON.stringify(data), "utf8");
            fs.writeFileSync(
              "./rdata/!",
              encrypt(database, "projectID"),
              "utf8"
            );
          } else {
            fs.mkdirSync("./rdata");
            fs.writeFileSync("./rdata/db", JSON.stringify({}), "utf8");
            fs.writeFileSync("./rdata/!", "", "utf8");
          }
        } else if (files) {
          let datas: any[] = ["db", "!"];
          if (database.toString().trim().length !== 0) {
            const res = await fetch(database.toString());
            const data = await res.json();
            datas.map((item) => {
              const value: any =
                item === "db"
                  ? JSON.stringify(data)
                  : encrypt(database, "projectID");
              if (!files.includes(item)) {
                 fs.writeFileSync(`./rdata/${item}`, value, "utf8");
              }
            });
          } else {
            datas.map((item) => {
              const value: any = item === "db" ? JSON.stringify({}) : "";
              if (!files.includes(item)) {
                fs.writeFileSync(`./rdata/${item}`, value, "utf8");
              }
            });
          }
          // this.syncDataWithContract();
        }
      });
      this.states.hasSetup = true;
    } catch (error) {
      console.clear();
    }
  }

  collection(name: string) {
    if (this.states.hasSetup) {
      return new Collection(name);
    }
  }

  private async uploadData() {
    await this.setUpDb();
    const storage = new ThirdwebStorage();
    try {
        const file = fs.readFileSync("./rdata/db", "utf8");
        const contract = await getContract();
        if (file) {
          const data = JSON.parse(file);
          const uploaded = await storage.upload(data, {
            alwaysUpload: true,
            uploadWithGatewayUrl: true,
            uploadWithoutDirectory: true,
          });
          const url = encrypt(uploaded, "projectID");
          fs.writeFileSync("./rdata/!", url, "utf8");
          const database = await contract.getDatabase();
          if (database.toString() !== uploaded) {
            const tx = await contract.updateDatabase(uploaded, {
              gasLimit: 1000000,
            });
            const { gasUsed, effectiveGasPrice } = await tx.wait(1);
            const gasCost = ethers.utils.formatEther(
              gasUsed.mul(effectiveGasPrice)
            );
            console.log("database updated");
          }
        }
      
      setTimeout(() => {
        this.uploadData();
      }, 5000);
    } catch (error) {
      console.clear();
      setTimeout(() => {
        this.uploadData();
      }, 5000);
    }
  }

  async init() {
    await new Promise<void>((resove, reject) => {
      try {
        this.setUpDb();
        resove();
      } catch (error) {
        reject();
      }
    }).then(() => this.uploadData());
  }
}

class Collection {
  private name!: string;
  constructor(name: string) {
    this.name = name;
  }

  add(doc: any) {
    try {
      const file = fs.readFileSync("./rdata/db", "utf8");
      const data = JSON.parse(file);
      if (data) {
        const id = Math.random() * 1e18;
        const idString = id.toString().slice(0, 16);
        const updatedData = {
          ...data,
          [this.name]: {
            ...data[this.name]!,
            [idString]: { _id: idString, ...doc },
          },
        };
        fs.writeFileSync("./rdata/db", JSON.stringify(updatedData), "utf8");
      } else {
        const id = Math.random() * 1e18;
        const idString = id.toString().slice(0, 16);
        const updatedData = {
          [this.name]: {
            [idString]: { _id: idString, ...doc },
          },
        };
        fs.writeFileSync("./rdata/db", JSON.stringify(updatedData), "utf8");
      }
    } catch (error) {
      console.clear();
    }
  }
}


export function encrypt(data: string, key: string) {
  var encrypted = CryptoJS.AES.encrypt(data, key).toString();
  return encrypted;
}

export function decrypt(encrypted: string | any, key: string) {
  const bytes = CryptoJS.AES.decrypt(encrypted, key);
  const decrypted = bytes.toString(CryptoJS.enc.Utf8);
  return decrypted;
}
