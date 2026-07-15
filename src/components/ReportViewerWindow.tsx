import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import WindowFrame from "./WindowFrame";
import { api } from "../lib/api";

export default function ReportViewerWindow({
  id,
  title,
  zIndex,
  reportId
}: {
  id: string;
  title: string;
  zIndex: number;
  reportId: string;
}) {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getReport(reportId)
      .then(({ report }) => setContent(report.content || "(空报告)"))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [reportId]);

  return (
    <WindowFrame id={id} title={title} zIndex={zIndex} width={760} height={600}>
      <div className="p-6 prose prose-invert prose-sm max-w-none prose-a:text-mint-400">
        {loading && <div className="text-white/50">加载中…</div>}
        {error && <div className="text-red-400">加载失败：{error}</div>}
        {!loading && !error && (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        )}
      </div>
    </WindowFrame>
  );
}
