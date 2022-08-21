import { initializeApp, getApps } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
    apiKey: 'AIzaSyDcBWMmheioVRfD6qUlz9FL26HHLsSNDfI',
    authDomain: 'workhays-firebase.firebaseapp.com',
    databaseURL: 'https://workhays-firebase.firebaseio.com',
    projectId: 'workhays-firebase',
    storageBucket: 'workhays-firebase.appspot.com',
    messagingSenderId: '154850091334',
    appId: '1:154850091334:web:d04f857e51be6be36fc547',
}

let app

/**
 * If app has not been initialized yet, initialize new firebase app
 */
if (!getApps().length) {
    app = initializeApp(firebaseConfig)
}

export const firebase = app
export const database = getFirestore(app)
