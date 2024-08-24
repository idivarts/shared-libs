import { addDoc, collection, getDocs } from "firebase/firestore";
import { FirestoreDB } from "../../../utilities/firestore";
import { IOrganizations } from "../models/organizations";

test('Fetching Users', async () => {
    const querySnapshot = await getDocs(collection(FirestoreDB, "users"));
    querySnapshot.docs.forEach((doc) => {
        console.log(`${doc.id} => ${JSON.stringify(doc.data())}`);
    });
    expect(querySnapshot.docs).toHaveLength(2)
})

// test('Pushing Users', async () => {
//     const snapshot = await addDoc(collection(FirestoreDB, "users"), <IUser>{
//         name: "Rahul Sinha",
//         email: "rahult2@yopmail.com",
//         username: "no-userName"
//     });
//     console.log("Snapshot ID", snapshot.id)
// })

test('Pushing Users Subcollection', async () => {
    let userId = "hhX7RuaNovor3JLmJG2p"

    const snapshot = await addDoc(collection(FirestoreDB, "users", userId, "organizations"), <IOrganizations>{
        name: "Org Name",
        createdAt: 3264
    });
    console.log("Snapshot ID", snapshot.id)

    // const snap2 = await addDoc(coll)
})