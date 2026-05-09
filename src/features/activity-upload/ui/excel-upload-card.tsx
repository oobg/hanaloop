"use client";

import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  RefreshCw,
  Upload,
  X,
} from "lucide-react";
import { useId, useRef, useState } from "react";

import { validateXlsxFile } from "@/features/activity-upload/model/xlsx-file-validation";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";

type FileSelectionStatus = "idle" | "validating" | "selected" | "rejected";

function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function formatModifiedAt(timestamp: number) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

export function ExcelUploadCard() {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const validationRequestIdRef = useRef(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rejectedFileName, setRejectedFileName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const selectionStatus: FileSelectionStatus = isValidating
    ? "validating"
    : errorMessage
    ? "rejected"
    : selectedFile
      ? "selected"
      : "idle";

  const clearNativeFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const openFilePicker = () => {
    clearNativeFileInput();
    fileInputRef.current?.click();
  };

  const rejectFile = (fileName: string | null, message: string) => {
    setSelectedFile(null);
    setRejectedFileName(fileName);
    setErrorMessage(message);
    clearNativeFileInput();
  };

  const selectFile = async (file: File | undefined, fileCount = 0) => {
    if (!file) {
      return;
    }

    if (fileCount > 1) {
      rejectFile(null, "한 번에 하나의 .xlsx 파일만 선택할 수 있습니다.");

      return;
    }

    const validationRequestId = validationRequestIdRef.current + 1;
    validationRequestIdRef.current = validationRequestId;
    setSelectedFile(null);
    setRejectedFileName(null);
    setErrorMessage(null);
    setIsValidating(true);

    const result = await validateXlsxFile(file).catch(() => ({
      ok: false as const,
      message: "파일을 읽는 중 문제가 발생했습니다. 파일을 다시 선택하세요.",
    }));

    if (validationRequestIdRef.current !== validationRequestId) {
      return;
    }

    setIsValidating(false);

    if (!result.ok) {
      rejectFile(file.name, result.message);

      return;
    }

    setSelectedFile(file);
    setRejectedFileName(null);
    setErrorMessage(null);
  };

  const resetFile = () => {
    setSelectedFile(null);
    setRejectedFileName(null);
    setErrorMessage(null);
    setIsValidating(false);
    validationRequestIdRef.current += 1;

    clearNativeFileInput();
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <CardTitle>Excel 활동 데이터 업로드</CardTitle>
            <CardDescription>
              제품별 전기, 원소재, 운송 활동량을 .xlsx 파일로 등록합니다.
            </CardDescription>
          </div>
          <Badge variant="outline">.xlsx</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <label
          htmlFor={inputId}
          className={cn(
            "flex min-h-40 cursor-pointer flex-col items-center justify-center gap-3 rounded-md border border-dashed border-input bg-muted/35 px-4 py-8 text-center transition-colors",
            "hover:border-ring hover:bg-muted/60",
            "focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30",
            isDragActive && "border-ring bg-muted",
            errorMessage && "border-destructive/70",
            selectedFile && "border-primary/50 bg-secondary/50",
          )}
          aria-describedby={`${inputId}-help ${inputId}-status`}
          onDragEnter={(event) => {
            event.preventDefault();
            setIsDragActive(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setIsDragActive(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragActive(false);
            void selectFile(
              event.dataTransfer.files.item(0) ?? undefined,
              event.dataTransfer.files.length,
            );
          }}
        >
          <input
            ref={fileInputRef}
            id={inputId}
            className="sr-only"
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={(event) => {
              void selectFile(
                event.target.files?.item(0) ?? undefined,
                event.target.files?.length ?? 0,
              );
            }}
          />
          <span className="flex size-11 items-center justify-center rounded-md border border-border bg-card">
            <Upload className="size-5" aria-hidden="true" />
          </span>
          <span className="text-sm font-medium">
            파일을 끌어오거나 클릭해서 선택
          </span>
          <span
            id={`${inputId}-help`}
            className="text-muted-foreground max-w-md text-xs leading-relaxed"
          >
            첫 행은 헤더로 유지하고, 제품 코드·일자·활동 유형·활동량·단위
            열을 포함한 활동 데이터 파일을 사용합니다.
          </span>
        </label>

        {errorMessage ? (
          <p
            className="text-destructive text-sm"
            id={`${inputId}-error`}
            role="alert"
          >
            {errorMessage}
          </p>
        ) : null}

        <div
          id={`${inputId}-status`}
          className="rounded-md border border-border bg-background p-4"
          aria-live="polite"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 gap-3">
              <FileStatusIcon status={selectionStatus} />
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">선택 파일 상태</p>
                  <FileStatusBadge status={selectionStatus} />
                </div>
                <FileStatusDescription
                  errorMessage={errorMessage}
                  rejectedFileName={rejectedFileName}
                  isValidating={isValidating}
                  selectedFile={selectedFile}
                />
              </div>
            </div>

            <FileStatusActions
              hasError={Boolean(errorMessage)}
              hasSelectedFile={Boolean(selectedFile)}
              isValidating={isValidating}
              onReset={resetFile}
              onReselect={openFilePicker}
            />
          </div>

          {isValidating ? (
            <div className="mt-4 rounded-md border border-border bg-muted/30 p-3 text-sm">
              파일 형식을 확인하고 있습니다.
            </div>
          ) : selectedFile ? (
            <div className="mt-4 grid gap-3 rounded-md border border-primary/25 bg-secondary/40 p-3 text-sm sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <div className="min-w-0">
                <p className="truncate font-medium">{selectedFile.name}</p>
                <p className="text-muted-foreground text-xs tabular-nums">
                  {formatFileSize(selectedFile.size)} · 수정일{" "}
                  {formatModifiedAt(selectedFile.lastModified)}
                </p>
              </div>
              <div className="text-primary flex items-center gap-1.5 text-sm font-medium">
                <CheckCircle2 aria-hidden="true" />
                업로드 준비 완료
              </div>
            </div>
          ) : errorMessage ? (
            <div className="mt-4 rounded-md border border-destructive/25 bg-destructive/5 p-3 text-sm">
              <p className="font-medium">선택한 파일을 사용할 수 없습니다.</p>
              <p className="text-muted-foreground mt-1">
                안내된 오류를 확인한 뒤 다른 .xlsx 파일을 다시 선택하세요.
              </p>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function FileStatusActions({
  hasError,
  hasSelectedFile,
  isValidating,
  onReset,
  onReselect,
}: {
  hasError: boolean;
  hasSelectedFile: boolean;
  isValidating: boolean;
  onReset: () => void;
  onReselect: () => void;
}) {
  if (isValidating) {
    return null;
  }

  if (hasError) {
    return (
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={onReselect}>
          <RefreshCw aria-hidden="true" />
          다른 파일 선택
        </Button>
        <Button type="button" variant="ghost" onClick={onReset}>
          <X aria-hidden="true" />
          오류 지우기
        </Button>
      </div>
    );
  }

  if (hasSelectedFile) {
    return (
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={onReselect}>
          <RefreshCw aria-hidden="true" />
          파일 바꾸기
        </Button>
        <Button type="button" variant="ghost" onClick={onReset}>
          <X aria-hidden="true" />
          선택 초기화
        </Button>
      </div>
    );
  }

  return null;
}

function FileStatusIcon({ status }: { status: FileSelectionStatus }) {
  if (status === "validating") {
    return (
      <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <Clock className="size-5" aria-hidden="true" />
      </span>
    );
  }

  if (status === "selected") {
    return (
      <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary text-foreground">
        <FileSpreadsheet className="size-5" aria-hidden="true" />
      </span>
    );
  }

  if (status === "rejected") {
    return (
      <span className="text-destructive flex size-10 shrink-0 items-center justify-center rounded-md bg-destructive/10">
        <AlertCircle className="size-5" aria-hidden="true" />
      </span>
    );
  }

  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
      <Clock className="size-5" aria-hidden="true" />
    </span>
  );
}

function FileStatusBadge({ status }: { status: FileSelectionStatus }) {
  if (status === "validating") {
    return <Badge variant="outline">검증 중</Badge>;
  }

  if (status === "selected") {
    return <Badge>선택 완료</Badge>;
  }

  if (status === "rejected") {
    return <Badge variant="outline">형식 오류</Badge>;
  }

  return <Badge variant="outline">대기 중</Badge>;
}

function FileStatusDescription({
  errorMessage,
  isValidating,
  rejectedFileName,
  selectedFile,
}: {
  errorMessage: string | null;
  isValidating: boolean;
  rejectedFileName: string | null;
  selectedFile: File | null;
}) {
  if (isValidating) {
    return (
      <p className="text-muted-foreground text-sm">
        확장자, MIME 유형, 파일 크기, .xlsx 시그니처를 확인하고 있습니다.
      </p>
    );
  }

  if (selectedFile) {
    return (
      <p className="text-muted-foreground text-sm">
        파일 선택이 완료되었습니다. 다음 단계에서 서버 임포트 검증을 진행할 수
        있습니다.
      </p>
    );
  }

  if (errorMessage) {
    return (
      <p className="text-muted-foreground text-sm">
        {rejectedFileName ? `${rejectedFileName} · ` : null}
        {errorMessage}
      </p>
    );
  }

  return (
    <p className="text-muted-foreground text-sm">
      아직 선택된 파일이 없습니다. 드래그 앤 드롭 또는 파일 선택으로 .xlsx
      활동 데이터 파일을 지정하세요.
    </p>
  );
}
