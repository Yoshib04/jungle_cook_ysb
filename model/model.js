// Import from the full Firebase CDN URL
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

import { 
    getFirestore, collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc, query, where 
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCgoSA7HkK3Lpjm645geG4G1F0mZj4wPAU",
  authDomain: "jungle-cook-5d69d.firebaseapp.com",
  projectId: "jungle-cook-5d69d",
  storageBucket: "jungle-cook-5d69d.firebasestorage.app",
  messagingSenderId: "836434215499",
  appId: "1:836434215499:web:98932a9b719fe80fac43ce",
  measurementId: "G-BT2KJZLFHF"
};


const app = initializeApp(firebaseConfig);
const db = getFirestore(app); 


export const auth = getAuth(app);

export async function createRecipe(recipeData) {
    try {
        const docRef = await addDoc(collection(db, "recipes"), recipeData);
        return docRef.id;
    } catch (e) {
        console.error("Error adding document: ", e);
        throw e;
    }
}

export async function getAllRecipes() {
    const querySnapshot = await getDocs(collection(db, "recipes"));
    let recipes = [];
    querySnapshot.forEach((doc) => {
        recipes.push({ id: doc.id, ...doc.data() });
    });
    return recipes;
}

export async function getUserRecipes(uid) {
    const q = query(collection(db, "recipes"), where("uid", "==", uid));
    const querySnapshot = await getDocs(q);
    let recipes = [];
    querySnapshot.forEach((doc) => {
        recipes.push({ id: doc.id, ...doc.data() });
    });
    return recipes;
}

export async function getRecipeById(id) {
    const docRef = doc(db, "recipes", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
    } else {
        throw new Error("No such document!");
    }
}

export async function updateRecipe(id, newData) {
    const recipeRef = doc(db, "recipes", id);
    await updateDoc(recipeRef, newData);
}

export async function deleteRecipe(id) {
    await deleteDoc(doc(db, "recipes", id));
}