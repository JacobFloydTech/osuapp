/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
const functions = require('firebase-functions')
const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');


const serviceConfig = {
    "type": process.env.type,
    "project_id": process.env.project_id,
    "private_key_id": process.env.private_key_id,
    "private_key": process.env.private_key,
    "client_email": process.env.client_email,
    "client_id": process.env.client_id,
    "auth_uri": process.env.auth_uri,
    "token_uri": process.env.token_uri,
    "auth_provider_x509_cert_url": process.env.auth_provider_x509_cert_url,
    "client_x509_cert_url": process.env.client_x509_cert_url,
    "universe_domain": process.env.universe_domain
}




var serviceAccount = require(serviceConfig);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

async function readToken() {
    const reqDoc = db.collection('osuKeyDatabase').doc('osuKey');
    const snapShot = await reqDoc.get();
    const { Token } = await snapShot.data();
    return Token;
}

const app = express();
app.use(cors({ origin: 'http://localhost:3000' }))

app.get('/', async (req, res) => {

    console.log("testing...")
    return res.json({ test: 'hi' })
})

app.post('/', async (req, res) => {
    let user = JSON.parse(req.body).user;

    let url = 'https://osu.ppy.sh/api/v2/users/' + user;

    const key = await readToken();
    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${key}`,
            'Accept': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
        }
    })
    const data = await response.json()
    return res.json(data)
})

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });


exports.app = functions.https.onRequest(app);
exports.scheduledFunctions = functions.pubsub.schedule('0 0 * * *').onRun(() => {
    setToken();
})



async function Auth() {
    const url = 'https://osu.ppy.sh/oauth/token';
    const params = new URLSearchParams({
        client_id: process.env.OSU_CLIENT_ID,
        client_secret: process.env.OSU_CLIENT_SECRET,
        grant_type: 'client_credentials',
        scope: 'public',
    });
    const req = await fetch(url, {
        method: "POST",


        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: params

    })

    const { access_token } = await req.json();
    return access_token;
}




async function setToken() {
    const token = await Auth();
    setDoc(osuDoc, {
        Token: token
    });
}


