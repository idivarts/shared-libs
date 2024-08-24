import { addDoc, collection, getDocs } from "firebase/firestore";
import { FirestoreDB } from "../../../utilities/firestore";
import { IUser } from "../models/users";

test('Fetching Users', async () => {
    const querySnapshot = await getDocs(collection(FirestoreDB, "users"));
    querySnapshot.docs.forEach((doc) => {
        console.log(`${doc.id} => ${JSON.stringify(doc.data())}`);
    });
    expect(querySnapshot.docs).toHaveLength(1)
})

test('Pushing Users', async () => {
    const snapshot = await addDoc(collection(FirestoreDB, "users"), <IUser>{
        name: "Rahul Sinha",
        email: "rahult2@yopmail.com",
        username: "no-userName"
    });
    console.log("Snapshot ID", snapshot.id)
})