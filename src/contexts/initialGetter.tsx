import { ReactNode, useEffect, useRef, useState } from "react";
import { overrideStorage, saveFromApp } from "@/lib/utils/storage";
import { Loader } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Props {
    children: ReactNode;
}

export const InitialGetter = ({ children }: Props) => {
    const [isLoading, setIsLoading] = useState(true);
    const nbTryRef = useRef(0);
    const hasTimedOut = useRef(false);
    const responseReceivedRef = useRef(false);
    const parentReadyRef = useRef(false);
    const initialRequestSentRef = useRef(false);
    const { t } = useTranslation();

    useEffect(() => {
        const MAX_RETRIES = 6;
        const TIMEOUT_MS = 5000; // global timeout 5s
        const READY_WAIT_MS = 600;

        const requestData = () => {
            if (hasTimedOut.current) return;
            if (!initialRequestSentRef.current) {
                initialRequestSentRef.current = true;
            }
            nbTryRef.current += 1;
            responseReceivedRef.current = false;
            console.log(
                `Requesting all data from parent (attempt ${nbTryRef.current}/${MAX_RETRIES})...`
            );
            window.parent.postMessage({ type: "REQUEST_ALL_DATA" }, "*");

            const delay = 200 * nbTryRef.current;
            setTimeout(() => {
                if (hasTimedOut.current || responseReceivedRef.current) return;
                if (nbTryRef.current < MAX_RETRIES) {
                    console.warn(
                        `No response (attempt ${nbTryRef.current}/${MAX_RETRIES}), retrying...`
                    );
                    requestData();
                } else {
                    console.warn("Giving up after 3 failed attempts.");
                    setIsLoading(false);
                }
            }, delay);
        };

        const handleMessage = async (event: MessageEvent) => {
            const { type, key, payload } = event.data ?? {};

            if (type === "PARENT_READY") {
                parentReadyRef.current = true;
                if (isLoading && !initialRequestSentRef.current) {
                    requestData();
                }
                return;
            }

            if (type === "DATA_RESPONSE" && key) {
                console.log("Data received for %s:", key, payload);
                saveFromApp(key, payload);
                return;
            }

            if (type === "ALL_DATA_RESPONSE") {
                responseReceivedRef.current = true;
                console.log("All data received:", payload);

                if (payload["email"]) {
                    overrideStorage(payload as Record<string, string>);
                    setIsLoading(false);
                } else {
                    console.warn(
                        `No email found (attempt ${nbTryRef.current}/${MAX_RETRIES})`
                    );

                    if (
                        nbTryRef.current < MAX_RETRIES &&
                        !hasTimedOut.current
                    ) {
                        const delay = 200 * nbTryRef.current; // 200ms, 400ms, 600ms
                            setTimeout(requestData, delay);
                    } else {
                        console.warn("Giving up after 3 failed attempts.");
                        setIsLoading(false);
                    }
                }
            }
        };

        window.addEventListener("message", handleMessage);

        const isEmbedded = window.parent !== window;
        let readyTimeout: number | undefined;
        if (!isEmbedded) {
            requestData();
        } else {
            readyTimeout = window.setTimeout(() => {
                if (!parentReadyRef.current) {
                    requestData();
                }
            }, READY_WAIT_MS);
        }

        // Global timeout in case parent never answers
        const timeout = setTimeout(() => {
            if (isLoading) {
                hasTimedOut.current = true;
                console.warn("Global timeout reached, skipping data sync.");
                setIsLoading(false);
            }
        }, TIMEOUT_MS);

        return () => {
            window.removeEventListener("message", handleMessage);
            clearTimeout(timeout);
            if (readyTimeout) {
                clearTimeout(readyTimeout);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Minimum splash duration (smooth UX)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (isLoading) return;
        }, 750);
        return () => clearTimeout(timer);
    }, [isLoading]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center text-center justify-center h-screen space-y-4">
                <p>
                    {t("common.loading")}
                    <br />
                    {t("common.loadingWeb")}
                </p>
                <Loader className="w-12 h-12 text-muted-foreground animate-spin" />
            </div>
        );
    }

    return <>{children}</>;
};
