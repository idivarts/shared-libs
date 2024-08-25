import { addDoc, collection, doc, setDoc } from "firebase/firestore";
import { FirestoreDB } from "../../../utilities/firestore";
import { IMembers } from "../models/members";
import { IOrganizations } from "../models/organizations";
import { IUser } from "../models/users";

FirestoreDB

const AddUser = async (userId: string) => {
    let user: IUser = {
        email: "test@gmail.com",
        name: "User Name"
    }

    const docRef = doc(FirestoreDB, "users", userId)
    await setDoc(docRef, user)
}

const CreateNewOrganization = async (userId: string) => {
    let org: IOrganizations = {
        name: "",
        createdAt: Date.now(),
        createdBy: userId
    }
    const colRef = collection(FirestoreDB, "organizations")
    let docData = await addDoc(colRef, org)

    let member: IMembers = {
        userId: userId,
        organizationId: docData.id,
        permissions: {
            admin: true
        }
    }
    const memberColRef = collection(FirestoreDB, "organization", docData.id, "members")
    const memberRef = doc(memberColRef, userId)

    let memberData = await setDoc(memberRef, member)
}