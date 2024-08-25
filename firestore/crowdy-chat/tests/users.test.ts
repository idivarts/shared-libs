import { assertFails, assertSucceeds, initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, Firestore, setDoc } from 'firebase/firestore';
import fs from 'fs';

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

describe('Firestore Rules - Users', () => {
    let aliceFirestore: Firestore, rahulFirestore: Firestore, unauthFirestore: Firestore;

    beforeEach(async () => {
        // Clear Firestore between tests
        // await testEnv.clearFirestore();

        // Create contexts for authenticated and unauthenticated users
        aliceFirestore = <any>testEnv.authenticatedContext('alice').firestore();
        rahulFirestore = <any>testEnv.authenticatedContext('rahul').firestore();
        unauthFirestore = <any>testEnv.unauthenticatedContext().firestore();
    });

    test('should allow authenticated users to read/write', async () => {
        const docRef = doc(aliceFirestore, 'users', "alice");
        await assertSucceeds(setDoc(docRef, { email: "myemail@xyz.vom", name: 'Test' }));
    });

    test('Check if rahul can write into Alice', async () => {
        const docRef = doc(rahulFirestore, 'users', "alice");
        await assertFails(setDoc(docRef, { email: "rahul@xyz.vom", name: 'Rahul' }));
    });

    test('should deny unauthenticated users to read/write', async () => {
        const docRef = doc(unauthFirestore, 'your-collection/testDoc');
        await assertFails(setDoc(docRef, { name: 'Test' }));
    });
});