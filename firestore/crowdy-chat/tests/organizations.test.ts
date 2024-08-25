import { assertFails, assertSucceeds, initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { addDoc, collection, doc, Firestore, setDoc } from 'firebase/firestore';
import fs from 'fs';
import { IOrganizationMembers, IOrganizations } from '../models/organizations';

// Load Firestore rules
const rules = fs.readFileSync('firestore/crowdy-chat/firestore.rules', 'utf8');

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
    // Initialize the test environment
    testEnv = await initializeTestEnvironment({
        projectId: 'crowdy-chat',
        firestore: {
            rules,
            host: "localhost",
            port: 8080
        },
    });
});

afterAll(async () => {
    // Clean up the test environment
    await testEnv.cleanup();
});

describe('Firestore Rules - Organizations', () => {
    let aliceFirestore: Firestore, rahulFirestore: Firestore, unauthFirestore: Firestore;

    beforeEach(async () => {
        // Clear Firestore between tests
        // await testEnv.clearFirestore();

        // Create contexts for authenticated and unauthenticated users
        aliceFirestore = <any>testEnv.authenticatedContext('alice').firestore();
        rahulFirestore = <any>testEnv.authenticatedContext('rahul').firestore();
        unauthFirestore = <any>testEnv.unauthenticatedContext().firestore();
    });

    test('should allow inserting new Organization by Alice', async () => {
        const collectionRef = collection(aliceFirestore, 'organizations');
        let data = await assertSucceeds(addDoc(collectionRef, <IOrganizations>{
            name: 'Test3',
            createdAt: Date.now(),
            createdBy: "alice"
        }));
        
        const docRef = doc(aliceFirestore, 'organizations', data.id, "organizationMembers", "alice");
        let member = await assertSucceeds(setDoc(docRef, <IOrganizationMembers>{
            userId:"alice",
            permissions:["admin"],
            organizationId: data.id
        }));
    });
    test('should decline inserting new Organization by Alice', async () => {
        const collectionRef = collection(rahulFirestore, 'organizations');
        await assertFails(addDoc(collectionRef, <IOrganizations>{
            name: 'Test3',
            createdAt: Date.now(),
            createdBy: "alice"
        }));
    });

    // 1yh91NcTVA5C9sPOoWGJ
    // test('Insert Campaigns', async () => {
    //     const orgId = "1yh91NcTVA5C9sPOoWGJ"
    //     const collectionRef = collection(aliceFirestore, 'organizations', orgId, "campaigns");
    //     await assertSucceeds(addDoc(collectionRef, <ICampaigns>{
    //         "name": "Summer Sales Campaign",
    //         "objective": "Increase brand awareness and boost sales during the summer season",
    //         "createdBy": "user123",
    //         "createdAt": 1627903200,
    //         "updatedAt": 1627989600,
    //         "status": 1,
    //         "replySpeed": {
    //             "min": 5,
    //             "max": 10
    //         },
    //         "reminderTiming": {
    //             "min": 1,
    //             "max": 3
    //         },
    //         "chatgpt": {
    //             "prescript": "Welcome to our summer campaign!",
    //             "purpose": "Engage potential customers with exclusive offers.",
    //             "actor": "Sales Representative",
    //             "examples": "Example: 'Hello, check out our latest summer offers!'"
    //         }
    //     }));
    // });


    // test('Check if rahul can write into Alice', async () => {
    //     const docRef = doc(rahulFirestore, 'users', "alice");
    //     await assertFails(setDoc(docRef, { email: "rahul@xyz.vom", name: 'Rahul' }));
    // });
});