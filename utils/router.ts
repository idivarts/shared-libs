import { Console } from "@/shared-libs/utils/console";
import { Href, useRouter } from "expo-router";

export const useMyNavigation = () => {
  const router = useRouter()

  const push = (newPath: Href) => {
    router.push(newPath);
  };
  const replace = (newPath: Href) => {
    router.replace(newPath);
  };
  const canGoBack = () => {
    return router.canGoBack()
  };
  const back = () => {
    router.back()
  }
  const resetAndNavigate = (newPath: Href) => {
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