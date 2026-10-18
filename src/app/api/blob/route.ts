import { list, put, del } from "@vercel/blob";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { blobs } = await list();
    const files = blobs.map((blob) => ({
      url: blob.url,
      pathname: blob.pathname,
      size: blob.size,
      uploadedAt: blob.uploadedAt,
    }));

    const totalSize = blobs.reduce((acc, blob) => acc + blob.size, 0);

    return NextResponse.json({
      files,
      stats: {
        totalFiles: blobs.length,
        totalSize,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "获取文件列表失败" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = formData.get("folder") as string | null;

    if (folder) {
      const result = await put(`${folder}/.folder`, ".", {
        access: "public",
        addRandomSuffix: false,
      });
      return NextResponse.json({
        success: true,
        folder: result.pathname,
      });
    }

    if (!file) {
      return NextResponse.json({ error: "没有文件" }, { status: 400 });
    }

    const folderPath = (formData.get("folderPath") as string) || "";
    const filename = folderPath
      ? `${folderPath}/${file.name}`
      : file.name;

    const blob = await put(filename, file, {
      access: "public",
    });

    return NextResponse.json({
      success: true,
      file: {
        url: blob.url,
        pathname: blob.pathname,
        size: file.size,
        uploadedAt: new Date().toISOString(),
      },
    });
  } catch {
    return NextResponse.json({ error: "上传失败" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: "缺少 URL" }, { status: 400 });
    }
    await del(url);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}