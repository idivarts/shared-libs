import { FirestoreDB } from "../../../utilities/firestore";
import { collection, getDocs } from "firebase/firestore";

test('Fetching Users', async () => {
    const querySnapshot = await getDocs(collection(FirestoreDB, "users"));
    querySnapshot.docs.forEach((doc) => {
        console.log(`${doc.id} => ${JSON.stringify(doc.data())}`);
    });
    expect(querySnapshot.docs).toHaveLength(1)
})