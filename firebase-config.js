// Pega aquí exactamente el objeto firebaseConfig que te entrega Firebase.
export const firebaseConfig = {
  apiKey: "PON_AQUI",
  authDomain: "PON_AQUI.firebaseapp.com",
  projectId: "PON_AQUI",
  storageBucket: "PON_AQUI.firebasestorage.app",
  messagingSenderId: "PON_AQUI",
  appId: "PON_AQUI"
};

export const firebaseReady =
  !Object.values(firebaseConfig).some(v => String(v).includes("PON_AQUI"));
