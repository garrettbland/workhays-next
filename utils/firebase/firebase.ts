import GoogleFirebase from 'firebase/app'
import 'firebase/auth'

const firebaseConfig = {
    //...
}

/**
 * If a firebase instance doesn't exist, create one
 */
if (!GoogleFirebase.getApps().length) {
    GoogleFirebase.initializeApp(firebaseConfig)
}

export const firebase = GoogleFirebase
