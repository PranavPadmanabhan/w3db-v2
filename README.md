# W3DB-V2 - DECENTRALIZED DATABASE

W3DB-V2 is a decentralised database uses IPFS for managing data 


## Usage

go to [w3db-v2 official page](https://w3db-v2.vercel.app/) and create app for your project

install this package in your project directory

```
   # Yarn

   $ yarn add w3db-v2

```

   OR


``` 
  # npm

  $ npm i w3db-v2

```   


## Creating W3DB-V2 Instance 

   ``` javascript
       const { W3dbV2 } = require("w3db-v2")

       const config = {
          address : // Your Wallet address
          projectId   : // Your ProjectId 
          secret: // Your project secret 
          mumbaiRPC     : // Your polygon mumbai rpc url
       }

       const db = new W3dbV2(config);

        
   ```

## ADDING NEW DOCUMENT 

   ``` javascript
   // adding new collection
   
   const userCollection = db.collection("Users");

   //

  const doc = userCollection.add({ id: "1233434854323485",firstName: "JOHN", lastName: "DOE" });


   ```

## GET ENTIRE COLLECTION

   ``` javascript

     const docs =   userCollection.get({ });

   
   ```



## GET A PARTICULAR DOCUMENT 

   ``` javascript

     const docs =  userCollection.get({ id: "1233434854323485" });

   
   ```

## UPDATING A PARTICULAR DOCUMENT 

   ``` javascript

    const isSuccess =  userCollection.update({ id: "1233434854323485" },{ lastName: "WICK" });

   
   ```


## DELETING A PARTICULAR DOCUMENT 

   ``` javascript

    const deletedId =  userCollection.deleteOne({ id: "1233434854323485" });

   
   ```


## DELETING A COLLECTION 

   ``` javascript

     const isSuccess = userCollection.deleteAll()

   
   ```

## GET IPFS

   ``` javascript

      // returns hash of ipfs
     const hash = await db.getIPFS()

     // returns gateway url of IPFS
     const gateway = await db.getIPFS(true)


   
   ```   

