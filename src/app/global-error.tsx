"use client";

import { useEffect, useState } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [stack, setStack] = useState("");
  const [digest, setDigest] = useState<string | undefined>(error.digest);
  const [message, setMessage] = useState(error.message || "未知错误");

  useEffect(() => {
    setStack(error.stack || "");
    setDigest((error as Error & { digest?: string }).digest);
    setMessage(error.message || "未知错误");
    console.error("Global error:", error);
  }, [error]);

  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-screen text-gray-900 p-3 sm:p-6 relative flex items-center justify-center">
        <div className="w-full max-w-2xl space-y-4">
          <div className="card-enter p-5 sm:p-8 rounded-xl bg-white/80 backdrop-blur-xl border border-gray-200/60 shadow-sm">
            <div className="flex items-center gap-3">
              <img src="/favicon.svg" alt="" className="w-10 h-10 sm:w-12 sm:h-12" />
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-800">
                Cloud Drive
              </h1>
            </div>

            <div className="mt-5 flex items-center gap-2">
              <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-red-100 text-red-600 uppercase tracking-wider">
                页面无法加载
              </span>
              {digest && (
                <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-500">
                  digest: {digest}
                </span>
              )}
            </div>

            <p className="mt-4 text-base sm:text-lg text-red-600 font-medium wrap-break-word">
              {message}
            </p>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2">
                <div className="text-gray-400 text-xs uppercase tracking-wider">错误名称</div>
                <div className="mt-0.5 text-gray-700 wrap-break-word" style={{ fontFamily: '"Cascadia Mono", monospace' }}>
                  {error.name || "Error"}
                </div>
              </div>
              <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2">
                <div className="text-gray-400 text-xs uppercase tracking-wider">错误标识</div>
                <div className="mt-0.5 text-gray-700 wrap-break-word" style={{ fontFamily: '"Cascadia Mono", monospace' }}>
                  {digest || error.digest || "-"}
                </div>
              </div>
            </div>

            {stack && (
              <div className="mt-4">
                <div className="text-gray-400 text-xs uppercase tracking-wider mb-1.5">
                  调用栈
                </div>
                <pre className="max-h-64 overflow-auto rounded-lg bg-gray-900 text-green-400 text-xs leading-relaxed p-3 whitespace-pre-wrap wrap-break-word [scrollbar-none] [&::-webkit-scrollbar]:hidden">
                  {stack}
                </pre>
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => reset()}
                className="px-4 sm:px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white shadow-sm transition-colors text-[14px] sm:text-[16px] font-medium cursor-pointer"
              >
                重新加载
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 sm:px-5 py-2.5 rounded-xl bg-white/70 hover:bg-gray-100/80 text-gray-700 border border-gray-300/50 shadow-sm transition-colors text-[14px] sm:text-[16px] font-medium cursor-pointer"
              >
                刷新页面
              </button>
            </div>

            <p className="mt-6 text-xs text-gray-400 leading-relaxed">
              如果问题持续出现，请将上方「调用栈」信息反馈给管理员。
              <span className="mt-1 block text-amber-600">
                提示：请关闭浏览器扩展 / 翻译功能后重试。
              </span>
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}