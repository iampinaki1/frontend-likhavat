import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/Appcontext.jsx";
import { toast } from "sonner";
import { Feather } from "lucide-react";

export function CreatePoemPage() {
  const { currentUser, addPoem } = useApp();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [subject, setSubject] = useState("");

  const subjects = [
    "Love",
    "Nature",
    "Life",
    "Hope",
    "Sadness",
    "Joy",
    "Freedom",
    "Dreams",
    "Peace",
    "Change",
    "Other",
  ];

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!currentUser) {
      toast.error("You must be logged in to create a poem");
      return;
    }

    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    if (!content.trim()) {
      toast.error("Please enter poem content");
      return;
    }

    if (!subject) {
      toast.error("Please select a subject");
      return;
    }

    const newPoem = {
      id: Date.now().toString(),
      title: title.trim(),
      content: content.trim(),
      author: currentUser.id,
      authorName: currentUser.username,
      authorProfilePic: currentUser.profilePic,
      subject,
      likes: [],
      createdAt: new Date(),
    };

    addPoem(newPoem);
    toast.success("Poem created successfully!");
    navigate("/poems");
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div
        className="rounded-xl border shadow-sm overflow-hidden"
        style={{ backgroundColor: "#FFF8ED", borderColor: "#E5D4C1" }}
      >
        <div style={{ backgroundColor: "#FFFFFF", borderBottom: "1px solid #E5D4C1" }} className="p-6">
          <div className="flex items-center space-x-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "#D4A574" }}
            >
              <Feather className="w-6 h-6 text-white" />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 leading-none mb-1.5">Create Poem</h1>
              <p className="text-sm text-gray-500">
                Share your poetic expression with the world
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Title */}
            <div className="space-y-2 flex flex-col">
              <label htmlFor="title" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-700">Title *</label>
              <input
                id="title"
                placeholder="Give your poem a beautiful title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="flex h-10 w-full rounded-md border px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                style={{ backgroundColor: "#FFFFFF", borderColor: "#E5D4C1", "--tw-ring-color": "#D4A574" }}
              />
            </div>

            {/* Subject */}
            <div className="space-y-2 flex flex-col">
              <label htmlFor="subject" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-700">Subject *</label>
              <select
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="flex h-10 w-full items-center justify-between rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                style={{ backgroundColor: "#FFFFFF", borderColor: "#E5D4C1", "--tw-ring-color": "#D4A574" }}
              >
                <option value="" disabled>Choose a subject...</option>
                {subjects.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>

            {/* Poem Content */}
            <div className="space-y-2 flex flex-col">
              <label htmlFor="content" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-700">Poem *</label>
              <textarea
                id="content"
                placeholder={`Write your poem here...\n\nLet your words flow like a river,\nEach line a story to deliver...`}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={16}
                className="flex min-h-[80px] w-full rounded-md border bg-background px-3 py-2 ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-serif text-base leading-relaxed resize-none transition-colors"
                style={{ backgroundColor: "#FFFFFF", borderColor: "#E5D4C1", "--tw-ring-color": "#D4A574" }}
              />

              <p className="text-sm text-gray-500 text-right mt-1.5">
                {content.split("\n").length} lines •{" "}
                {content.trim().split(/\s+/).filter((w) => w).length} words
              </p>
            </div>

            {/* Preview */}
            {(title || content) && (
              <div className="space-y-2 mt-8">
                <h3 className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-700">Preview</h3>
                <div
                  className="rounded-xl border shadow-sm p-6"
                  style={{ backgroundColor: "#FFFFFF", borderColor: "#E5D4C1" }}
                >
                  {title && (
                    <h3
                      className="text-2xl font-serif mb-4 font-semibold"
                      style={{ color: "#333333" }}
                    >
                      {title}
                    </h3>
                  )}

                  {subject && (
                    <div className="mb-4 flex">
                      <span
                        className="px-3 py-1 rounded-full text-xs font-medium text-white shadow-sm"
                        style={{ backgroundColor: "#D4A574" }}
                      >
                        {subject}
                      </span>
                    </div>
                  )}

                  {content && (
                    <p className="whitespace-pre-wrap font-serif text-gray-800 leading-relaxed">
                      {content}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Buttons */}
            <div
              className="flex space-x-4 pt-6 border-t mt-6"
              style={{ borderColor: "#E5D4C1" }}
            >
              <button
                type="submit"
                className="flex-1 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 hover:opacity-90 shadow-sm"
                style={{ backgroundColor: "#D4A574", color: "#FFFFFF" }}
              >
                <Feather className="w-4 h-4 mr-2" />
                Publish Poem
              </button>

              <button
                type="button"
                onClick={() => navigate("/")}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border bg-background hover:bg-gray-100 hover:text-accent-foreground h-10 px-4 py-2 shadow-sm text-gray-700"
                style={{ borderColor: "#E5D4C1" }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreatePoemPage;