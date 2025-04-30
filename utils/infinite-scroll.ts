import { CollectionReference, DocumentData, DocumentSnapshot, getDocs, limit, onSnapshot, query, Query, startAfter } from "firebase/firestore"
import { useEffect, useState } from "react"

export const useInfiniteScroll = <T>(queryOrCol: CollectionReference<DocumentData, DocumentData> | Query<DocumentData, DocumentData>,
    perPage = 10) => {

    const [loading, setLoading] = useState(true)
    const [nextAvailable, setNextAvailable] = useState(true)
    const [after, setAfter] = useState<DocumentSnapshot | undefined>(undefined)
    const [scrollToTop, setScrollToTop] = useState(false)

    const [data, setData] = useState<T[]>([])

    const fetchDocuments = async (data: T[]) => {
        setLoading(true)
        console.log("After", after?.id);

        const docs = await getDocs(query(queryOrCol, ...(after ?
            [startAfter(after), limit(perPage)] :
            [limit(perPage)])))
        docs.forEach((doc) => {
            data.push(doc.data() as T)
        })
        setAfter(docs.docs[docs.docs.length - 1])
        setData([...data])
        if (docs.docs.length != perPage) {
            setNextAvailable(false)
        }
        setLoading(false)
    }

    useEffect(() => {
        const q = query(queryOrCol) // Assumes docs have a `createdAt` timestamp
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const newDocs: T[] = []
            snapshot.docChanges().forEach((change) => {
                if (change.type === "added") {
                    newDocs.push(change.doc.data() as T)
                }
            })
            if (newDocs.length > 0) {
                setScrollToTop(true)
                setTimeout(() => setScrollToTop(false), 5000)
            }
        })

        return () => unsubscribe()
    }, [])

    useEffect(() => {
        if (nextAvailable) {
            fetchDocuments([])
        }
    }, [nextAvailable])

    const onScrollEvent = (event: any) => {
        const { nativeEvent } = event
        const paddingToBottom = 200;
        const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
        const isNearBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;

        if (isNearBottom && nextAvailable && !loading) {
            console.log("Scroll Case", isNearBottom, nextAvailable, !loading, after?.id);
            fetchDocuments(data)
        }
    }

    return {
        loading,
        data,
        scrollToTop,
        onScrollEvent
    }

}