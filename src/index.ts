// Start writing Firebase Functions
// https://firebase.google.com/docs/functions/typescript

import * as functions from 'firebase-functions';
import { OWLTransferIfm, OWLTransfer } from './OWLTranferIfm';

const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

exports.sendUpdatedFcmMessage = functions.firestore
    .document('data/lastest').onUpdate(async (change, context) => {
        const newValue: OWLTransferIfm = extData(change.after.data());
        const previousValue: OWLTransferIfm = extData(change.before.data());
        
        const updatedTeam: string[] = [];
  
        newValue.data.forEach((element: OWLTransfer, index: number) => {
            if(element.archive.length !== previousValue.data[index].archive.length)
                updatedTeam.push(element.team);
        });

        if(updatedTeam.length === 0) {
            console.log('업데이트 목록 없음');
            return;
        }
            

        const tokens: string[] = [];
        const id: string[] = [];

        const db = admin.firestore();

        await db.collection('tokens').get()
            .then((snapshot: any) => {
                snapshot.forEach((doc: any) => {
                    tokens.push(doc.data().firebase_token);
                    id.push(doc.id);
                    // console.log(doc.id, '=>', doc.data());
                });
            })
        .catch((err: any) => {
            console.log('Error getting documents', err);
            response.statusCode = 500;
            response.send(err.message);
        });

        // Check if there are any device tokens.
        if (tokens.length === 0) {
            // tslint:disable-next-line: no-void-expression
            return console.log('There are no notification tokens to send to.');
        }
        console.log('There are', tokens.length, 'tokens to send notifications to.');

        const payload = {
            notification: {
                title: '오버워치 리그 2020 오프시즌 이적 알림',
                body: '',
                icon: '',
            }
        };

        if(updatedTeam.length === 1) {
            payload.notification.body = `${updatedTeam[0]} 이적 정보 업데이트`;
        }
        else {
            payload.notification.body = `${updatedTeam.length}팀의 이적 정보 업데이트`;
        }

        const response = await admin.messaging().sendToDevice(tokens, payload);
        // For each message check if there was an error.
        const tokensToRemove: string[] = [];
        response.results.forEach((result: { error: any; }, index: any) => {
            const error = result.error;
            if (error) {
                console.error('Failure sending notification to', tokens[index], error);
                // Cleanup the tokens who are not registered anymore.
                if (error.code === 'messaging/invalid-registration-token' ||
                    error.code === 'messaging/registration-token-not-registered') {
                    tokensToRemove.push(id[index]);
                }
              }
        });

        db.collection('data').doc('log').update({
            ifms: admin.firestore.FieldValue.arrayUnion({
                updatedTime: new Date().toLocaleString(),
                messages: tokens.length,
                body: payload.notification.body,
            })
        });

        if(tokensToRemove.length > 0) {
            try {
                tokensToRemove.forEach((_id: string) => db.collection('tokens').doc(_id).delete());
                response.statusCode = 404;
                console.log(`${tokens.length} sending notification - ${tokensToRemove.length} deletion completed`);
                response.send(`${tokens.length} sending notification - ${tokensToRemove.length} deletion completed`);
                return;
            } catch(err) {
                response.statusCode = 500;
                console.error(`${tokens.length} sending notification - ${tokensToRemove.length} deletion uncompleted!`);
                console.error(err);
                response.send(err.message);
            }
        }
    });

function extData(data: any): any {
    return JSON.parse(JSON.stringify(data));
}

export const helloWorld = functions.https.onRequest((request, response) => {
    response.send("Hello from Firebase!");
});

export const fcmTest = functions.https.onRequest(async (request, response) => {
    const id: string[] = [];
    const tokens: string[] = [];

        const db = admin.firestore();
        const tokenRef = db.collection('tokens');

        await tokenRef.get()
            .then((snapshot: any) => {
                snapshot.forEach((doc: any) => {
                    tokens.push(doc.data().firebase_token);
                    id.push(doc.id);
                    console.log(doc.id, '=>', doc.data());
                });
            })
        .catch((err: any) => {
            console.log('Error getting documents', err);
            response.statusCode = 500;
            response.send(err.message);
            return;
        });

        // Check if there are any device tokens.
        if (tokens.length === 0) {
            // tslint:disable-next-line: no-void-expression
            console.log('There are no notification tokens to send to.');
            response.statusCode = 500;
            response.send('There are no notification tokens to send to.');
            return;
        }
        console.log('There are', tokens.length, 'tokens to send notifications to.');

        const payload = {
            notification: {
                title: '알림 테스트',
                body: '테스트',

                icon: '',
            }
        };

        const _response = await admin.messaging().sendToDevice(tokens, payload);
        // For each message check if there was an error.
        const tokensToRemove: string[] = [];
        _response.results.forEach((result: { error: any; }, index: any) => {
            const error = result.error;
            if (error) {
                console.error('Failure sending notification to', id[index], error);
                
                // Cleanup the tokens who are not registered anymore.
                if (error.code === 'messaging/invalid-registration-token' ||
                    error.code === 'messaging/registration-token-not-registered') {
                    tokensToRemove.push(id[index]);
                    console.error(`삭제: ${id[index]}`);
                }
                
              }
            });
        if(tokensToRemove.length > 0) {
            try {
                tokensToRemove.map((_id: string) => tokenRef.doc(_id).delete());
                response.statusCode = 404;
                response.send('Failure sending notification - deletion completed');
                return;
            } catch(err) {
                response.statusCode = 500;
                response.send(err.message);
            }
        }
        
        response.statusCode = 200;
        response.send('Successfully sent messages');
});

export const token = functions.https.onRequest((request, response) => {
    if(!(request.method === 'GET'|| 'POST' || 'UPDATE' || 'DELETE')) {
        response.statusCode = 400;
        response.send({message: 'This api is accepted by GET/POST/UPDATE/DELETE method'});
    }

    const db = admin.firestore();
    
    if (request.method === 'GET') {
        const getRef = db.collection('tokens').doc(request.query.value);
        try {
            getRef.get()
                .then((doc: any) => {
                    if (doc.exists) {
                        response.statusCode = 200;
                    }
                    else {
                        response.statusCode = 404;
                        
                    }
                    response.send({permission: doc.exists});
                })
                .catch((err: any) => {
                    console.log('Error getting document', err);
                });
            return;
        } catch(err) {

            response.statusCode = 500;
            response.send(err.message);
            return;
        }
    }

    const ifm: any = request.body;
    const ref = db.collection('tokens').doc(ifm.user_id);

    if (request.method === 'POST' || 'UPDATE') {
        try {
            ref.set(ifm.information);
            
        } catch(err) {
            response.statusCode = 500;
            response.send(err.message);
        }
    } 
    if (request.method === 'DELETE') 
    {
        try {
            ref.delete();
    
        } catch(err) {
            response.statusCode = 500;
            response.send(err.message);
        }
    }
    response.statusCode = 200;
    response.send({reference: ref});
});





