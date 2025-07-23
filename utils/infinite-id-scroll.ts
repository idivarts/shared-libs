import { CollectionReference, DocumentData, documentId, getDocs, query, Query, where } from "firebase/firestore"
import { useEffect, useState } from "react"
import { Console } from "./console"

let lock = false

export const useInfiniteIdScroll = <T>(docIds: string[], queryOrCol: CollectionReference<DocumentData, DocumentData> | Query<DocumentData, DocumentData>,
    perPage = 5) => {

    const [loading, setLoading] = useState(true)
    const [nextAvailable, setNextAvailable] = useState(true)
    const [currentIndex, setCurrentIndex] = useState<number>(0)
    const [scrollToTop, setScrollToTop] = useState(false)

    const [data, setData] = useState<(T & { documentId: string })[]>([])

    const fetchDocuments = async (data: (T & { documentId: string })[]) => {
        if (lock) return
        lock = true

        setLoading(true)

        const idSlice = docIds.slice(currentIndex, currentIndex + perPage)
        const qWhere = where(documentId(), "in", idSlice)
        const docs = await getDocs(query(queryOrCol, qWhere))
        const localData: typeof data = []
        docs.forEach((doc) => {
            localData.push({
                ...(doc.data() as T),
                // name: doc.data().name + " : " + data.length + " - " + doc.id,
                documentId: doc.id
            })
        })
        setCurrentIndex(currentIndex + perPage)

        localData.sort((a, b) => {
            return idSlice.indexOf(a.documentId) - idSlice.indexOf(b.documentId);
        });

        setData([...data, ...localData])
        if (currentIndex + perPage > docIds.length) {
            setNextAvailable(false)
        }
        setLoading(false)
        lock = false
    }

    useEffect(() => {
        lock = false
    }, [])

    useEffect(() => {
        if (docIds.length == 0)
            return
        const q = query(queryOrCol) // Assumes docs have a `createdAt` timestamp
        setCurrentIndex(0)
        setNextAvailable(true)
        setScrollToTop(false)
        setData([])
        fetchDocuments([])
    }, [docIds])

    // useEffect(() => {
    //     if (nextAvailable) {
    //         fetchDocuments([])
    //     }
    // }, [nextAvailable])

    const loadMore = () => {
        fetchDocuments(data)
    }
    const resetData = () => {
        // reset all variables
        setCurrentIndex(0)
        setNextAvailable(true)
        setScrollToTop(false)
        setData([])
        lock = false;
        fetchDocuments([])
    }

    const onScrollEvent = (event: any) => {
        const { nativeEvent } = event
        const paddingToBottom = 200;
        const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
        const isNearBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;

        if (isNearBottom && nextAvailable && !loading) {
            Console.log("Scroll Case", isNearBottom, nextAvailable, !loading, currentIndex);
            fetchDocuments(data)
        }
    }

    return {
        loading,
        data,
        scrollToTop,
        onScrollEvent,
        loadMore,
        resetData,
        nextAvailable
    }

}