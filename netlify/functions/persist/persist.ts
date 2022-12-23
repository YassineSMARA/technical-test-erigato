import { Handler } from '@netlify/functions'
import {Nft} from "../../../src/interface";
import firebase, {ServiceAccount} from 'firebase-admin';

function getDb() {
  let app: firebase.app.App;
  if (!firebase.apps.length) {
    const serviceAccount = require('../serviceAccountKey.json');
    app = firebase.initializeApp({
      credential: firebase.credential.cert(serviceAccount as ServiceAccount),
    });
  } else {
    app = firebase.app(); // if already initialized, use that one
  }
  return firebase.firestore(app);
}

interface Body {
  nfts: Nft;
  owner: string;
}

export const handler: Handler = async (event, _) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  if (!event.body) {
    return { statusCode: 400, body: 'Bad Request' }
  }

  const data: Body = JSON.parse(event.body);

  // Validate data here

  const firestore = getDb();

  try {
    // In real world, you should check if the owner exists first and update data
    await firestore.collection('saved_nfts').add(data);
    return { statusCode: 200, body: 'Ok' }
  } catch (error) {
    return { statusCode: 500, body: 'Error while persisting data' }
  }
}
