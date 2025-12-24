import { Console } from "@/shared-libs/utils/console";
import { Href, useRouter } from "expo-router";
import { useState } from "react";

export const useMyNavigation = () => {
    const router = useRouter()
    const [backStack, setbackStack] = useState<any[]>([])

    const push = (newPath: Href) => {
        setbackStack([...backStack, newPath])
        console.log("Addind back Stack", backStack);
        router.push(newPath);
    };
    const replace = (newPath: Href) => {
        console.log("Replace back Stack", backStack);
        router.replace(newPath);
    };
    const canGoBack = () => {
        return router.canGoBack()
    };
    const back = () => {
        console.log("Going back Stack", backStack);
        backStack.pop()
        router.back()
    }
    const resetAndNavigate = (newPath: Href) => {
        console.log("Reset and Navigate back Stack", backStack);
        try {
            router.dismissAll();
        } catch (e) {
            Console.log("resetAndNavigate - dismissAll failed", e)
        }

        router.replace(newPath);
    };


    return {
        push,
        replace,
        canGoBack,
        back,
        resetAndNavigate
    }
}