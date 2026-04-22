"use client";

// import type { Metadata } from "next";
import { FormEvent, useEffect, useMemo, useState } from "react";

// export const metadata: Metadata = {
//   title: "Issues",
// };

type IssueStatus = "open" | "closed";

type Issue = {
  id: number;
  title: string;
  description: string;
  labels: string[];
  author: string;
  status: IssueStatus;
  createdAt: string;
  updatedAt: string;
};

type Filter = "all" | IssueStatus;

const STORAGE_KEY = "github-style-issues";
const LABEL_COLORS: Record<string, string> = {
  bug: "bg-red-100 text-red-700 border-red-200",
  enhancement: "bg-emerald-100 text-emerald-700 border-emerald-200",
  question: "bg-blue-100 text-blue-700 border-blue-200",
  docs: "bg-violet-100 text-violet-700 border-violet-200",
};

const SEED_ISSUES: Issue[] = [
  {
    id: 1,
    title: "Navbar mobile menu closes too slowly",
    description:
      "Close animation waits for network response. It should close immediately and sync in background.",
    labels: ["bug"],
    author: "sato",
    status: "open",
    createdAt: "2026-04-20T01:12:00.000Z",
    updatedAt: "2026-04-20T01:12:00.000Z",
  },
  {
    id: 2,
    title: "Add keyboard shortcut for opening command palette",
    description:
      "Support Ctrl/Cmd + K for parity with common developer tools and faster navigation.",
    labels: ["enhancement"],
    author: "tanaka",
    status: "open",
    createdAt: "2026-04-19T03:40:00.000Z",
    updatedAt: "2026-04-19T03:40:00.000Z",
  },
  {
    id: 3,
    title: "README setup section needs Node.js version note",
    description:
      "Several contributors used unsupported Node versions. Add exact version range and pnpm requirement.",
    labels: ["docs", "question"],
    author: "yamada",
    status: "closed",
    createdAt: "2026-04-17T11:06:00.000Z",
    updatedAt: "2026-04-18T06:28:00.000Z",
  },
];

function formatRelative(dateText: string) {
  const deltaMs = Date.now() - new Date(dateText).getTime();
  const deltaMinutes = Math.max(Math.floor(deltaMs / (1000 * 60)), 1);

  if (deltaMinutes < 60) {
    return `${deltaMinutes}m ago`;
  }

  const deltaHours = Math.floor(deltaMinutes / 60);
  if (deltaHours < 24) {
    return `${deltaHours}h ago`;
  }

  const deltaDays = Math.floor(deltaHours / 24);
  return `${deltaDays}d ago`;
}

export default function Home() {
  const [issues, setIssues] = useState<Issue[]>(() => {
    if (typeof window === "undefined") {
      return SEED_ISSUES;
    }

    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return SEED_ISSUES;
    }

    try {
      const parsed = JSON.parse(saved) as Issue[];
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : SEED_ISSUES;
    } catch {
      return SEED_ISSUES;
    }
  });
  const [selectedId, setSelectedId] = useState<number | null>(
    () => SEED_ISSUES[0]?.id ?? null,
  );
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [author, setAuthor] = useState("you");
  const [labelInput, setLabelInput] = useState("bug");

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(issues));
  }, [issues]);

  const filteredIssues = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return issues.filter((issue) => {
      const matchesStatus = filter === "all" || issue.status === filter;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        issue.title.toLowerCase().includes(normalizedQuery) ||
        issue.description.toLowerCase().includes(normalizedQuery);
      return matchesStatus && matchesQuery;
    });
  }, [issues, filter, query]);

  const selectedIssue = filteredIssues.find((issue) => issue.id === selectedId);
  const issueInDetail = selectedIssue ?? filteredIssues[0] ?? null;

  const counts = useMemo(
    () => ({
      all: issues.length,
      open: issues.filter((issue) => issue.status === "open").length,
      closed: issues.filter((issue) => issue.status === "closed").length,
    }),
    [issues],
  );

  const createIssue = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextTitle = title.trim();
    const nextDescription = description.trim();

    if (!nextTitle || !nextDescription) {
      return;
    }

    const nextLabels = labelInput
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);

    const now = new Date().toISOString();
    const issue: Issue = {
      id: Math.max(0, ...issues.map((item) => item.id)) + 1,
      title: nextTitle,
      description: nextDescription,
      labels: nextLabels.length > 0 ? nextLabels : ["question"],
      author: author.trim() || "you",
      status: "open",
      createdAt: now,
      updatedAt: now,
    };

    setIssues((prev) => [issue, ...prev]);
    setSelectedId(issue.id);
    setTitle("");
    setDescription("");
  };

  const toggleIssueStatus = (issueId: number) => {
    setIssues((prev) =>
      prev.map((issue) =>
        issue.id === issueId
          ? {
              ...issue,
              status: issue.status === "open" ? "closed" : "open",
              updatedAt: new Date().toISOString(),
            }
          : issue,
      ),
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 sm:px-8">
      <main className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[360px_1fr]">
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h1 className="text-xl font-semibold">Issue Board</h1>
          <p className="mt-1 text-sm text-slate-600">
            GitHub風の簡易Issue管理アプリ
          </p>

          <form onSubmit={createIssue} className="mt-4 space-y-3">
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500"
              placeholder="Issue title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={120}
              required
            />
            <textarea
              className="h-24 w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500"
              placeholder="Issue description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={500}
              required
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500"
                placeholder="author"
                value={author}
                onChange={(event) => setAuthor(event.target.value)}
                maxLength={40}
              />
              <input
                className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500"
                placeholder="labels (comma separated)"
                value={labelInput}
                onChange={(event) => setLabelInput(event.target.value)}
                maxLength={80}
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              New issue
            </button>
          </form>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2">
              {(["all", "open", "closed"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setFilter(item)}
                  className={`rounded-full border px-3 py-1 text-sm transition ${
                    filter === item
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:border-slate-500"
                  }`}
                >
                  {item} (
                  {item === "all"
                    ? counts.all
                    : item === "open"
                      ? counts.open
                      : counts.closed}
                  )
                </button>
              ))}
            </div>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 md:max-w-xs"
              placeholder="Search issues"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_320px]">
            <ul className="overflow-hidden rounded-lg border border-slate-200">
              {filteredIssues.length === 0 ? (
                <li className="p-6 text-sm text-slate-500">
                  条件に一致するIssueはありません。
                </li>
              ) : (
                filteredIssues.map((issue) => (
                  <li
                    key={issue.id}
                    className={`cursor-pointer border-b border-slate-200 p-4 transition last:border-b-0 ${
                      issueInDetail?.id === issue.id
                        ? "bg-blue-50"
                        : "hover:bg-slate-50"
                    }`}
                    onClick={() => setSelectedId(issue.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">{issue.title}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          #{issue.id} opened by {issue.author} ·{" "}
                          {formatRelative(issue.createdAt)}
                        </p>
                      </div>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
                          issue.status === "open"
                            ? "border-emerald-200 bg-emerald-100 text-emerald-700"
                            : "border-slate-300 bg-slate-100 text-slate-600"
                        }`}
                      >
                        {issue.status}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {issue.labels.map((label) => (
                        <span
                          key={`${issue.id}-${label}`}
                          className={`rounded-full border px-2 py-0.5 text-xs ${LABEL_COLORS[label] ?? "border-slate-200 bg-slate-100 text-slate-700"}`}
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  </li>
                ))
              )}
            </ul>

            <aside className="rounded-lg border border-slate-200 p-4">
              {issueInDetail ? (
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-base font-semibold">
                      {issueInDetail.title}
                    </h2>
                    <span className="text-xs text-slate-500">
                      #{issueInDetail.id}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    {issueInDetail.description}
                  </p>
                  <p className="mt-3 text-xs text-slate-500">
                    Opened by {issueInDetail.author} · Updated{" "}
                    {formatRelative(issueInDetail.updatedAt)}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {issueInDetail.labels.map((label) => (
                      <span
                        key={`detail-${issueInDetail.id}-${label}`}
                        className={`rounded-full border px-2 py-0.5 text-xs ${LABEL_COLORS[label] ?? "border-slate-200 bg-slate-100 text-slate-700"}`}
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleIssueStatus(issueInDetail.id)}
                    className="mt-4 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium transition hover:bg-slate-50"
                  >
                    Mark as{" "}
                    {issueInDetail.status === "open" ? "closed" : "open"}
                  </button>
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  表示するIssueを選択してください。
                </p>
              )}
            </aside>
          </div>
        </section>
      </main>
    </div>
  );
}
