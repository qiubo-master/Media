"use client";

export default function DeleteContentButton({ title }: { title: string }) {
  return <button className="danger-button" type="submit" onClick={(event) => {
    if (!window.confirm(`确定删除作品“${title}”吗？作品下的全部数据也会删除，且无法撤销。`)) event.preventDefault();
  }}>删除作品</button>;
}
