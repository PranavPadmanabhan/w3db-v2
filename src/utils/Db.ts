import { getContract } from "./backend";
import fs from "fs";
import { ThirdwebStorage } from "@thirdweb-dev/storage";
import CryptoJS from "crypto-js";

type Db = {
  secret: string | null;
  owner: string | null;
  projectId: string | null;
  mumbaiRPC: string | null;
};


export default class W3dbV2 {
  private Db: Db = { secret: null, owner: null, projectId: null, mumbaiRPC: null };
  constructor({ address, secret, mumbaiRPC, projectId }: { address: string, secret: string, mumbaiRPC: string, projectId: string }) {
    try {
      this.Db.secret = secret;
      this.Db.owner = address;
      this.Db.projectId = projectId;
      this.Db.mumbaiRPC = mumbaiRPC;
      this.setUpDb()
    } catch (error) {
      console.clear();
    }
  }

  private async setUpDb() {
    try {
      const contract = await getContract(this.Db.secret!, this.Db.projectId!, this.Db.mumbaiRPC!);
      const database = await contract.getDatabase();
      fs.readdir("./rdata", async (err, files) => {
        if (err?.message.includes("no such file or directory")) {
          if (database.toString().trim().length !== 0) {
            const res = await fetch(database.toString());
            const data = await res.json();
            fs.mkdirSync("./rdata");
            fs.writeFileSync("./rdata/db", encrypt(JSON.stringify(data), this.Db.projectId!), "utf8");
            fs.writeFileSync(
              "./rdata/!",
              encrypt(database, this.Db.projectId!),
              "utf8"
            );
          } else {
            fs.mkdirSync("./rdata");
            fs.writeFileSync("./rdata/db", "", "utf8");
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
                  ? encrypt(JSON.stringify(data), this.Db.projectId!)
                  : encrypt(database, this.Db.projectId!);
              if (!files.includes(item)) {
                fs.writeFileSync(`./rdata/${item}`, value, "utf8");
              }
            });
          } else {
            datas.map((item) => {
              const value: any = item === "db" ? "" : "";
              if (!files.includes(item)) {
                fs.writeFileSync(`./rdata/${item}`, value, "utf8");
              }
            });
          }
          await this.uploadData()
        }
      });
      setTimeout(() => {
        this.setUpDb()
      }, 5000);
    } catch (error: any) {
      if (error.message.includes('could not detect network')) {
        console.log(error)
      }
      setTimeout(() => {
        this.setUpDb()
      }, 2000);
    }
  }

    async getIPFS(gateWayNeeded: boolean = false) {
    const contract = await getContract(this.Db.secret!, this.Db.projectId!, this.Db.mumbaiRPC!);
    const database = await contract.getDatabase()
    if(gateWayNeeded){
      return database.toString()
    }
    else {
      const hash = database.toString().slice(database.toString().length - 46,database.toString().length);
      return hash
    }
  }

  collection(name: string) {
    return new Collection(name, this.Db.projectId);
  }
  private async uploadData() {
    const storage = new ThirdwebStorage();
    try {
      const file = fs.readFileSync("./rdata/db", "utf8");
      const contract = await getContract(this.Db.secret!, this.Db.projectId!, this.Db.mumbaiRPC!);
      if (file) {
        const data = JSON.parse(decrypt(file, this.Db.projectId!));
        const uploaded = await storage.upload(JSON.stringify(data), {
          alwaysUpload: true,
          uploadWithGatewayUrl: true,
          uploadWithoutDirectory: true,
        });
        const url = encrypt(uploaded, this.Db.projectId!);
        fs.writeFileSync("./rdata/!", url, "utf8");
        const database = await contract.getDatabase();
        if (database.toString() !== uploaded) {
          const tx = await contract.updateDatabase(uploaded, {
            gasLimit: 1000000,
          });
          const receipt = await tx.wait(1);
        }
      }

    } catch (error) {
    }
  }

}

type collection = {
  name: string | undefined;
  encryptionKey: string | null
}

class Collection {
  private collection: collection = {
    encryptionKey: null,
    name: undefined
  };


  constructor(name: string, encryptionKey: string | null) {
    this.collection.name = name
    this.collection.encryptionKey = encryptionKey
  }


  add(doc: Object) {
    try {
      const file = fs.readFileSync("./rdata/db", "utf8");
      if (file.trim().length !== 0) {
        const data = JSON.parse(decrypt(file, this.collection.encryptionKey!));
        const id = Math.random() * 1e18;
        const idString = id.toString().slice(0, 16);
        const document = { _id: idString, ...doc }
        const updatedData = {
          ...data,
          [this.collection.name!]: {
            ...data[this.collection.name!]!,
            [idString]: document,
          },
        };
        const encrypted = encrypt(JSON.stringify(updatedData), this.collection.encryptionKey!)
        fs.writeFileSync("./rdata/db", encrypted, "utf8");
        return document
      }
      else {
        const id = Math.random() * 1e18;
        const idString = id.toString().slice(0, 16);
        const document = { _id: idString, ...doc }
        const updatedData = {
          [this.collection.name!]: {
            [idString]: document,
          },
        };
        const encrypted = encrypt(JSON.stringify(updatedData), this.collection.encryptionKey!)
        fs.writeFileSync("./rdata/db", encrypted, "utf8");
        return document
      }

    } catch (error: any) {
      throw new Error(error.message)
    }
  }

  update(filter: Object, update: Object) {
    try {
      const file = fs.readFileSync("./rdata/db", "utf8");
      if (Object.keys(filter).length === 0 || Object.keys(update).length === 0) {
        if (Object.keys(filter).length === 0) {
          throw new Error("filter is required")
        }
        else {
          throw new Error("update is required")
        }
      }
      else {
        if (file.trim().length !== 0) {
          const data = JSON.parse(decrypt(file, this.collection.encryptionKey!));
          if (data[this.collection.name!]) {
            const collection = Object.values(data[this.collection.name!])
            const keys = Object.keys(filter);
            const values = Object.values(filter)
            const filtered: any[] = collection.filter((item: any) => {
              if (item[keys[0]] && item[keys[1]] && values[1]) {
                return (item[keys[0]] === values[0] && item[keys[1]] === values[1])
              }
              else if (item[keys[0]] && item[keys[1]] && item[keys[2]] && values[2]) {
                return (item[keys[0]] === values[0] && item[keys[1]] === values[1] && item[keys[2]] === values[2])
              }
              else {
                return item[keys[0]] === values[0]
              }
            })
            if (filtered.length > 1) {
              throw new Error("Cannot Update! Found more than one document with same details")
            }
            else if (filtered.length === 1) {
              const id = filtered[0]._id;
              const updatedData = {
                ...data,
                [this.collection.name!]: {
                  ...data[this.collection.name!]!,
                  [id]: { _id: id, ...filtered[0], ...update }
                },
              };
              const encrypted = encrypt(JSON.stringify(updatedData), this.collection.encryptionKey!)
              fs.writeFileSync("./rdata/db", encrypted, "utf8");
              return updatedData[this.collection.name!][id];
            }
            else {
              throw new Error("Document Not Found!!")
            }
          }
          else {
            throw new Error("Collection Not Found!!")
          }

        }
      }

    } catch (error: any) {
      throw new Error(error.message)
    }
  }


  get(filter: Object) {
    try {
      const file = fs.readFileSync("./rdata/db", "utf8");
      if (Object.keys(filter).length === 0) {
        if (file.trim().length !== 0) {
          const data = JSON.parse(decrypt(file, this.collection.encryptionKey!));
          if (data[this.collection.name!]) {
            const collection = Object.values(data[this.collection.name!])
            return collection
          }
          else {
            throw new Error("Collection Not Found!!")
          }

        }
      }
      else {
        if (file.trim().length !== 0) {
          const data = JSON.parse(decrypt(file, this.collection.encryptionKey!));
          if (data[this.collection.name!]) {
            const collection = Object.values(data[this.collection.name!])
            const keys = Object.keys(filter);
            const values = Object.values(filter)
            const filtered: any[] = collection.filter((item: any) => {
              if (item[keys[0]] && item[keys[1]] && values[1]) {
                return (item[keys[0]] === values[0] && item[keys[1]] === values[1])
              }
              else if (item[keys[0]] && item[keys[1]] && item[keys[2]] && values[2]) {
                return (item[keys[0]] === values[0] && item[keys[1]] === values[1] && item[keys[2]] === values[2])
              }
              else {
                return item[keys[0]] === values[0]
              }
            })
            if (filtered.length === 1) {
              return filtered[0]
            }
            else if (filtered.length > 1) {
              return filtered
            }
            else {
              throw new Error("Document Not Found!!")
            }
          }
          else {
            throw new Error("Collection Not Found!!")
          }

        }
      }

    } catch (error: any) {
      throw new Error(error.message)
    }
  }

  deleteOne(filter: Object) {
    try {
      const file = fs.readFileSync("./rdata/db", "utf8");
      if (Object.keys(filter).length === 0) {
        throw new Error("filter is required")
      }
      else {
        if (file.trim().length !== 0) {
          const data = JSON.parse(decrypt(file, this.collection.encryptionKey!));
          if (data[this.collection.name!]) {
            const collection = Object.values(data[this.collection.name!])
            const keys = Object.keys(filter);
            const values = Object.values(filter)
            const filtered: any[] = collection.filter((item: any) => {
              if (item[keys[0]] && item[keys[1]] && values[1]) {
                return (item[keys[0]] === values[0] && item[keys[1]] === values[1])
              }
              else if (item[keys[0]] && item[keys[1]] && item[keys[2]] && values[2]) {
                return (item[keys[0]] === values[0] && item[keys[1]] === values[1] && item[keys[2]] === values[2])
              }
              else {
                return item[keys[0]] === values[0]
              }
            })
            if (filtered.length > 1) {
              throw new Error("Cannot Delete! Found more than one document with same details")
            }
            if (filtered.length === 1) {
              const id = filtered[0]._id;
              let updatedData = data;
              delete updatedData[this.collection.name!][id]
              const encrypted = encrypt(JSON.stringify(updatedData), this.collection.encryptionKey!)
              fs.writeFileSync("./rdata/db", encrypted, "utf8")
              return id
            } else {
              throw new Error("Document Not Found!!")
            }
          }
          else {
            throw new Error("Collection Not Found!!")
          }

        }
      }
    } catch (error: any) {
      throw new Error(error.message)
    }
  }


  deleteAll() {
    try {
      const file = fs.readFileSync("./rdata/db", "utf8");
      if (file.trim().length !== 0) {
        const data = JSON.parse(decrypt(file, this.collection.encryptionKey!));
        let updatedData = data;
        if (data[this.collection.name!]) {
          delete updatedData[this.collection.name!];
          const encrypted = encrypt(JSON.stringify(updatedData), this.collection.encryptionKey!)
          fs.writeFileSync("./rdata/db", encrypted, "utf8")
          return true
        }
        else {
          throw new Error("Collection Not Found!!")
        }
      }
    } catch (error: any) {
      throw new Error(error.message)
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
