import { useRef, useState } from "react";
import { Plus, Trash2, Upload } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { format, isValid, parse } from "date-fns";
import { enUS } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
    PrintFolder,
    deletePrintJobs,
    fetchPrintBalance,
    fetchPrintJobs,
    uploadPrintJob,
} from "@/lib/api/print";
import { getDateLocale } from "@/lib/utils/translations";

const MAX_FILE_SIZE = 100 * 1024 * 1024;
const REFETCH_INTERVAL = 15_000;
const REFRESH_DELAYS = [3_000, 8_000];

interface PendingFile {
    key: string;
    file: File;
    bw: boolean;
    duplex: boolean;
}

// SafeQ always returns dates in English, e.g. "Sep 18, 2026, 6:34 PM"
const formatJobDate = (raw: string, language: string) => {
    const date = parse(raw, "MMM d, yyyy, h:mm a", new Date(), {
        locale: enUS,
    });
    if (!isValid(date)) return raw;
    return format(date, "EEEE d MMM HH'h'mm", {
        locale: getDateLocale(language),
    });
};

const formatEuro = (value: number) => `€ ${value.toFixed(3)}`;

function BalanceSection() {
    const { t } = useTranslation();
    const { data, isLoading } = useQuery({
        queryKey: ["print", "balance"],
        queryFn: async () => {
            const res = await fetchPrintBalance();
            if (!res?.success || !res.data) throw new Error("balance");
            return res.data;
        },
        refetchInterval: REFETCH_INTERVAL,
    });

    return (
        <section className="space-y-3">
            <h2 className="text-lg font-semibold">
                {t("printPage.balance.title")}
            </h2>
            <Card>
                <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">
                        {t("printPage.balance.personal")}
                    </p>
                    {isLoading ? (
                        <Skeleton className="mt-1 h-7 w-40" />
                    ) : (
                        <p className="flex flex-wrap items-baseline gap-x-2 text-xl font-semibold">
                            {data ? formatEuro(data.personal) : "—"}
                            {data && (
                                <span
                                    className="text-base text-green-800 dark:text-green-600"
                                    title={t("printPage.balance.bonus")}
                                >
                                    + {formatEuro(data.bonus)}
                                </span>
                            )}
                        </p>
                    )}
                </CardContent>
            </Card>
            {!isLoading && !data && (
                <p className="text-sm text-destructive">
                    {t("printPage.balance.error")}
                </p>
            )}
        </section>
    );
}

function JobsSection() {
    const { t, i18n } = useTranslation();
    const queryClient = useQueryClient();
    const [folder, setFolder] = useState<PrintFolder>("WAITING");

    const { data: jobs, isLoading, isError } = useQuery({
        queryKey: ["print", "jobs", folder],
        queryFn: async () => {
            const res = await fetchPrintJobs(folder);
            if (!res?.success || !res.data) throw new Error("jobs");
            return res.data;
        },
        refetchInterval: REFETCH_INTERVAL,
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await deletePrintJobs([id]);
            if (!res?.success) throw new Error("delete");
        },
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: ["print", "jobs"] }),
    });

    return (
        <section className="space-y-3">
            <h2 className="text-lg font-semibold">
                {t("printPage.jobs.title")}
            </h2>
            <div className="flex gap-2">
                {(["WAITING", "PRINTED"] as const).map((f) => (
                    <Button
                        key={f}
                        variant={folder === f ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFolder(f)}
                    >
                        {t(
                            f === "WAITING"
                                ? "printPage.jobs.waiting"
                                : "printPage.jobs.printed"
                        )}
                    </Button>
                ))}
            </div>

            {isLoading ? (
                <div className="space-y-2">
                    {[0, 1, 2].map((i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                    ))}
                </div>
            ) : isError ? (
                <p className="text-center text-destructive">
                    {t("printPage.jobs.error")}
                </p>
            ) : jobs && jobs.length > 0 ? (
                <div className="space-y-2">
                    {jobs.map((job) => (
                        <Card key={job.id}>
                            <CardContent className="flex items-center justify-between gap-3 p-3">
                                <div className="min-w-0">
                                    <p className="truncate font-medium">
                                        {job.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatJobDate(
                                            job.date,
                                            i18n.language
                                        )}
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label={t("printPage.jobs.delete")}
                                    disabled={
                                        deleteMutation.isPending &&
                                        deleteMutation.variables === job.id
                                    }
                                    onClick={() =>
                                        deleteMutation.mutate(job.id)
                                    }
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <p className="py-6 text-center text-muted-foreground">
                    {t("printPage.jobs.empty")}
                </p>
            )}
            {deleteMutation.isError && (
                <p className="text-sm text-destructive">
                    {t("printPage.jobs.deleteError")}
                </p>
            )}
        </section>
    );
}

function UploadRow({
    pending,
    onChange,
    onDone,
}: {
    pending: PendingFile;
    onChange: (patch: Partial<PendingFile>) => void;
    onDone: () => void;
}) {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const tooLarge = pending.file.size > MAX_FILE_SIZE;

    const mutation = useMutation({
        mutationFn: async () => {
            const res = await uploadPrintJob(
                pending.file,
                pending.bw,
                pending.duplex
            );
            if (!res?.success) throw new Error("upload");
        },
        onSuccess: () => {
            // SafeQ lists a new job a few seconds after the upload returns
            const refresh = () =>
                queryClient.invalidateQueries({
                    queryKey: ["print", "jobs", "WAITING"],
                });
            refresh();
            REFRESH_DELAYS.forEach((delay) => setTimeout(refresh, delay));
            onDone();
        },
    });

    return (
        <Card>
            <CardContent className="space-y-3 p-3">
                <p className="truncate font-medium">{pending.file.name}</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    {(["bw", "duplex"] as const).map((opt) => (
                        <label
                            key={opt}
                            className="flex items-center gap-2 text-sm"
                        >
                            <Checkbox
                                checked={pending[opt]}
                                onCheckedChange={(v) =>
                                    onChange({ [opt]: v === true })
                                }
                            />
                            {t(`printPage.upload.${opt}`)}
                        </label>
                    ))}
                    <Button
                        size="sm"
                        className="ml-auto"
                        disabled={mutation.isPending || tooLarge}
                        onClick={() => mutation.mutate()}
                    >
                        <Upload className="mr-2 h-4 w-4" />
                        {t(
                            mutation.isPending
                                ? "printPage.upload.sending"
                                : "printPage.upload.send"
                        )}
                    </Button>
                </div>
                {(tooLarge || mutation.isError) && (
                    <p className="text-sm text-destructive">
                        {t(
                            tooLarge
                                ? "printPage.upload.tooLarge"
                                : "printPage.upload.error"
                        )}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

function UploadSection() {
    const { t } = useTranslation();
    const inputRef = useRef<HTMLInputElement>(null);
    const [pending, setPending] = useState<PendingFile[]>([]);

    const handleFiles = (files: FileList | null) => {
        if (!files) return;
        setPending((prev) => [
            ...prev,
            ...Array.from(files).map((file) => ({
                key: crypto.randomUUID(),
                file,
                bw: false,
                duplex: false,
            })),
        ]);
        // Allow re-picking the same file afterwards
        if (inputRef.current) inputRef.current.value = "";
    };

    return (
        <section className="space-y-3">
            <h2 className="text-lg font-semibold">
                {t("printPage.upload.title")}
            </h2>
            <input
                ref={inputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
            />
            <Button variant="outline" onClick={() => inputRef.current?.click()}>
                <Plus className="mr-2 h-4 w-4" />
                {t("printPage.upload.add")}
            </Button>
            <div className="space-y-2">
                {pending.map((p) => (
                    <UploadRow
                        key={p.key}
                        pending={p}
                        onChange={(patch) =>
                            setPending((prev) =>
                                prev.map((x) =>
                                    x.key === p.key ? { ...x, ...patch } : x
                                )
                            )
                        }
                        onDone={() =>
                            setPending((prev) =>
                                prev.filter((x) => x.key !== p.key)
                            )
                        }
                    />
                ))}
            </div>
        </section>
    );
}

export function PrintPage() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    const handleRefresh = async () => {
        await queryClient.refetchQueries({ queryKey: ["print"] });
    };

    return (
        <PullToRefresh
            onRefresh={handleRefresh}
            className="pt-4 sm:px-6 lg:px-0"
            pullingText={t("common.pullToRefresh")}
            refreshingText={t("common.refreshing")}
        >
            <div className="space-y-8">
                <BalanceSection />
                <JobsSection />
                <UploadSection />
            </div>
        </PullToRefresh>
    );
}
