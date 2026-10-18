"use client";
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface BlobFile {
  url: string;
  pathname: string;
  size: number;
  uploadedAt: Date;
}

interface Stats {
  totalFiles: number;
  totalSize: number;
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Home() {
  const [files, setFiles] = useState<BlobFile[]>([]);
  const [stats, setStats] = useState<Stats>({ totalFiles: 0, totalSize: 0 });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [currentFolder, setCurrentFolder] = useState("");
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sortField, setSortField] = useState<"name" | "date" | "size" | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const isOtherLang = (str: string) => /[^\x00-\x7F]/.test(str);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/blob");
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        setFiles(data.files || []);
        setStats(data.stats || { totalFiles: 0, totalSize: 0 });
      }
    } catch {
      alert("获取文件列表失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles(); // eslint-disable-line react-hooks/set-state-in-effect
  }, [fetchFiles]);

  const getFileIcon = (pathname: string) => {
    const ext = pathname.split(".").pop()?.toLowerCase();
    if (!ext) return "/question.svg";
    const image = [
      "jpg", "jpeg", "png", "gif", "svg",
      "webp", "bmp", "ico", "avif", "heic",
      "heif", "tiff", "raw",
    ];
    const video = [
      "mp4", "avi", "mov", "mkv", "webm",
      "flv", "wmv", "m4v", "3gp", "mpeg",
      "mpg", "vob", "ogv", "rm", "rmvb",
      "asf", "f4v",
    ];
    const music = [
      "mp3", "wav", "flac", "ogg", "aac",
      "wma", "m4a", "amr", "pcm", "aiff",
    ];
    const exe = [
      "exe", "dll", "app", "bin", "msi",
      "apk", "deb", "rpm", "pkg",
    ];
    const archive = [
      "zip", "rar", "7z", "tar", "gz",
      "bz2", "xz", "iso", "dmg",
    ];
    const font = [
      "woff", "woff2", "ttf", "otf", "eot",
    ];
    const general = [
      "ts", "dat", "cfg", "bak", "tmp",
    ];
    const code = [
      "js", "mjs", "jsx", "tsx", "py",
      "java", "c", "cpp", "h", "go",
      "rs", "rb", "php", "swift", "kt",
      "cs", "sh", "sql", "json", "xml",
      "yaml", "yml", "toml", "html", "css",
      "scss", "less", "cmd", "bat", "ps1",
    ];
    const doc = [
      "pdf", "doc", "docx", "xls", "xlsx",
      "ppt", "pptx", "txt", "md", "csv",
      "log", "rtf", "odt", "ods", "odp",
    ];
    if (image.includes(ext)) return "/image.svg";
    if (video.includes(ext)) return "/video.svg";
    if (music.includes(ext)) return "/music.svg";
    if (general.includes(ext)) return "/general.svg";
    if (exe.includes(ext)) return "/executable.svg";
    if (archive.includes(ext)) return "/archive.svg";
    if (font.includes(ext)) return "/font.svg";
    if (code.includes(ext)) return "/code.svg";
    if (doc.includes(ext)) return "/document.svg";
    return "/question.svg";
  };

  const filteredFiles = files.filter((f) => {
    if (!currentFolder) return !f.pathname.includes("/");
    return (
      f.pathname.startsWith(currentFolder + "/") &&
      !f.pathname.slice(currentFolder.length + 1).includes("/")
    );
  });

  const subFolders = currentFolder
    ? []
    : Array.from(
        new Set(
          files
            .filter((f) => f.pathname.includes("/"))
            .map((f) => f.pathname.split("/")[0])
        )
      );

  if (!currentFolder) {
    files
      .filter((f) => f.pathname.includes("/"))
      .forEach((f) => {
        const folder = f.pathname.split("/")[0];
        if (!subFolders.includes(folder)) {
          subFolders.push(folder);
        }
      });
  }

  const handleSort = (field: "name" | "date" | "size") => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const sortedFiles = useMemo(() => {
    const getName = (f: BlobFile) =>
      currentFolder
        ? f.pathname.slice(currentFolder.length + 1)
        : f.pathname;

    if (!sortField) return filteredFiles;

    const otherLang: BlobFile[] = [];
    const ascii: BlobFile[] = [];

    for (const f of filteredFiles) {
      if (isOtherLang(getName(f))) {
        otherLang.push(f);
      } else {
        ascii.push(f);
      }
    }

    ascii.sort((a, b) => {
      let cmp = 0;
      if (sortField === "name") {
        cmp = getName(a).localeCompare(getName(b), "en", { numeric: true });
      } else if (sortField === "date") {
        cmp = new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
      } else if (sortField === "size") {
        cmp = a.size - b.size;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return [...otherLang, ...ascii];
  }, [filteredFiles, sortField, sortDir, currentFolder]);

  const handleUpload = async () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (currentFolder) {
        formData.append("folderPath", currentFolder);
      }
      const res = await fetch("/api/blob", { method: "POST", body: formData });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        alert("上传成功！");
        fetchFiles();
      }
    } catch {
      alert("上传失败");
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    setLoading(true);
    try {
      const formData = new FormData();
      const folderPath = currentFolder
        ? `${currentFolder}/${newFolderName.trim()}`
        : newFolderName.trim();
      formData.append("folder", folderPath);
      const res = await fetch("/api/blob", { method: "POST", body: formData });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        alert("文件夹创建成功！");
        setNewFolderName("");
        setShowNewFolder(false);
        fetchFiles();
      }
    } catch {
      alert("创建文件夹失败");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selected.size === 0) return;
    setLoading(true);
    try {
      for (const url of selected) {
        await fetch("/api/blob", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
      }
      alert(`成功删除 ${selected.size} 个文件！`);
      setSelected(new Set());
      fetchFiles();
    } catch {
      alert("删除失败");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (url: string) => {
    const next = new Set(selected);
    if (next.has(url)) {
      next.delete(url);
    } else {
      next.add(url);
    }
    setSelected(next);
  };

  const toggleSelectAll = () => {
    const allUrls = sortedFiles.map((f) => f.url);
    if (allUrls.every((url) => selected.has(url))) {
      setSelected(new Set());
    } else {
      setSelected(new Set(allUrls));
    }
  };

  const navigateToFolder = (folder: string) => {
    setCurrentFolder((prev) => (prev ? `${prev}/${folder}` : folder));
    setSelected(new Set());
  };

  const goBack = () => {
    if (!currentFolder) return;
    const parts = currentFolder.split("/");
    parts.pop();
    setCurrentFolder(parts.join("/"));
    setSelected(new Set());
  };

  return (
    <div className="min-h-screen text-gray-900 p-3 sm:p-6 relative">
      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2 sm:gap-3 text-gray-800">
            <img src="/favicon.svg" alt="" className="w-9 h-9 sm:w-12 sm:h-12" />
            Cloud Drive
          </h1>
        </header>

        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-0">
          <div className="flex flex-wrap items-center gap-y-2 shrink-0">
          <button
            onClick={handleUpload}
            disabled={loading}
            className="flex items-center gap-1 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-l-xl bg-blue-500 hover:bg-blue-600 text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-[13px] font-medium cursor-pointer"
          >
            <img src="/upload.svg" alt="" className="w-4 h-4 sm:w-5 sm:h-5 invert" />
            <span>上传</span>
          </button>

          <button
            onClick={() => setShowNewFolder(!showNewFolder)}
            disabled={loading}
            className="flex items-center gap-1 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-none bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-[13px] font-medium cursor-pointer"
          >
            <img src="/folder.svg" alt="" className="w-4 h-4 sm:w-5 sm:h-5 invert" />
            <span>新建文件夹</span>
          </button>

          <button
            onClick={fetchFiles}
            disabled={loading}
            className="flex items-center gap-1 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-none bg-white/70 hover:bg-gray-100/80 text-gray-700 border border-gray-300/50 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-[13px] font-medium cursor-pointer"
          >
            <img src="/refresh.svg" alt="" className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>刷新</span>
          </button>

          <button
            onClick={handleDeleteSelected}
            className="flex items-center gap-1 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-r-xl bg-red-500 hover:bg-red-600 text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-[13px] font-medium cursor-pointer"
          >
            <img src="/trash.svg" alt="" className="w-4 h-4 sm:w-5 sm:h-5 invert" />
            <span>删除选中</span>
            {selected.size > 0 && <span>({selected.size})</span>}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
          />
          </div>

          {loading && (
            <div className="progress-track w-full sm:flex-1 sm:ml-4 mt-2 sm:mt-0">
              <div className="progress-bar" />
            </div>
          )}
        </div>

        {showNewFolder && (
          <div className="flex items-center gap-2 p-4 rounded-xl bg-white/80 backdrop-blur-xl border border-gray-200/60">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
              placeholder="输入文件夹名称..."
              className="flex-1 px-3 py-2 rounded-lg bg-gray-100 border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-[13px]"
              autoFocus
            />
            <button
              onClick={handleCreateFolder}
              className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm transition-colors text-[13px] font-medium cursor-pointer"
            >
              创建
            </button>
            <button
              onClick={() => {
                setShowNewFolder(false);
                setNewFolderName("");
              }}
              className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors text-[13px] cursor-pointer"
            >
              取消
            </button>
          </div>
        )}

        <div className="p-4 sm:p-6 rounded-xl bg-white/80 backdrop-blur-xl border border-gray-200/60 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0">
              <svg className="w-16 h-16 sm:w-20 sm:h-20 -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50" cy="50" r="42"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="16"
                />
                <circle
                  cx="50" cy="50" r="42"
                  fill="none"
                  stroke="url(#ringGrad)"
                  strokeWidth="16"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 42}`}
                  strokeDashoffset={`${2 * Math.PI * 42 * (1 - Math.min(stats.totalSize / 10737418240, 1))}`}
                  className="transition-[stroke-dashoffset] duration-700 ease-out"
                />
                <defs>
                  <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#FFD1DC" />
                    <stop offset="50%" stopColor="#87CEEB" />
                    <stop offset="100%" stopColor="#A6E0CF" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-gray-700" style={{ fontFamily: '"Cascadia Mono", monospace' }}>
                  {((stats.totalSize / 10737418240) * 100).toFixed(2)}%
                </span>
              </div>
            </div>
            <div>
              <div className="text-gray-400 text-xs uppercase tracking-wider">存储用量</div>
              <div className="text-sm text-gray-600 mt-0.5" style={{ fontFamily: '"Cascadia Mono", monospace' }}>{formatSize(stats.totalSize)} / 10 GB</div>
            </div>
          </div>

          <div className="h-px sm:w-px sm:h-14 bg-gray-200/80 shrink-0" />

          <div className="flex-1 grid grid-cols-3 gap-4">
            <div>
              <div className="text-gray-400 text-xs uppercase tracking-wider mb-0.5">文件总数</div>
              <div className="text-xl font-bold" style={{ fontFamily: '"Cascadia Mono", monospace' }}>{stats.totalFiles}</div>
            </div>
            <div>
              <div className="text-gray-400 text-xs uppercase tracking-wider mb-0.5">当前目录</div>
              <div className="text-xl font-bold truncate">
                {currentFolder ? currentFolder.split("/").pop() : "根目录"}
              </div>
            </div>
            <div>
              <div className="text-gray-400 text-xs uppercase tracking-wider mb-0.5">已选中</div>
              <div className="text-xl font-bold" style={{ fontFamily: '"Cascadia Mono", monospace' }}>{selected.size}</div>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white/80 backdrop-blur-xl border border-gray-200/60 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
            <button
              onClick={goBack}
              disabled={!currentFolder}
              className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-[13px] cursor-pointer"
            >
              <img src="/arrow-left.svg" alt="" className="w-4 h-4" />
            </button>
            <span className="text-[13px] text-gray-400">
              <img src="/folder.svg" alt="" className="w-4 h-4 opacity-50" />
            {" "}/{currentFolder || ""}
            </span>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <span className="animate-pulse">加载中...</span>
            </div>
          )}

          {!loading && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-500 text-left">
                    <th className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        onChange={toggleSelectAll}
                        checked={
                          sortedFiles.length > 0 &&
                          sortedFiles.every((f) => selected.has(f.url))
                        }
                        className="rounded border-gray-300 bg-white accent-blue-500 cursor-pointer"
                      />
                    </th>
                    <th
                      className="px-4 py-3 font-medium cursor-pointer select-none hover:text-gray-700 transition-colors"
                      onClick={() => handleSort("name")}
                    >
                      名称{sortField === "name" ? (sortDir === "asc" ? " ▲" : " ▼") : " ⇅"}
                    </th>
                    <th
                      className="px-4 py-3 font-medium hidden sm:table-cell cursor-pointer select-none hover:text-gray-700 transition-colors"
                      onClick={() => handleSort("size")}
                    >
                      大小{sortField === "size" ? (sortDir === "asc" ? " ▲" : " ▼") : " ⇅"}
                    </th>
                    <th
                      className="px-4 py-3 font-medium hidden md:table-cell cursor-pointer select-none hover:text-gray-700 transition-colors"
                      onClick={() => handleSort("date")}
                    >
                      上传时间{sortField === "date" ? (sortDir === "asc" ? " ▲" : " ▼") : " ⇅"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {!currentFolder &&
                    subFolders.map((folder) => (
                      <tr
                        key={folder}
                        className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 bg-white accent-blue-500 cursor-pointer invisible"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => navigateToFolder(folder)}
                            className="flex items-center gap-2 text-blue-500 hover:text-blue-600 transition-colors cursor-pointer"
                          >
                            <img src="/folder.svg" alt="" className="w-4 h-4 inline" />
                        {" "}{folder}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-gray-400 hidden sm:table-cell">
                          -
                        </td>
                        <td className="px-4 py-3 text-gray-400 hidden md:table-cell">
                          -
                        </td>
                      </tr>
                    ))}
                  {sortedFiles.map((file) => (
                    <tr
                      key={file.url}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(file.url)}
                          onChange={() => toggleSelect(file.url)}
                          className="rounded border-gray-300 bg-white accent-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3 max-w-50 sm:max-w-xs">
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-blue-500 hover:text-blue-600 transition-colors truncate"
                        >
                          <img
                            src={getFileIcon(file.pathname)}
                            alt=""
                            className="w-5 h-5 inline shrink-0"
                          />
                          <span className="truncate">
                            {currentFolder
                              ? file.pathname.slice(currentFolder.length + 1)
                              : file.pathname}
                          </span>
                        </a>
                      </td>
                      <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">
                        {formatSize(file.size)}
                      </td>
                      <td className="px-4 py-3 text-gray-400 hidden md:table-cell whitespace-nowrap">
                        {formatDate(file.uploadedAt)}
                      </td>
                    </tr>
                  ))}
                  {!currentFolder &&
                    subFolders.length === 0 &&
                    sortedFiles.length === 0 &&
                    !loading && (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-12 text-center text-gray-400"
                        >
                          暂无文件，点击「上传」开始使用 <img src="/favicon.svg" alt="" className="w-5 h-5 inline" />
                        </td>
                      </tr>
                    )}
                  {currentFolder && sortedFiles.length === 0 && !loading && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-12 text-center text-gray-400"
                      >
                        此文件夹为空 <img src="/folder.svg" alt="" className="w-5 h-5 inline opacity-50" />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}