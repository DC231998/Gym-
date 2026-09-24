import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getFirestore, collection, getDocs, setDoc, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-storage.js";
import { firebaseConfig, firebaseReady } from "./firebase-config.js";

let app=null, db=null, storage=null;
if(firebaseReady){
  app=initializeApp(firebaseConfig);
  db=getFirestore(app);
  storage=getStorage(app);
}
export { firebaseReady, db, storage, collection, getDocs, setDoc, doc, deleteDoc, ref, uploadBytes, getDownloadURL };
